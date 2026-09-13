const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../infrastructure/legacy-engine.js");

test("completes all six approvals with 600 points and three lives", () => {
  const state = engine.fresh({ mode: "classic" });
  engine.stages.forEach((stage, index) => {
    assert.equal(engine.answer(state, index, stage.correct).kind, "correct");
    assert.equal(state.stage, index + 1);
  });
  assert.equal(state.status, "won");
  assert.equal(state.score, 600);
  assert.equal(state.lives, 3);
  assert.deepEqual(engine.restore(JSON.parse(JSON.stringify(state))), state);
});

test("incorrect decisions preserve pending stage and reduce score without going negative", () => {
  const state = engine.fresh({ mode: "classic" });
  engine.answer(state, 0, 1);
  assert.equal(state.score, 0);
  assert.equal(state.stage, 0);
  engine.answer(state, 0, 0);
  engine.answer(state, 1, 0);
  assert.equal(state.score, 75);
  assert.equal(state.lives, 1);
  assert.equal(state.stage, 1);
  for (let i = 1; i < 6; i++) engine.answer(state, i, engine.stages[i].correct);
  assert.equal(state.status, "won");
  assert.equal(state.score, 575);
});

test("three explicit attempts to skip steps end the attempt and freeze answers", () => {
  const state = engine.fresh({ mode: "classic" });
  for (let i = 0; i < 3; i++) engine.skip(state, 5);
  assert.equal(state.status, "lost");
  assert.equal(state.lives, 0);
  const snapshot = structuredClone(state);
  assert.equal(engine.answer(state, 0, 0).kind, "ignored");
  assert.equal(engine.skip(state, 5).kind, "ignored");
  assert.deepEqual(state, snapshot);
  assert.deepEqual(engine.restore(state), state);
});

test("past, future and invalid answers cannot forge signatures or incur penalties", () => {
  const state = engine.fresh({ mode: "classic" });
  for (const [stage, choice] of [
    [2, 1],
    [-1, 0],
    [99, 0],
    [0, -1],
    [0, 9],
    [0, 0.5],
  ]) {
    assert.equal(engine.answer(state, stage, choice).kind, "ignored");
  }
  engine.answer(state, 0, 0);
  assert.equal(engine.answer(state, 0, 0).kind, "ignored");
  assert.equal(engine.skip(state, 0).kind, "ignored");
  assert.equal(state.score, 100);
  assert.equal(state.lives, 3);
});

test("restore rejects malformed, inconsistent and unsupported saved games", () => {
  for (const raw of [
    null,
    {},
    { ...engine.fresh({ mode: "classic" }), version: 99 },
    { ...engine.fresh({ mode: "classic" }), stage: -1 },
    { ...engine.fresh({ mode: "classic" }), stage: 6 },
    { ...engine.fresh({ mode: "classic" }), elapsed: Infinity },
    { ...engine.fresh({ mode: "classic" }), lives: 2 },
    { ...engine.fresh({ mode: "classic" }), score: "<script>" },
    { ...engine.fresh({ mode: "classic" }), mistakes: [null] },
  ]) {
    assert.equal(engine.restore(raw), null);
  }
  const state = engine.fresh({ mode: "classic" });
  state.elapsed = 120.5;
  engine.answer(state, 0, 0);
  assert.deepEqual(engine.restore(state), state);
});

function roundtrip(state) {
  assert.deepEqual(engine.restore(JSON.parse(JSON.stringify(state))), state);
}
function solvePending(state, choice = 0) {
  const event = engine.currentEvent(state);
  assert.equal(engine.eventAnswer(state, choice).kind, "planned");
  roundtrip(state);
  assert.equal(engine.eventAnswer(state, event.correct).kind, "resolved");
  roundtrip(state);
}

test("all eight event combinations are winnable under pressure and survive saving at every phase", () => {
  for (let mask = 0; mask < 8; mask++) {
    let draw = 0;
    const state = engine.fresh({
      mode: "intense",
      random: () => ((mask >> draw++) & 1 ? 0.8 : 0.2),
    });
    roundtrip(state);
    for (let stage = 0; stage < 6; stage++) {
      assert.equal(
        engine.answer(state, stage, engine.stages[stage].correct).kind,
        "correct",
      );
      roundtrip(state);
      if (state.pending) {
        const before = structuredClone(state);
        assert.equal(
          engine.answer(state, state.stage, engine.stages[state.stage].correct)
            .kind,
          "ignored",
        );
        assert.equal(engine.skip(state, 5).kind, "ignored");
        assert.deepEqual(state, before);
        assert.equal(
          engine.nextTarget(state),
          engine.currentEvent(state).target,
        );
        solvePending(state);
      }
    }
    assert.equal(state.status, "won");
    assert.equal(state.score, 690);
    assert.equal(state.history.length, 3);
    assert.equal(state.quantity, mask & 1 ? 7 : 5);
    assert.equal(
      state.supplier,
      mask & 4 ? "Fornecedor original" : "Fornecedor substituto",
    );
    const before = structuredClone(state);
    assert.equal(engine.eventAnswer(state, 0).kind, "ignored");
    assert.deepEqual(state, before);
  }
});

test("expensive plans can miss the deadline without losing lives", () => {
  const state = engine.fresh({ mode: "intense", random: () => 0 });
  while (state.status === "playing") {
    if (state.pending) {
      const event = engine.currentEvent(state);
      engine.eventAnswer(
        state,
        state.pending.phase === "decision" ? 1 : event.correct,
      );
    } else
      engine.answer(state, state.stage, engine.stages[state.stage].correct);
    roundtrip(state);
  }
  assert.equal(state.status, "lost");
  assert.equal(state.turns, 0);
  assert.equal(state.lives, 3);
  assert.ok(state.stage < 6);
});

test("bad event choices cost lives and actions; invalid input has no effect", () => {
  const state = engine.fresh({ random: () => 0 });
  engine.answer(state, 0, 0);
  const snapshot = structuredClone(state);
  for (const value of [-1, 3, 1.5, null, "0"])
    assert.equal(engine.eventAnswer(state, value).kind, "ignored");
  assert.deepEqual(state, snapshot);
  assert.equal(engine.eventAnswer(state, 2).kind, "wrong");
  assert.equal(state.lives, 2);
  assert.equal(state.turns, 15);
  assert.equal(state.score, 75);
  roundtrip(state);
  engine.eventAnswer(state, 0);
  assert.equal(engine.eventAnswer(state, 1).kind, "wrong");
  assert.equal(state.pending.phase, "rework");
  roundtrip(state);
  assert.equal(engine.eventAnswer(state, 0).kind, "resolved");
  roundtrip(state);
});

test("saved event plans, phases, revised quantities and histories are validated", () => {
  const state = engine.fresh({ random: () => 0 });
  engine.answer(state, 0, 0);
  for (const patch of [
    { pending: null },
    { eventPlan: [5, 2, 4] },
    { eventIndex: 2 },
    { pending: { id: 0, phase: "rework", choice: 9 } },
    { pending: { id: 0, phase: "bogus", choice: null } },
    { quantity: 7 },
    { supplier: "Injected" },
    { turns: -1 },
    { history: [{ id: 0, choice: 0 }] },
  ])
    assert.equal(engine.restore({ ...state, ...patch }), null);
  const old = {
    version: 1,
    stage: 1,
    score: 100,
    lives: 3,
    mistakes: [],
    elapsed: 42,
    status: "playing",
  };
  const migrated = engine.restore(old);
  assert.equal(migrated.mode, "classic");
  assert.equal(migrated.stage, 1);
  roundtrip(migrated);
});
