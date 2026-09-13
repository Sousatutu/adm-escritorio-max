const test = require("node:test"),
  assert = require("node:assert/strict");
const S = require("../application/session.js"),
  Storage = require("../infrastructure/storage.js"),
  G = require("../domain/game.js"),
  D = require("../domain/documents.js"),
  W = require("../rendering/world.js"),
  L = require("../rendering/lighting.js");
test("session persists a command once, survives a duplicate and blocks stale concurrent tabs", async () => {
  const writes = [],
    store = {
      save: async (e) => {
        writes.push(e);
        return { ok: true };
      },
      quickSave: (e) => writes.push(e),
    };
  const s = S.create(G.fresh(), { store, nonce: "test", now: () => 100 });
  const env = {
    commandId: "one",
    expectedRevision: 0,
    action: { type: "TALK", target: 0 },
  };
  s.dispatch(null, env);
  await new Promise(setImmediate);
  assert.equal(writes.length, 1);
  assert.equal(s.storageStatus, "saved");
  assert.equal(s.dispatch(null, env).result, "duplicate");
  assert.equal(writes.length, 1);
  s.onExternal({ savedAt: 200, sessionId: "other" });
  assert.equal(s.dispatch({ type: "TALK", target: 1 }).result, "rejected");
  await s.save();
  s.quickSave();
  assert.equal(writes.length, 1);
});
test("unavailable persistence reports failure without preventing gameplay", async () => {
  const s = S.create(G.fresh(), {
    store: {
      save: async () => {
        throw Error("quota");
      },
    },
    nonce: "quota",
  });
  s.dispatch({ type: "TALK", target: 0 });
  await new Promise(setImmediate);
  assert.equal(s.state.conversation.target, 0);
  assert.equal(s.storageStatus, "failed");
  s.advance(0.5);
  assert.equal(s.export().elapsed, 0.5);
  assert.equal(s.state.elapsed, 0);
});
test("storage falls back to local, serializes writes and keeps legacy snapshot", async () => {
  const values = new Map([[Storage.OLD, '{"version":1}']]),
    storage = {
      getItem: (k) => values.get(k),
      setItem: (k, v) => values.set(k, v),
    },
    store = Storage.create({ storage, indexedDB: null });
  const a = { savedAt: 1, state: G.fresh() },
    b = { savedAt: 2, state: G.fresh({ seed: 2 }) };
  const result = await Promise.all([store.save(a), store.save(b)]);
  assert.ok(result.every((r) => r.ok && r.backend === "local"));
  const loaded = await store.load();
  assert.equal(loaded.candidates[0].state.seed, 2);
  assert.equal(loaded.legacy.version, 1);
  assert.equal(values.get(Storage.OLD), '{"version":1}');
});
test("fully blocked storage stays usable in memory", async () => {
  const store = Storage.create({
    storage: {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("quota");
      },
    },
    indexedDB: null,
  });
  assert.deepEqual(await store.load(), { candidates: [], legacy: null });
  assert.equal((await store.save({ state: G.fresh(), savedAt: 1 })).ok, false);
  assert.equal(store.quickSave({}), false);
});
test("every room can be reached through free cells without crossing walls or furniture", () => {
  const start = { x: 128, y: 336 };
  for (const r of W.rooms) {
    const path = W.path(start, { x: r.npcX, y: r.npcY + 30 });
    assert.ok(path?.length, "room " + r.index);
    let prev = start;
    for (const point of path) {
      for (let t = 0; t <= 1; t += 0.1)
        assert.ok(
          W.canStand(
            prev.x + (point.x - prev.x) * t,
            prev.y + (point.y - prev.y) * t,
          ),
        );
      prev = point;
    }
  }
  assert.equal(W.path(start, { x: 20, y: 100 }), null);
});
test("visibility polygons stop at the nearest wall, including a door edge", () => {
  const segments = [
      [0, 0, 100, 0],
      [100, 0, 100, 100],
      [100, 100, 0, 100],
      [0, 100, 0, 0],
      [50, 0, 50, 100],
    ],
    p = L.visibility(20, 50, segments);
  assert.ok(p.length);
  assert.ok(p.every((v) => v.x <= 50.000001));
  assert.equal(
    Math.round(L.intersect(20, 50, 0, [50, 0, 50, 100]).distance),
    30,
  );
  assert.equal(L.intersect(20, 50, 0, [50, 0, 50, 40]), null);
});
test("forged authority, missing signed documents and malformed fields cannot restore", () => {
  let s = G.fresh({ mode: "classic" }),
    n = 0;
  for (const action of [
    { type: "TALK", target: 0 },
    { type: "DIALOGUE_CHOICE", node: "reception", choice: "formal" },
    { type: "APPROVE", target: 0, choice: 0 },
  ])
    s = G.transition(s, {
      commandId: "x" + ++n,
      expectedRevision: s.revision,
      action,
    }).state;
  const wrong = D.clone(s);
  wrong.approvals[0].signerId = "diego";
  assert.equal(G.restore(wrong), null);
  const field = D.clone(s);
  delete field.documents.request.revisions[0].fields.number;
  assert.equal(G.restore(field), null);
});
test("reattaching a current revision is a no-op even when other annexes follow it", () => {
  const s = G.fresh();
  D.issue(
    s,
    "budget",
    {
      quantity: 5,
      unitPrice: 1000,
      total: 5000,
      available: 5000,
      validated: true,
    },
    "test",
  );
  D.attach(s, "budget");
  D.attach(s, "contract");
  const revision = s.documents.request.currentRevision;
  assert.equal(D.attach(s, "budget"), false);
  assert.equal(s.documents.request.currentRevision, revision);
});

test("keyboard movement requires canvas focus and releases on modal or window blur", () => {
  const vm = require("node:vm"),
    fs = require("node:fs"),
    listeners = {},
    canvas = {
      addEventListener() {},
      focus() {
        doc.activeElement = canvas;
      },
    },
    doc = {
      activeElement: null,
      addEventListener() {},
      querySelectorAll: () => [],
    };
  let allowed = true;
  const context = {
    LB: { World: W },
    document: doc,
    addEventListener: (name, fn) => (listeners[name] = fn),
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../application/navigation.js"), "utf8"),
    context,
  );
  const nav = context.LB.Navigation.create(canvas, {
      toWorld: () => ({ x: 0, y: 0 }),
      canMove: () => allowed,
      onInteract() {},
      onNotice() {},
    }),
    key = { key: "w", preventDefault() {} };
  listeners.keydown(key);
  nav.update(0.1);
  assert.equal(nav.player.y, 336);
  canvas.focus();
  listeners.keydown(key);
  nav.update(0.1);
  assert.ok(nav.player.y < 336);
  const y = nav.player.y;
  allowed = false;
  nav.update(0.1);
  allowed = true;
  nav.update(0.1);
  assert.equal(nav.player.y, y);
  listeners.keydown(key);
  listeners.blur();
  nav.update(0.1);
  assert.equal(nav.player.y, y);
  for (let i = 0; i < 6; i++) {
    nav.visit(i);
    assert.ok(W.canStand(nav.player.x, nav.player.y));
    assert.equal(nav.nearest(), i);
  }
});
test("malformed latest JSON does not prevent recovering the legacy save", async () => {
  const store = Storage.create({
    indexedDB: null,
    storage: {
      getItem: (k) => (k === Storage.KEY ? "broken" : '{"version":1}'),
    },
  });
  assert.equal((await store.load()).legacy.version, 1);
});
