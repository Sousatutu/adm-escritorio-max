(function (root) {
  "use strict";
  const C =
    typeof module !== "undefined" && module.exports
      ? require("../content/catalog.js")
      : root.LB.Content;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value && typeof value === "object")
      return (
        "{" +
        Object.keys(value)
          .sort()
          .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
          .join(",") +
        "}"
      );
    return JSON.stringify(value);
  }
  function current(doc) {
    return (
      doc?.revisions.find((r) => r.revision === doc.currentRevision) || null
    );
  }
  function create(id, fields, reason = "Documento inicial") {
    return {
      id,
      processId: "REQ-001",
      kind: id,
      currentRevision: 1,
      revisions: [
        { revision: 1, fields: clone(fields), attachments: [], reason },
      ],
    };
  }
  function initial() {
    return {
      request: create("request", {
        number: "REQ-001",
        quantity: 5,
        purpose: "Renovar os equipamentos da equipe administrativa",
        justification:
          "Melhorar as condições de trabalho e a execução das atividades",
        registered: false,
        priority: "Ordinária",
      }),
      contract: create("contract", {
        supplier: "Fornecedor original",
        delivery: 30,
        quantity: 5,
        reviewed: false,
      }),
    };
  }
  function revise(state, id, patch, reason, attachments) {
    const doc = state.documents[id];
    if (!doc) throw new Error("Documento inexistente");
    const prev = current(doc),
      fields = { ...prev.fields, ...patch },
      refs = attachments === undefined ? prev.attachments : attachments;
    if (
      canonical(fields) === canonical(prev.fields) &&
      canonical(refs) === canonical(prev.attachments)
    )
      return false;
    doc.currentRevision++;
    doc.revisions.push({
      revision: doc.currentRevision,
      fields: clone(fields),
      attachments: clone(refs),
      reason,
    });
    return true;
  }
  function issue(state, id, fields, reason) {
    if (state.documents[id]) return revise(state, id, fields, reason);
    state.documents[id] = create(id, fields, reason);
    return true;
  }
  function attachmentValid(state, id) {
    const ref = current(state.documents.request).attachments.find(
      (a) => a.documentId === id,
    );
    return !!ref && state.documents[id]?.currentRevision === ref.revision;
  }
  function attach(state, id) {
    const target = state.documents[id];
    if (!target || id === "request" || attachmentValid(state, id)) return false;
    const refs = current(state.documents.request).attachments.filter(
      (a) => a.documentId !== id,
    );
    refs.push({ documentId: id, revision: target.currentRevision });
    return revise(
      state,
      "request",
      {},
      "Anexo atualizado: " + C.documentNames[id],
      refs,
    );
  }
  function activeApproval(state, id) {
    return (
      state.approvals.findLast(
        (a) => a.requirementId === id && a.status === "valid",
      ) || null
    );
  }
  function basis(state, id) {
    const req = current(state.documents.request).fields,
      budget = current(state.documents.budget)?.fields,
      contract = current(state.documents.contract)?.fields;
    const watched = {
      protocol: { number: req.number, registered: req.registered },
      supervisor: {
        quantity: req.quantity,
        purpose: req.purpose,
        justification: req.justification,
      },
      manager: { quantity: req.quantity, budget },
      director: {
        priority: req.priority,
        budgetAttachment: current(state.documents.request).attachments.find(
          (a) => a.documentId === "budget",
        ),
      },
      legal: { contract },
      general: {
        contractAttachment: current(state.documents.request).attachments.find(
          (a) => a.documentId === "contract",
        ),
        delegation: state.flags.directorAway
          ? current(state.documents.delegation)?.fields
          : null,
      },
    };
    const deps = C.requirements
      .find((r) => r.id === id)
      .prerequisites.map((p) => activeApproval(state, p)?.basisDigest || null);
    return canonical({ watched: watched[id], deps });
  }
  function invalidate(state) {
    const invalid = [];
    for (const req of C.requirements) {
      const approval = activeApproval(state, req.id);
      if (
        approval &&
        (approval.basisDigest !== basis(state, req.id) ||
          req.prerequisites.some((p) => !activeApproval(state, p)))
      ) {
        approval.status = "superseded";
        invalid.push(req.id);
      }
    }
    return invalid;
  }
  function missing(state, id) {
    const rule = C.requirements.find((r) => r.id === id),
      reasons = [];
    rule.prerequisites.forEach((p) => {
      if (!activeApproval(state, p))
        reasons.push(
          "Falta aprovação válida: " + C.stages.find((s) => s.id === p).role,
        );
    });
    if (id === "director" && !attachmentValid(state, "budget"))
      reasons.push("Anexe a revisão atual do parecer financeiro à pasta.");
    if (id === "general" && !attachmentValid(state, "contract"))
      reasons.push("Anexe a revisão atual da minuta à pasta.");
    if (
      id === "general" &&
      state.flags.directorAway &&
      !attachmentValid(state, "delegation")
    )
      reasons.push("Anexe a delegação conferida à pasta.");
    return reasons;
  }
  function authorized(state, actorId, role) {
    const actor = C.actors[actorId];
    if (!actor) return false;
    if (
      actor.roles.includes(role) &&
      !(role === "general" && state.flags.directorAway)
    )
      return true;
    const d = current(state.documents.delegation)?.fields,
      b = current(state.documents.budget)?.fields;
    return !!(
      role === "general" &&
      d &&
      d.delegate === actorId &&
      d.role === role &&
      d.process === "REQ-001" &&
      d.validated === true &&
      d.expiresAtAction >= state.actionsUsed &&
      d.limit >= (b?.total || Infinity)
    );
  }
  function grant(state, id, actorId) {
    if (!authorized(state, actorId, id)) throw new Error("Autoridade inválida");
    const rule = C.requirements.find((r) => r.id === id),
      old = activeApproval(state, id);
    if (old) old.status = "superseded";
    state.approvals.push({
      id: "approval-" + (state.approvals.length + 1),
      requirementId: id,
      signerId: actorId,
      authorityRole: id,
      documentId: rule.documentId,
      signedRevision: state.documents[rule.documentId].currentRevision,
      basisDigest: basis(state, id),
      status: "valid",
    });
  }
  function next(state) {
    return C.requirements.find((r) => !activeApproval(state, r.id)) || null;
  }
  function validDocuments(docs) {
    if (
      !docs ||
      typeof docs !== "object" ||
      !docs.request ||
      !docs.contract ||
      Object.keys(docs).some((id) => !Object.hasOwn(C.documentNames, id))
    )
      return false;
    for (const [id, doc] of Object.entries(docs)) {
      if (
        !doc ||
        doc.id !== id ||
        doc.kind !== id ||
        doc.processId !== "REQ-001" ||
        !Array.isArray(doc.revisions) ||
        !doc.revisions.length ||
        doc.revisions.length > 400 ||
        doc.currentRevision !== doc.revisions.length
      )
        return false;
      for (let i = 0; i < doc.revisions.length; i++) {
        const r = doc.revisions[i];
        if (
          !r ||
          r.revision !== i + 1 ||
          typeof r.reason !== "string" ||
          r.reason.length > 500 ||
          !r.fields ||
          typeof r.fields !== "object" ||
          Array.isArray(r.fields) ||
          Object.keys(r.fields).some((k) =>
            ["__proto__", "constructor", "prototype"].includes(k),
          ) ||
          Object.values(r.fields).some(
            (v) =>
              !["string", "number", "boolean"].includes(typeof v) ||
              (typeof v === "number" && !Number.isFinite(v)) ||
              (typeof v === "string" && v.length > 2000),
          ) ||
          !Array.isArray(r.attachments) ||
          r.attachments.length > 4
        )
          return false;
        if (
          !validFields(id, r.fields) ||
          new Set(r.attachments.map((a) => a.documentId)).size !==
            r.attachments.length
        )
          return false;
        for (const a of r.attachments)
          if (
            !a ||
            a.documentId === "request" ||
            !docs[a.documentId] ||
            !Number.isInteger(a.revision) ||
            a.revision < 1 ||
            a.revision > docs[a.documentId].currentRevision ||
            id !== "request"
          )
            return false;
      }
    }
    const req = current(docs.request).fields;
    return (
      Number.isInteger(req.quantity) &&
      req.quantity >= 1 &&
      req.quantity <= 20 &&
      typeof req.purpose === "string" &&
      typeof req.justification === "string" &&
      typeof req.registered === "boolean"
    );
  }
  function validFields(id, f) {
    const str = (v) =>
        typeof v === "string" && v.length > 0 && v.length <= 2000,
      qty = (v) => Number.isInteger(v) && v >= 1 && v <= 20,
      money = (v) => Number.isSafeInteger(v) && v >= 0 && v <= 10000000,
      bool = (v) => typeof v === "boolean";
    const schemas = {
      request: {
        number: (v) => v === "REQ-001",
        quantity: qty,
        purpose: str,
        justification: str,
        registered: bool,
        priority: str,
      },
      contract: {
        supplier: str,
        delivery: (v) => Number.isInteger(v) && v >= 1 && v <= 3650,
        quantity: qty,
        reviewed: bool,
      },
      budget: {
        quantity: qty,
        unitPrice: money,
        total: money,
        available: money,
        validated: bool,
      },
      delegation: {
        delegate: (v) => Object.hasOwn(C.actors, v),
        role: (v) => v === "general",
        process: (v) => v === "REQ-001",
        limit: money,
        expiresAtAction: (v) => Number.isInteger(v) && v >= 0 && v <= 10000,
        validated: bool,
        route: str,
      },
      contingency: {
        number: (v) => v === "CONT-001",
        method: str,
        validated: bool,
      },
    };
    const schema = schemas[id];
    return (
      Object.keys(f).length === Object.keys(schema).length &&
      Object.entries(schema).every(([key, check]) => check(f[key])) &&
      (id !== "budget" || f.total === f.quantity * f.unitPrice)
    );
  }
  const api = {
    clone,
    canonical,
    current,
    create,
    initial,
    revise,
    issue,
    attach,
    attachmentValid,
    activeApproval,
    basis,
    invalidate,
    missing,
    authorized,
    grant,
    next,
    validDocuments,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LB ||= {}).Documents = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
