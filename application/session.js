(function (root) {
  "use strict";
  const common = typeof module !== "undefined" && module.exports;
  const G = common ? require("../domain/game.js") : root.LB.Domain,
    D = common ? require("../domain/documents.js") : root.LB.Documents;
  function create(
    initial,
    { store = null, now = () => Date.now(), nonce = "session" } = {},
  ) {
    let state = initial,
      elapsed = initial.elapsed,
      serial = 0,
      status = "idle",
      savedAt = 0,
      conflict = false;
    const listeners = new Set();
    const emit = (result) => listeners.forEach((fn) => fn(state, result));
    const envelope = () => ({
      savedAt: Math.max(now(), savedAt + 1),
      sessionId: nonce,
      state: { ...state, elapsed },
    });
    async function save() {
      if (!store || conflict) return;
      status = "saving";
      emit({ storage: true });
      const e = envelope();
      savedAt = e.savedAt;
      let result;
      try {
        result = await store.save(e);
      } catch {
        result = { ok: false };
      }
      if (e.savedAt === savedAt) {
        status = result.ok ? "saved" : "failed";
        emit({ storage: true });
      }
      return result;
    }
    function dispatch(action, command) {
      if (conflict)
        return {
          result: "rejected",
          outcome: {
            kind: "rejected",
            message:
              "Outra aba alterou esta partida. Recarregue para continuar com o estado mais recente.",
          },
        };
      const env = command || {
        commandId: nonce + "." + ++serial,
        expectedRevision: state.revision,
        action,
      };
      const result = G.transition(state, env);
      if (result.result === "accepted") {
        state = result.state;
        save();
      }
      emit(result);
      return result;
    }
    return {
      get state() {
        return state;
      },
      get elapsed() {
        return elapsed;
      },
      get storageStatus() {
        return status;
      },
      get conflict() {
        return conflict;
      },
      get savedAt() {
        return savedAt;
      },
      dispatch,
      subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      advance: (dt) => {
        if (
          !conflict &&
          state.status === "playing" &&
          Number.isFinite(dt) &&
          dt >= 0 &&
          dt <= 1
        )
          elapsed += dt;
      },
      save,
      export: () => D.clone({ ...state, elapsed }),
      quickSave: () => {
        if (store && !conflict) {
          const e = envelope();
          savedAt = e.savedAt;
          store.quickSave(e);
        }
      },
      onExternal: (e) => {
        if (e && e.sessionId !== nonce && e.savedAt > savedAt) {
          conflict = true;
          emit({ conflict: true });
        }
      },
    };
  }
  const api = { create };
  if (common) module.exports = api;
  else (root.LB ||= {}).Session = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
