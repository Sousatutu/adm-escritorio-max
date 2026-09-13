const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  path = require("node:path"),
  { pathToFileURL } = require("node:url");
const port = process.env.CDP_PORT || "9224",
  url =
    process.env.GAME_URL ||
    pathToFileURL(path.resolve(__dirname, "../index.html")).href;
fs.mkdirSync(".tmp/visual-qa", { recursive: true });
(async () => {
  const tabs = await (
      await fetch("http://127.0.0.1:" + port + "/json/list")
    ).json(),
    ws = new WebSocket(
      tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
    );
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map(),
    errors = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.reject(m.error) : p.resolve(m.result);
    } else if (m.method === "Runtime.exceptionThrown")
      errors.push(m.params.exceptionDetails);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const key = ++id;
      pending.set(key, { resolve, reject });
      ws.send(JSON.stringify({ id: key, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const click = (selector) =>
    evaluate(
      `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled||!el.getClientRects().length)throw Error('Unavailable '+${JSON.stringify(selector)});el.click();return true})()`,
    );
  const snap = async (name) => {
    await evaluate(
      "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))",
    );
    const s = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    fs.writeFileSync(
      ".tmp/visual-qa/" + name + ".png",
      Buffer.from(s.data, "base64"),
    );
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url });
  for (let i = 0; i < 50; i++) {
    if (
      await evaluate(
        "document.readyState==='complete' && !!document.querySelector('#start')?.onclick && !document.querySelector('#start').disabled",
      )
    )
      break;
    await new Promise((r) => setTimeout(r, 100));
  }

  errors.length = 0;
  await snap("v3-welcome");
  await evaluate("document.querySelector('#difficulty').value='intense'");
  await click("#start");
  if (await evaluate("!!document.querySelector('#confirm-restart')"))
    await click("#confirm-restart");
  await snap("v3-office");
  const state = () =>
    evaluate(
      "new Promise((resolve,reject)=>{let tries=0;function poll(){if(!document.querySelector('#save-status').textContent.includes('Salvando'))return resolve(JSON.parse(localStorage.getItem('labirinto-burocratico-v3')).state);if(++tries>500)return reject(Error('Save timeout'));setTimeout(poll,10);}poll();})",
    );
  let savedAtReload = false;
  for (let step = 0; step < 60; step++) {
    const s = await state();
    if (s.status !== "playing") break;
    if (await evaluate("document.querySelector('#modal').open"))
      await click("#close-modal");
    if (s.pending?.phase === "decision") {
      await click("#event-open");
      if (s.eventIndex === 0) await snap("v3-event");
      await click('[data-plan="0"]');
      await click("#feedback-next");
    } else if (s.pending) {
      await click("#go-next");
      await click('[data-dialogue="formal"]');
      const answer = await evaluate(
        "LB.Content.events.find(e=>e.title===document.querySelector('#modal-title').textContent).correct",
      );
      await click(`[data-review="${answer}"]`);
      await click("#feedback-next");
    } else {
      const next = await evaluate(
        "LB.Documents.next(JSON.parse(localStorage.getItem('labirinto-burocratico-v3')).state).index",
      );
      if (next === 3 || next === 5) {
        await click("#document");
        for (const id of next === 3 ? ["budget"] : ["contract", "delegation"])
          if (s.documents[id]) {
            await click(`[data-document="${id}"]`);
            if (
              !(await evaluate(
                "document.querySelector('#attach-document').disabled",
              ))
            )
              await click("#attach-document");
          }
        await snap("v3-folder");
        await click("#folder-back");
      }
      await click("#go-next");
      if (next === 0) await snap("v3-conversation");
      await click('[data-dialogue="formal"]');
      const answer = [0, 2, 1, 2, 0, 1][next];
      await click(`[data-answer="${answer}"]`);
      if ((await state()).status === "playing") await click("#feedback-next");
    }
    const after = await state();
    assert.ok(
      await evaluate(
        "!!LB.Domain.restore(JSON.parse(localStorage.getItem('labirinto-burocratico-v3')).state)",
      ),
    );
    if (after.eventIndex === 1 && !after.pending && !savedAtReload) {
      savedAtReload = true;
      await send("Page.reload");
      for (let i = 0; i < 50; i++) {
        if (
          await evaluate(
            "document.querySelector('#resume')&&!document.querySelector('#resume').hidden",
          )
        )
          break;
        await new Promise((r) => setTimeout(r, 100));
      }
      await click("#resume");
      assert.equal((await state()).score, after.score);
    }
  }
  const final = await state();
  assert.equal(final.status, "won");
  assert.equal(final.score, 690);
  await snap("v3-result");
  await click("#result-new");
  await click("#back-welcome");
  await evaluate("document.querySelector('#difficulty').value='classic'");
  await click("#start");
  await click("#confirm-restart");
  await click('[data-sector="3"]');
  await click('[data-dialogue="favor"]');
  assert.equal((await state()).lives, 3);
  await snap("v3-warning");
  await click('[data-dialogue="reconsider"]');
  assert.equal((await state()).lives, 3);
  await click('[data-dialogue="favor"]');
  await click('[data-dialogue="insist"]');
  assert.equal((await state()).lives, 2);
  assert.equal((await state()).mistakes.length, 1);
  await click("#close-modal");
  await click("#settings");
  await evaluate(
    "document.querySelector('#setting-night').checked=true;document.querySelector('#setting-night').dispatchEvent(new Event('change'))",
  );
  await click("#close-modal");
  await snap("v3-night");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await snap("v3-mobile-office");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
  );
  await click("#go-next");
  await snap("v3-mobile-dialogue");
  assert.equal(
    await evaluate(
      'document.querySelector("#modal").scrollWidth>document.querySelector("#modal").clientWidth',
    ),
    false,
  );
  await click('[data-dialogue="formal"]');
  await click('[data-answer="0"]');
  await click("#feedback-next");
  await click("#document");
  await snap("v3-mobile-folder");
  assert.equal(
    await evaluate(
      'document.querySelector("#modal").scrollWidth>document.querySelector("#modal").clientWidth',
    ),
    false,
  );
  await click('[data-document="request"]');
  await click("#revise-request");
  await evaluate(
    "document.querySelector('#quantity').value='7';document.querySelector('#justification').value='Duas novas vagas para a equipe administrativa.'",
  );
  await evaluate("document.querySelector('#revision-form').requestSubmit()");
  assert.equal(
    (await state()).documents.request.revisions.at(-1).fields.quantity,
    7,
  );
  await click("#folder-back");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 740,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await snap("v3-small-mobile");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      status: final.status,
      score: final.score,
      turns: final.turns,
      eventPlan: final.eventPlan,
      restored: savedAtReload,
      favorPenalty: "once",
      mobile: [390, 320],
      errors,
    }),
  );
  ws.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
