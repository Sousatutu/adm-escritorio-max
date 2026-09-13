(function (root) {
  "use strict";
  const { Content: C, Documents: D, UI: U } = root.LB,
    E = U.escape;
  const labels = {
    number: "Número",
    quantity: "Computadores",
    purpose: "Finalidade",
    justification: "Justificativa",
    registered: "Registrado",
    priority: "Prioridade",
    supplier: "Fornecedor",
    delivery: "Entrega (dias)",
    reviewed: "Parecer conferido",
    unitPrice: "Valor por unidade",
    total: "Total previsto",
    available: "Verba disponível",
    validated: "Conferência válida",
    delegate: "Responsável designado",
    role: "Competência",
    process: "Processo autorizado",
    limit: "Limite de valor",
    expiresAtAction: "Validade até a ação",
    route: "Encaminhamento",
    method: "Método de recuperação",
  };
  function value(key, v) {
    if (typeof v === "boolean") return v ? "Sim" : "Não";
    if (["unitPrice", "total", "available", "limit"].includes(key))
      return Number(v).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    if (key === "delegate") return C.actors[v]?.name || v;
    if (key === "role") return C.stages.find((s) => s.id === v)?.role || v;
    return v;
  }
  function create({ getSession, dialog, onRefresh, onReturn }) {
    let selected = "request",
      filter = "all",
      revision = null,
      pinned = "request";
    function open() {
      const session = getSession();
      if (!session) return;
      const state = session.state,
        docs = Object.values(state.documents);
      if (!state.documents[selected]) selected = "request";
      const doc = state.documents[selected],
        cur = D.current(doc),
        rev = doc.revisions.find((r) => r.revision === revision) || cur,
        previous = doc.revisions.find((r) => r.revision === rev.revision - 1),
        attached = selected !== "request" && D.attachmentValid(state, selected);
      const visible = docs.filter(
        (d) =>
          filter === "all" ||
          (filter === "revised" && d.revisions.length > 1) ||
          (filter === "pending" &&
            d.id !== "request" &&
            !D.attachmentValid(state, d.id)),
      );
      const changes = previous
        ? Object.keys(rev.fields)
            .filter(
              (k) =>
                JSON.stringify(previous.fields[k]) !==
                JSON.stringify(rev.fields[k]),
            )
            .map(
              (k) =>
                `<li class="change-item"><b>${E(labels[k] || k)}</b><span>${E(value(k, previous.fields[k]))} → ${E(value(k, rev.fields[k]))}</span></li>`,
            )
            .join("")
        : "";
      const signatures =
        selected === "request"
          ? C.requirements
              .map((r) => {
                const a = D.activeApproval(state, r.id),
                  old = state.approvals.some((x) => x.requirementId === r.id);
                return `<div class="signature ${a ? "signed" : ""}"><b>${a ? "✓" : old ? "↻" : "○"} ${E(C.stages[r.index].role)}</b><span>${a ? E(C.actors[a.signerId].name) + " · rev. " + a.signedRevision : old ? "Revalidar após mudança" : "Aguardando análise"}</span></div>`;
              })
              .join("")
          : "";
      dialog.show(
        "PASTA DO PROCESSO · REQ-001",
        "Documentos & assinaturas",
        `<div class="inventory-toolbar"><label for="doc-filter">Mostrar <select id="doc-filter"><option value="all">Todos os documentos</option><option value="pending">Anexos pendentes</option><option value="revised">Com revisões</option></select></label><button id="export-folder" class="text-btn">Exportar pasta ↓</button></div><div class="inventory-layout"><nav class="document-list" aria-label="Documentos">${visible.map((d) => `<button class="document-item ${d.id === selected ? "selected" : ""}" data-document="${d.id}" aria-current="${d.id === selected ? "true" : "false"}"><b>${E(C.documentNames[d.id])}</b><span>Revisão ${d.currentRevision} · ${d.id === "request" ? "principal" : D.attachmentValid(state, d.id) ? "anexado" : "anexar à pasta"}</span></button>`).join("") || '<p class="muted">Nenhum documento neste filtro.</p>'}</nav><article class="doc-sheet"><div class="doc-meta"><span>NETFELIZ / ${E(doc.id.toUpperCase())}</span><span class="doc-badge ${rev !== cur ? "superseded" : ""}">REVISÃO ${rev.revision}${rev !== cur ? " · HISTÓRICO" : ""}</span></div><h3>${E(C.documentNames[selected])}</h3><p class="muted small">${E(rev.reason)}</p><dl class="doc-fields">${Object.entries(
          rev.fields,
        )
          .map(
            ([k, v]) =>
              `<div><dt>${E(labels[k] || k)}</dt><dd>${E(value(k, v))}</dd></div>`,
          )
          .join(
            "",
          )}</dl>${selected === "request" ? `<h4>Anexos desta revisão</h4><p class="small">${rev.attachments.map((a) => E(C.documentNames[a.documentId]) + " · rev. " + a.revision).join("<br>") || "Nenhum anexo. Os setores emitirão os documentos ao longo do expediente."}</p><h4>Aprovações atuais do processo</h4><div class="doc-signatures">${signatures}</div>` : ""}<div class="modal-actions">${selected !== "request" && state.status === "playing" ? `<button id="attach-document" class="primary" ${attached ? "disabled" : ""}>${attached ? "✓ Revisão atual anexada" : "Anexar revisão atual"}</button>` : ""}<button id="pin-document" class="secondary">${pinned === selected ? "Desafixar" : "Fixar no painel"}</button>${selected === "request" && state.status === "playing" ? '<button id="revise-request" class="text-btn">Revisar pedido</button>' : ""}</div><p id="inventory-status" role="status" class="small muted"></p><details class="revision-list" ${rev !== cur ? "open" : ""}><summary>Histórico e comparação · ${doc.revisions.length} revisões</summary><label class="field-label" for="doc-revision">Revisão exibida</label><select id="doc-revision">${doc.revisions
          .slice()
          .reverse()
          .map(
            (r) =>
              `<option value="${r.revision}" ${r.revision === rev.revision ? "selected" : ""}>${r.revision} · ${E(r.reason)}</option>`,
          )
          .join(
            "",
          )}</select>${changes ? "<ul>" + changes + "</ul>" : '<p class="small muted">Primeira versão ou apenas anexos alterados.</p>'}</details></article></div><div class="modal-actions"><button id="folder-back" class="secondary">Voltar ao expediente</button></div>`,
        { wide: true },
      );
      document.getElementById("doc-filter").value = filter;
      document.getElementById("doc-filter").onchange = (e) => {
        filter = e.target.value;
        open();
      };
      dialog.content.querySelectorAll("[data-document]").forEach(
        (b) =>
          (b.onclick = () => {
            selected = b.dataset.document;
            revision = null;
            open();
          }),
      );
      document.getElementById("doc-revision").onchange = (e) => {
        revision = Number(e.target.value);
        open();
      };
      dialog.bind("pin-document", () => {
        pinned = pinned === selected ? null : selected;
        onRefresh();
        open();
      });
      dialog.bind("attach-document", () => {
        const r = session.dispatch({
          type: "ATTACH_DOCUMENT",
          documentId: selected,
        });
        open();
        document.getElementById("inventory-status").textContent =
          r.outcome.message;
        onRefresh();
      });
      dialog.bind("revise-request", revise);
      dialog.bind("folder-back", () => {
        dialog.close();
        onReturn();
      });
      dialog.bind("export-folder", () => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(session.export(), null, 2)], {
            type: "application/json",
          }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "NetFeliz-REQ-001.json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }
    function revise() {
      const session = getSession(),
        s = session.state,
        f = D.current(s.documents.request).fields;
      dialog.show(
        "NOVA REVISÃO · REQ-001",
        "O pedido mudou?",
        `<p>Registre a quantidade e o motivo. Uma revisão consome <b>1 ação</b> nos modos com prazo. Pareceres que dependem dos dados alterados precisarão de nova análise, sem pontos adicionais.</p><form id="revision-form"><label for="quantity" class="field-label">Quantidade de computadores (1 a 20)</label><input id="quantity" class="form-input" type="number" min="1" max="20" required value="${f.quantity}"><label for="justification" class="field-label">Justificativa da mudança (12 a 300 caracteres)</label><textarea id="justification" class="form-input" minlength="12" maxlength="300" required>${E(f.justification)}</textarea><p class="form-error" id="revision-error" role="alert"></p><div class="modal-actions"><button class="primary" type="submit">Registrar revisão</button><button id="cancel-revision" class="secondary" type="button">Voltar sem alterar</button></div></form>`,
      );
      document.getElementById("revision-form").onsubmit = (e) => {
        e.preventDefault();
        const r = session.dispatch({
          type: "REVISE_REQUEST",
          quantity: Number(document.getElementById("quantity").value),
          justification: document.getElementById("justification").value.trim(),
        });
        if (r.result !== "accepted")
          document.getElementById("revision-error").textContent =
            r.outcome.message;
        else {
          revision = null;
          open();
          onRefresh();
          if (session.state.status !== "playing") {
            dialog.close();
            onReturn();
          }
        }
      };
      dialog.bind("cancel-revision", open);
    }
    return {
      open,
      get pinned() {
        return pinned;
      },
    };
  }
  root.LB.Inventory = { create };
})(globalThis);
