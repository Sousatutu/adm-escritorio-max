const test = require("node:test"),
  assert = require("node:assert/strict");
const G = require("../domain/game.js"),
  D = require("../domain/documents.js"),
  C = require("../content/catalog.js"),
  M = require("../infrastructure/migration.js"),
  Legacy = require("../infrastructure/legacy-engine.js");
function harness(options = {}) {
  let state = G.fresh(options),
    id = 0;
  return {
    get state() {
      return state;
    },
    send(action) {
      const result = G.transition(state, {
        commandId: "test." + ++id,
        expectedRevision: state.revision,
        action,
      });
      if (result.result === "accepted") state = result.state;
      return result;
    },
    talk(target) {
      this.send({ type: "TALK", target });
      this.send({
        type: "DIALOGUE_CHOICE",
        node: "reception",
        choice: "formal",
      });
    },
    approve(target) {
      this.talk(target);
      return this.send({
        type: "APPROVE",
        target,
        choice: C.stages[target].correct,
      });
    },
  };
}
function check(state) {
  assert.deepEqual(G.restore(JSON.parse(JSON.stringify(state))), state);
}
function play(h, plan = 0) {
  for (let guard = 0; guard < 80 && h.state.status === "playing"; guard++) {
    const e = G.event(h.state);
    if (e) {
      if (h.state.pending.phase === "decision")
        h.send({ type: "EVENT_PLAN", choice: plan });
      else {
        h.talk(e.target);
        h.send({ type: "EVENT_REVIEW", choice: e.correct });
      }
    } else {
      const target = D.next(h.state).index;
      for (const id of ["budget", "contract", "delegation"])
        if (h.state.documents[id] && !D.attachmentValid(h.state, id))
          h.send({ type: "ATTACH_DOCUMENT", documentId: id });
      h.approve(target);
    }
    check(h.state);
  }
  return h.state;
}
test("all generated event combinations remain winnable and restore at each command boundary", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const h = harness({ mode: "intense", seed: (seed * 2654435761) >>> 0 });
    seen.add(h.state.eventPlan.join());
    const state = play(h);
    assert.equal(state.status, "won");
    assert.equal(state.score, 690);
    assert.equal(state.eventIndex, 3);
  }
  assert.equal(seen.size, 8);
});
test("classic completes six approvals with no deadline", () => {
  const h = harness({ mode: "classic" });
  assert.equal(play(h).score, 600);
  assert.equal(h.state.status, "won");
});
test("documents keep immutable revisions and selectively invalidate dependent approvals", () => {
  const h = harness({ mode: "classic" });
  h.approve(0);
  h.approve(1);
  h.approve(2);
  const first = D.clone(h.state.documents.request.revisions[0]);
  h.send({
    type: "REVISE_REQUEST",
    quantity: 7,
    justification: "Duas vagas novas foram aprovadas para a equipe.",
  });
  assert.ok(D.activeApproval(h.state, "protocol"));
  assert.equal(D.activeApproval(h.state, "supervisor"), null);
  assert.equal(D.activeApproval(h.state, "manager"), null);
  assert.deepEqual(h.state.documents.request.revisions[0], first);
  h.approve(1);
  h.approve(2);
  assert.equal(h.state.score, 300);
  assert.equal(D.current(h.state.documents.budget).fields.total, 7000);
  check(h.state);
});
test("favor warning is free; explicit confirmation has one penalty and friendship cannot approve", () => {
  const h = harness({ mode: "classic" });
  h.send({ type: "TALK", target: 3 });
  h.send({ type: "DIALOGUE_CHOICE", node: "reception", choice: "favor" });
  assert.equal(h.state.lives, 3);
  assert.equal(h.state.flags.favorWarningSeen, true);
  const env = {
    commandId: "one-favor",
    expectedRevision: h.state.revision,
    action: { type: "DIALOGUE_CHOICE", node: "warning", choice: "insist" },
  };
  const r = G.transition(h.state, env);
  assert.equal(r.state.lives, 2);
  assert.equal(r.state.approvals.length, 0);
  const twice = G.transition(r.state, env);
  assert.equal(twice.result, "duplicate");
  assert.deepEqual(twice.state, r.state);
  check(r.state);
});
test("stale choices and wrong authorities cause no penalty", () => {
  const h = harness();
  const initial = D.clone(h.state);
  assert.equal(
    G.transition(h.state, {
      commandId: "stale",
      expectedRevision: 99,
      action: { type: "TALK", target: 0 },
    }).result,
    "rejected",
  );
  assert.deepEqual(h.state, initial);
  h.talk(0);
  const r = h.send({ type: "APPROVE", target: 0, choice: 0, actorId: "diego" });
  assert.equal(r.result, "rejected");
  assert.equal(h.state.lives, 3);
  assert.equal(h.state.approvals.length, 0);
});
test("current attachments are required and stale annexes do not grant approvals", () => {
  const h = harness({ mode: "classic" });
  h.approve(0);
  h.approve(1);
  h.approve(2);
  assert.equal(h.approve(3).result, "rejected");
  h.send({ type: "ATTACH_DOCUMENT", documentId: "budget" });
  assert.equal(h.approve(3).result, "accepted");
});
test("expensive plans can exhaust deadline with lives remaining", () => {
  let lost = false;
  for (let seed = 1; seed < 15; seed++) {
    const h = harness({ mode: "intense", seed });
    play(h, 1);
    if (h.state.status === "lost") {
      assert.equal(h.state.lives, 3);
      assert.equal(h.state.turns, 0);
      lost = true;
    }
  }
  assert.ok(lost);
});
test("malformed saves and forged current bases are rejected", () => {
  const h = harness({ mode: "classic" });
  h.approve(0);
  for (const patch of [
    { score: 690 },
    { lives: 1 },
    { schemaVersion: 99 },
    { eventPlan: ["nonsense"] },
    { documents: {} },
    { receipts: null },
  ])
    assert.equal(G.restore({ ...h.state, ...patch }), null);
  const bad = D.clone(h.state);
  bad.approvals[0].basisDigest = "forged";
  assert.equal(G.restore(bad), null);
});
test("legacy snapshots migrate without destroying signatures or current event", () => {
  for (const mode of ["classic", "normal"])
    for (let stop = 0; stop < 6; stop++) {
      const old = Legacy.fresh({ mode, random: () => 0.1 });
      for (let i = 0; i < stop; i++) {
        Legacy.answer(old, i, Legacy.stages[i].correct);
        if (old.pending) {
          Legacy.eventAnswer(old, 0);
          Legacy.eventAnswer(old, Legacy.currentEvent(old).correct);
        }
      }
      const migrated = M.migrate(old);
      assert.ok(migrated, "stage " + stop + " " + mode);
      assert.equal(migrated.score, old.score);
      assert.equal(migrated.lives, old.lives);
      check(migrated);
    }
  const v1 = {
    version: 1,
    stage: 1,
    lives: 3,
    score: 100,
    mistakes: [],
    elapsed: 2,
    status: "playing",
  };
  assert.ok(M.migrate(v1));
});
test("supports randomized questions per stage when randomQuestions is true", () => {
  const game = G.fresh({ randomQuestions: true, seed: 42 });
  assert.equal(game.questions.length, 6);
  for (let i = 0; i < 6; i++) {
    assert.ok(
      game.questions[i] >= 0 &&
        game.questions[i] < C.stages[i].questions.length,
    );
  }
  const restored = G.restore(game);
  assert.ok(restored);
  assert.deepEqual(restored.questions, game.questions);
});
module.exports = { harness, play };
