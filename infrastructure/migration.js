(function (root) {
  "use strict";
  const common = typeof module !== "undefined" && module.exports;
  const G = common ? require("../domain/game.js") : root.LB.Domain,
    D = common ? require("../domain/documents.js") : root.LB.Documents,
    C = common ? require("../content/catalog.js") : root.LB.Content,
    L = common ? require("./legacy-engine.js") : root.LegacyBureaucracy;
  function migrate(raw) {
    const old = L.restore(raw);
    if (!old) return null;
    const s = G.fresh({ mode: old.mode, seed: 1 });
    s.eventPlan = old.eventPlan.map((i) => C.events[i].id);
    s.elapsed = old.elapsed;
    // Reconstruct only evidence represented by a legacy approval; retain original save as backup.
    for (let i = 0; i < old.stage; i++) {
      const id = C.roles[i];
      if (i === 3) D.attach(s, "budget");
      if (i === 5) D.attach(s, "contract");
      G.prepareApproval(s, id);
      D.grant(s, id, G.actorFor(s, i));
      s.rewards.push("mission01." + id);
      s.score += 100;
      const history = old.history.find(
        (h) => [1, 3, 5][old.history.indexOf(h)] === i + 1,
      );
      if (history) {
        const e = C.events[history.id];
        s.pending = { id: e.id, phase: "rework", choice: history.choice };
        G.revisePlan(s, e, history.choice);
        G.completeEvent(s, e);
        if (e.id === "delegation") D.attach(s, "delegation");
      }
    }
    if (old.pending) {
      const e = C.events[old.pending.id];
      s.pending = {
        id: e.id,
        phase: old.pending.phase,
        choice: old.pending.choice,
      };
      if (old.pending.phase === "rework")
        G.revisePlan(s, e, old.pending.choice);
    }
    let loss = s.score - old.score;
    if (loss < 0 || loss > old.mistakes.length * 25) return null;
    s.mistakes = old.mistakes.map((m) => {
      const amount = Math.min(25, loss);
      loss -= amount;
      return {
        type: m.type === "event" ? "event" : m.type,
        requirement: C.roles[m.stage],
        loss: amount,
      };
    });
    s.score = old.score;
    s.lives = old.lives;
    s.turns = old.turns;
    s.actionsUsed = C.modes[s.mode].limit - s.turns;
    s.status = old.status;
    s.journal.push({
      id: s.journal.length + 1,
      type: "migration",
      text: "Partida anterior convertida. Registros reconstruídos a partir das etapas concluídas; o salvamento original foi preservado.",
    });
    return G.restore(s);
  }
  const api = { migrate };
  if (common) module.exports = api;
  else (root.LB ||= {}).Migration = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
