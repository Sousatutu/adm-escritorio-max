(function (root) {
  "use strict";
  const common = typeof module !== "undefined" && module.exports;
  const C = common ? require("../content/catalog.js") : root.LB.Content,
    D = common ? require("./documents.js") : root.LB.Documents,
    Q = common ? require("../content/dialogues.js") : root.LB.Dialogues;
  const VERSION = 3,
    CONTENT = "3.0.0";
  function rng(seed) {
    let x = seed >>> 0;
    return () => {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 4294967296;
    };
  }
  function fresh({ mode = "normal", seed = 1 } = {}) {
    if (!Object.hasOwn(C.modes, mode)) mode = "normal";
    seed = Number.isInteger(seed) ? seed >>> 0 : 1;
    const random = rng(seed);
    return {
      schemaVersion: VERSION,
      contentVersion: CONTENT,
      revision: 0,
      seed,
      mode,
      status: "playing",
      score: 0,
      lives: 3,
      turns: C.modes[mode].limit,
      actionsUsed: 0,
      elapsed: 0,
      documents: D.initial(),
      approvals: [],
      rewards: [],
      mistakes: [],
      eventPlan:
        mode === "classic"
          ? []
          : [0, 2, 4].map((i) => C.events[i + (random() < 0.5 ? 0 : 1)].id),
      eventIndex: 0,
      pending: null,
      history: [],
      relationships: { diego: 1 },
      flags: { favorWarningSeen: false, directorAway: false },
      conversation: null,
      receipts: {},
      journal: [],
    };
  }
  const event = (state) =>
    state.pending ? C.events.find((e) => e.id === state.pending.id) : null;
  const target = (state) => event(state)?.target ?? D.next(state)?.index ?? 5;
  const actorFor = (state, index) =>
    index === 5 && state.flags.directorAway
      ? "marina"
      : C.stages[index].personId;
  function message(state, type, text, extra = {}) {
    state.journal.push({ id: state.journal.length + 1, type, text, ...extra });
  }
  function cost(state, amount) {
    state.actionsUsed +=
      state.mode === "classic" ? 0 : Math.min(state.turns, amount);
    if (state.mode === "classic") return true;
    const enough = state.turns >= amount;
    state.turns = Math.max(0, state.turns - amount);
    return enough;
  }
  function punish(state, type, text) {
    cost(state, 2);
    state.lives = Math.max(0, state.lives - 1);
    const loss = Math.min(25, state.score);
    state.score -= loss;
    state.mistakes.push({
      type,
      requirement: D.next(state)?.id || "general",
      loss,
    });
    message(
      state,
      "penalty",
      text +
        " −1 vida, −" +
        loss +
        " pontos" +
        (state.mode === "classic" ? "" : ", −2 ações") +
        ".",
    );
    return { kind: "penalty", message: text, loss };
  }
  function reward(state, key, points) {
    if (!state.rewards.includes(key)) {
      state.rewards.push(key);
      state.score += points;
    }
  }
  function finish(state) {
    if (!state.lives) state.status = "lost";
    else if (!D.next(state) && !state.pending) state.status = "won";
    else if (state.mode !== "classic" && !state.turns) state.status = "lost";
    if (state.status !== "playing") state.conversation = null;
  }
  function schedule(state) {
    if (state.mode === "classic" || state.pending || state.eventIndex >= 3)
      return;
    const thresholds = [1, 3, 5],
      n = state.rewards.filter((k) => k.startsWith("mission01.")).length;
    if (n >= thresholds[state.eventIndex]) {
      state.pending = {
        id: state.eventPlan[state.eventIndex],
        phase: "decision",
        choice: null,
      };
      state.conversation = null;
      message(state, "incident", "Novo imprevisto: " + event(state).title);
    }
  }
  function issueBudget(state) {
    const req = D.current(state.documents.request).fields,
      prev = D.current(state.documents.budget)?.fields;
    const unitPrice = prev?.unitPrice || 1000;
    D.issue(
      state,
      "budget",
      {
        quantity: req.quantity,
        unitPrice,
        total: req.quantity * unitPrice,
        available: Math.max(req.quantity * unitPrice, prev?.available || 0),
        validated: true,
      },
      "Análise financeira de " + req.quantity + " computadores",
    );
  }
  function prepareApproval(state, id) {
    if (id === "protocol")
      D.revise(
        state,
        "request",
        { registered: true },
        "Abertura e registro formal",
      );
    if (id === "manager") issueBudget(state);
    if (id === "legal") {
      const q = D.current(state.documents.request).fields.quantity;
      D.revise(
        state,
        "contract",
        { quantity: q, reviewed: true },
        "Cláusulas e condições conferidas",
      );
    }
  }
  function revisePlan(state, e, choice) {
    const req = D.current(state.documents.request).fields;
    if (e.id === "offline")
      D.issue(
        state,
        "contingency",
        {
          number: "CONT-001",
          method: choice === 0 ? "Protocolo manual" : "Cópia recuperada",
          validated: false,
        },
        "Contingência durante indisponibilidade",
      );
    if (e.id === "demand")
      D.revise(
        state,
        "request",
        {
          quantity: 7,
          justification: "Ampliação da equipe com duas novas vagas",
        },
        "Mudança de escopo: cinco para sete computadores",
      );
    if (e.id === "budget") {
      const b = D.current(state.documents.budget).fields;
      D.revise(
        state,
        "budget",
        {
          unitPrice: choice === 0 ? 800 : b.unitPrice,
          total: req.quantity * (choice === 0 ? 800 : b.unitPrice),
          available: choice === 0 ? Math.floor(b.available * 0.8) : b.available,
          validated: false,
        },
        choice === 0
          ? "Corte de verba: modelo econômico"
          : "Suplementação formal solicitada",
      );
    }
    if (e.id === "priority")
      D.revise(
        state,
        "request",
        {
          priority:
            choice === 0
              ? "Serviço interrompido — critério documentado"
              : "Fila ordinária",
        },
        "Decisão sobre nova urgência",
      );
    if (e.id === "supplier")
      D.revise(
        state,
        "contract",
        {
          supplier: "Fornecedor substituto",
          delivery: choice === 0 ? 35 : 40,
          reviewed: false,
        },
        "Substituição do fornecedor",
      );
    if (e.id === "delegation") {
      state.flags.directorAway = choice === 0;
      D.issue(
        state,
        "delegation",
        {
          delegate: choice === 0 ? "marina" : "felipe",
          role: "general",
          process: "REQ-001",
          limit: 50000,
          expiresAtAction: 1000,
          validated: false,
          route: choice === 0 ? "Substituição designada" : "Retorno do titular",
        },
        "Conferência do encaminhamento final",
      );
    }
    const invalid = D.invalidate(state);
    if (invalid.length)
      message(
        state,
        "revision",
        "Aprovações a revalidar: " +
          invalid
            .map((id) => C.stages.find((s) => s.id === id).role)
            .join(", "),
      );
  }
  function completeEvent(state, e) {
    if (e.id === "offline") {
      D.revise(
        state,
        "contingency",
        { validated: true },
        "Registro de contingência conferido",
      );
      D.attach(state, "contingency");
    }
    if (e.id === "budget") {
      D.revise(
        state,
        "budget",
        { validated: true },
        "Novo parecer financeiro conferido",
      );
      D.grant(state, "manager", "carla");
    }
    if (e.id === "supplier") {
      D.revise(
        state,
        "contract",
        { reviewed: true },
        "Minuta do novo fornecedor conferida",
      );
      D.grant(state, "legal", "elisa");
    }
    if (e.id === "delegation")
      D.revise(
        state,
        "delegation",
        { validated: true },
        "Limite, validade e competência conferidos",
      );
    state.history.push({ id: e.id, choice: state.pending.choice });
    state.eventIndex++;
    state.pending = null;
    reward(state, "event." + e.id, 30);
    message(state, "resolved", e.resolution);
    state.conversation = null;
  }
  function reject(state, message) {
    return {
      state,
      events: [],
      result: "rejected",
      outcome: { kind: "rejected", message },
    };
  }
  function transition(original, envelope) {
    if (
      !original ||
      !envelope ||
      typeof envelope.commandId !== "string" ||
      !/^[-a-zA-Z0-9_.:]{1,100}$/.test(envelope.commandId)
    )
      return reject(original, "Comando inválido.");
    if (Object.hasOwn(original.receipts, envelope.commandId))
      return {
        state: original,
        events: [],
        result: "duplicate",
        outcome: original.receipts[envelope.commandId],
      };
    if (envelope.expectedRevision !== original.revision)
      return reject(
        original,
        "A partida mudou. Atualize a tela antes de tentar novamente.",
      );
    if (original.status !== "playing")
      return reject(original, "O expediente já terminou.");
    if (Object.keys(original.receipts).length >= 2000)
      return reject(
        original,
        "Limite de registros desta partida atingido. Exporte sua pasta e inicie outro expediente.",
      );
    const a = envelope.action;
    if (!a || typeof a.type !== "string")
      return reject(original, "Ação inválida.");
    const state = D.clone(original),
      startLog = state.journal.length;
    let outcome = { kind: "ok", message: "" };
    const bad = (text) => reject(original, text);
    if (a.type === "TALK") {
      if (!Number.isInteger(a.target) || !C.stages[a.target])
        return bad("Setor inexistente.");
      state.conversation = {
        target: a.target,
        actorId: actorFor(state, a.target),
        node: "reception",
      };
    } else if (a.type === "DIALOGUE_CHOICE") {
      const conv = state.conversation;
      if (!conv || conv.node !== a.node)
        return bad("Esta conversa foi atualizada.");
      const choice = Q.nodes[conv.node]?.choices.find((c) => c.id === a.choice);
      if (!choice || !Q.allowed(choice, state, C.stages[conv.target].id))
        return bad("Alternativa indisponível.");
      if (choice.intent === "ATTEMPT_FAVORITISM") {
        if (conv.target !== 3 || conv.node !== "warning")
          return bad("Confirmação inválida.");
        outcome = punish(
          state,
          "favoritism",
          "Amizade não autoriza tratamento privilegiado.",
        );
        conv.node = "refused";
      } else {
        conv.node = choice.next;
        if (choice.next === "warning") state.flags.favorWarningSeen = true;
      }
    } else if (a.type === "APPROVE") {
      const conv = state.conversation,
        stage = C.stages[a.target];
      if (
        !conv ||
        conv.node !== "decision" ||
        conv.target !== a.target ||
        !stage ||
        !Number.isInteger(a.choice) ||
        a.choice < 0 ||
        a.choice >= stage.choices.length
      )
        return bad("Análise desatualizada ou resposta inválida.");
      if (state.pending)
        return bad("Resolva a ocorrência pendente antes de assinar.");
      if (a.actorId && a.actorId !== conv.actorId)
        return bad("Este responsável não conduz a análise.");
      if (!D.authorized(state, conv.actorId, stage.id))
        return bad("O responsável não tem competência válida para este ato.");
      if (D.activeApproval(state, stage.id))
        return bad("A aprovação já está válida.");
      const missing = D.missing(state, stage.id);
      if (missing.length) return bad(missing.join(" "));
      if (a.choice !== stage.correct)
        outcome = punish(state, "choice", stage.mistake);
      else if (!cost(state, 1))
        outcome = {
          kind: "expired",
          message: "O prazo acabou antes da aprovação.",
        };
      else {
        prepareApproval(state, stage.id);
        D.invalidate(state);
        D.grant(state, stage.id, conv.actorId);
        const rewarded = state.rewards.includes("mission01." + stage.id);
        reward(state, "mission01." + stage.id, 100);
        outcome = {
          kind: "approved",
          message: rewarded
            ? "Aprovação revalidada. A recompensa deste marco já foi concedida."
            : stage.success,
        };
        message(state, "approval", outcome.message, { requirement: stage.id });
        state.conversation = null;
        schedule(state);
      }
    } else if (a.type === "SKIP_ORDER") {
      const conv = state.conversation,
        stage = C.stages[a.target];
      if (
        !conv ||
        conv.node !== "decision" ||
        conv.target !== a.target ||
        !stage ||
        !D.missing(state, stage.id).length ||
        state.pending
      )
        return bad("Não existe tentativa de avanço para confirmar.");
      outcome = punish(
        state,
        "order",
        "Faltam requisitos para analisar este pedido.",
      );
    } else if (a.type === "EVENT_PLAN") {
      const e = event(state);
      if (
        !e ||
        state.pending.phase !== "decision" ||
        !Number.isInteger(a.choice) ||
        !e.choices[a.choice]
      )
        return bad("Plano indisponível.");
      if (e.choices[a.choice].wrong)
        outcome = punish(
          state,
          "event",
          "Este plano não regulariza a mudança.",
        );
      else if (!cost(state, e.choices[a.choice].cost))
        outcome = {
          kind: "expired",
          message: "O prazo acabou antes de executar o plano.",
        };
      else {
        state.pending.phase = "rework";
        state.pending.choice = a.choice;
        revisePlan(state, e, a.choice);
        state.conversation = null;
        outcome = { kind: "planned", message: e.task };
        message(state, "plan", e.choices[a.choice].label);
      }
    } else if (a.type === "EVENT_REVIEW") {
      const e = event(state);
      if (
        !e ||
        state.pending.phase !== "rework" ||
        !state.conversation ||
        state.conversation.target !== e.target ||
        !Number.isInteger(a.choice) ||
        a.choice < 0 ||
        a.choice >= e.checks.length
      )
        return bad("A revisão precisa ocorrer no setor responsável.");
      if (a.choice !== e.correct)
        outcome = punish(
          state,
          "event",
          "A evidência escolhida não comprova a regularidade do novo plano.",
        );
      else if (!cost(state, 1))
        outcome = {
          kind: "expired",
          message: "O prazo acabou antes da revisão.",
        };
      else {
        completeEvent(state, e);
        outcome = { kind: "resolved", message: e.resolution };
      }
    } else if (a.type === "ATTACH_DOCUMENT") {
      if (
        !Object.hasOwn(state.documents, a.documentId) ||
        a.documentId === "request"
      )
        return bad("Anexo inexistente.");
      if (!D.attach(state, a.documentId))
        return bad("A revisão atual já está anexada.");
      D.invalidate(state);
      message(
        state,
        "attachment",
        C.documentNames[a.documentId] + " anexado à pasta.",
      );
      outcome = {
        kind: "attached",
        message: "Anexo atualizado. Encaminhe a pasta ao próximo setor.",
      };
    } else if (a.type === "REVISE_REQUEST") {
      if (state.pending)
        return bad("Conclua a ocorrência antes de fazer outra revisão.");
      if (!D.current(state.documents.request).fields.registered)
        return bad("Registre o requerimento antes de revisá-lo.");
      if (
        !Number.isInteger(a.quantity) ||
        a.quantity < 1 ||
        a.quantity > 20 ||
        typeof a.justification !== "string" ||
        a.justification.trim().length < 12 ||
        a.justification.length > 300
      )
        return bad(
          "Informe de 1 a 20 computadores e uma justificativa de 12 a 300 caracteres.",
        );
      const fields = D.current(state.documents.request).fields;
      if (
        fields.quantity === a.quantity &&
        fields.justification === a.justification.trim()
      )
        return bad("Nenhuma alteração para registrar.");
      if (!cost(state, 1))
        outcome = {
          kind: "expired",
          message: "O prazo acabou antes da revisão.",
        };
      else {
        D.revise(
          state,
          "request",
          { quantity: a.quantity, justification: a.justification.trim() },
          "Revisão solicitada pelo funcionário",
        );
        const invalid = D.invalidate(state);
        outcome = {
          kind: "revised",
          message:
            "Nova revisão registrada. " +
            (invalid.length
              ? "Revalidar: " +
                invalid
                  .map((id) => C.stages.find((s) => s.id === id).role)
                  .join(", ")
              : "As aprovações existentes continuam válidas."),
        };
        message(state, "revision", outcome.message);
        state.conversation = null;
      }
    } else return bad("Ação desconhecida.");
    finish(state);
    state.revision++;
    state.receipts[envelope.commandId] = outcome;
    return {
      state,
      events: state.journal.slice(startLog),
      result: "accepted",
      outcome,
    };
  }
  function restore(raw) {
    try {
      if (
        !raw ||
        raw.schemaVersion !== VERSION ||
        raw.contentVersion !== CONTENT ||
        !Object.hasOwn(C.modes, raw.mode) ||
        !Number.isInteger(raw.seed) ||
        raw.seed < 0 ||
        raw.seed > 4294967295 ||
        !Number.isInteger(raw.revision) ||
        raw.revision < 0 ||
        !["playing", "won", "lost"].includes(raw.status) ||
        !Number.isInteger(raw.score) ||
        raw.score < 0 ||
        raw.score > 690 ||
        !Number.isInteger(raw.lives) ||
        raw.lives < 0 ||
        raw.lives > 3 ||
        !Number.isInteger(raw.turns) ||
        raw.turns < 0 ||
        raw.turns > C.modes[raw.mode].limit ||
        !Number.isInteger(raw.actionsUsed) ||
        raw.actionsUsed < 0 ||
        !Number.isFinite(raw.elapsed) ||
        raw.elapsed < 0 ||
        !D.validDocuments(raw.documents)
      )
        return null;
      const state = D.clone(raw);
      if (
        !Array.isArray(state.approvals) ||
        state.approvals.length > 1000 ||
        !Array.isArray(state.rewards) ||
        new Set(state.rewards).size !== state.rewards.length ||
        state.rewards.some(
          (k) =>
            ![
              ...C.roles.map((r) => "mission01." + r),
              ...C.events.map((e) => "event." + e.id),
            ].includes(k),
        ) ||
        !Array.isArray(state.mistakes) ||
        state.mistakes.length !== 3 - state.lives ||
        state.mistakes.some(
          (m) =>
            !m ||
            !["choice", "order", "event", "favoritism"].includes(m.type) ||
            !C.roles.includes(m.requirement) ||
            !Number.isInteger(m.loss) ||
            m.loss < 0 ||
            m.loss > 25,
        )
      )
        return null;
      if (
        !state.flags ||
        typeof state.flags.favorWarningSeen !== "boolean" ||
        typeof state.flags.directorAway !== "boolean" ||
        !state.relationships ||
        state.relationships.diego !== 1
      )
        return null;
      if (
        !Array.isArray(state.eventPlan) ||
        state.eventPlan.length !== (state.mode === "classic" ? 0 : 3) ||
        state.eventPlan.some(
          (id, i) => !C.events.slice(i * 2, i * 2 + 2).some((e) => e.id === id),
        ) ||
        !Number.isInteger(state.eventIndex) ||
        state.eventIndex < 0 ||
        state.eventIndex > state.eventPlan.length ||
        !Array.isArray(state.history) ||
        state.history.length !== state.eventIndex ||
        state.history.some(
          (h, i) => h.id !== state.eventPlan[i] || ![0, 1].includes(h.choice),
        )
      )
        return null;
      if (
        state.pending &&
        (state.pending.id !== state.eventPlan[state.eventIndex] ||
          !["decision", "rework"].includes(state.pending.phase) ||
          (state.pending.phase === "decision"
            ? state.pending.choice !== null
            : ![0, 1].includes(state.pending.choice)))
      )
        return null;
      const rewarded = state.rewards.filter((k) =>
          k.startsWith("mission01."),
        ).length,
        due =
          state.mode !== "classic" &&
          state.eventIndex < 3 &&
          rewarded >= [1, 3, 5][state.eventIndex];
      if (Boolean(state.pending) !== due) return null;
      if (
        state.score !==
        state.rewards.reduce(
          (sum, k) => sum + (k.startsWith("event.") ? 30 : 100),
          0,
        ) -
          state.mistakes.reduce((sum, m) => sum + m.loss, 0)
      )
        return null;
      if (
        state.mode !== "classic" &&
        state.actionsUsed + state.turns !== C.modes[state.mode].limit
      )
        return null;
      const active = new Set();
      for (const a of state.approvals) {
        if (
          !a ||
          !C.roles.includes(a.requirementId) ||
          !C.actors[a.signerId] ||
          a.authorityRole !== a.requirementId ||
          a.documentId !==
            C.requirements.find((r) => r.id === a.requirementId).documentId ||
          !["valid", "superseded"].includes(a.status) ||
          typeof a.basisDigest !== "string" ||
          !Number.isInteger(a.signedRevision) ||
          a.signedRevision < 1 ||
          !state.documents[a.documentId] ||
          a.signedRevision > state.documents[a.documentId].currentRevision
        )
          return null;
        if (a.status === "valid") {
          if (
            active.has(a.requirementId) ||
            !D.authorized(state, a.signerId, a.requirementId) ||
            D.missing(state, a.requirementId).length ||
            !state.rewards.includes("mission01." + a.requirementId)
          )
            return null;
          active.add(a.requirementId);
        }
      }
      if (D.invalidate(state).length) return null;
      if (
        state.conversation &&
        (!Number.isInteger(state.conversation.target) ||
          !C.stages[state.conversation.target] ||
          state.conversation.actorId !==
            actorFor(state, state.conversation.target) ||
          !Q.nodes[state.conversation.node])
      )
        return null;
      if (
        !state.receipts ||
        typeof state.receipts !== "object" ||
        Array.isArray(state.receipts) ||
        Object.keys(state.receipts).length > 2000 ||
        Object.entries(state.receipts).some(
          ([k, v]) =>
            !/^[-a-zA-Z0-9_.:]{1,100}$/.test(k) ||
            !v ||
            typeof v.kind !== "string",
        )
      )
        return null;
      if (
        !Array.isArray(state.journal) ||
        state.journal.length > 4000 ||
        state.journal.some(
          (j) => !j || typeof j.text !== "string" || j.text.length > 2000,
        )
      )
        return null;
      const expected = state.status;
      finish(state);
      if (state.status !== expected) return null;
      return state;
    } catch {
      return null;
    }
  }
  const api = {
    VERSION,
    CONTENT,
    fresh,
    transition,
    restore,
    event,
    target,
    actorFor,
    issueBudget,
    prepareApproval,
    revisePlan,
    completeEvent,
    rng,
  };
  if (common) module.exports = api;
  else (root.LB ||= {}).Domain = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
