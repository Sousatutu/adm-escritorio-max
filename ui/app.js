(function (root) {
  "use strict";
  const { Content: C, Documents: D, Domain: G, Dialogues: Q, UI: U } = root.LB,
    E = U.escape,
    $ = (id) => document.getElementById(id);
  async function boot() {
    const dialog = U.dialog(),
      store = root.LB.Storage.create();
    let session = null,
      saved = null,
      saveClock = 0,
      timerSecond = -1,
      preference = {};
    try {
      preference =
        JSON.parse(localStorage.getItem("labirinto-visual") || "{}") || {};
    } catch {}
    const notice = (text) => {
      $("toast").textContent = text;
    };
    const scene = root.LB.Scene.create($("office"), {
      getState: () => session?.state || G.fresh(),
      isPaused: () => dialog.open || !session || session.conflict,
      onInteract: talk,
      onNotice: notice,
      onTick: (dt) => {
        if (!session || dialog.open || document.hidden) return;
        session.advance(dt);
        saveClock += dt;
        updateTimer();
        if (saveClock >= 5) {
          saveClock = 0;
          session.save();
        }
      },
    });
    scene.settings.economy = preference.economy === true;
    scene.settings.night = preference.night === true;
    const folder = root.LB.Inventory.create({
      getSession: () => session,
      dialog,
      onRefresh: refresh,
      onReturn: () => {
        if (session?.state.status !== "playing") result();
      },
    });
    function updateTimer() {
      if (!session) return;
      const t = Math.floor(session.elapsed);
      if (t !== timerSecond) {
        timerSecond = t;
        $("timer").textContent =
          String(Math.floor(t / 60)).padStart(2, "0") +
          ":" +
          String(t % 60).padStart(2, "0");
      }
    }
    function refresh() {
      if (!session) return;
      const s = session.state,
        e = G.event(s),
        next = D.next(s),
        valid = C.roles.filter((r) => D.activeApproval(s, r)).length;
      $("mode-label").textContent = C.modes[s.mode].label;
      $("turns").textContent = s.mode === "classic" ? "∞" : s.turns;
      $("turns").classList.toggle(
        "danger",
        s.mode !== "classic" && s.turns <= 3,
      );
      $("lives").textContent = "● ".repeat(s.lives) + "○ ".repeat(3 - s.lives);
      $("lives").setAttribute("aria-label", s.lives + " de 3 vidas");
      $("score").textContent = s.score;
      updateTimer();
      $("event-banner").hidden = !e;
      if (e) {
        $("event-title").textContent = e.title;
        $("event-text").textContent =
          s.pending.phase === "decision"
            ? "Escolha um plano para reorganizar o expediente."
            : e.task;
      }
      $("objective-title").textContent =
        s.status === "won"
          ? "Processo aprovado"
          : s.status === "lost"
            ? "Expediente encerrado"
            : e
              ? s.pending.phase === "decision"
                ? "Escolha seu novo plano"
                : "Confira a mudança"
              : next
                ? C.stages[next.index].title
                : "Pasta concluída";
      $("objective-text").textContent = e
        ? e.task
        : next
          ? next.index === 5 && s.flags.directorAway
            ? "Marina assume a decisão final com a delegação conferida."
            : C.stages[next.index].objective
          : "Todas as decisões foram registradas.";
      const missing = !e && next ? D.missing(s, next.id) : [];
      $("missing-list").innerHTML = missing.length
        ? `<ul class="pending-list">${missing.map((t) => `<li>${E(t)}</li>`).join("")}</ul>${missing.some((t) => t.startsWith("Anexe")) ? '<button id="open-annex" class="text-btn">Abrir pasta e anexar →</button>' : ""}`
        : "";
      if ($("open-annex")) $("open-annex").onclick = folder.open;
      $("go-next").disabled = s.status !== "playing" || session.conflict;
      $("go-next").innerHTML =
        e && s.pending.phase === "decision"
          ? "Escolher plano <span>→</span>"
          : "Visitar setor <span>→</span>";
      $("progress-count").textContent = valid + "/6";
      $("progress-fill").style.width = (valid / 6) * 100 + "%";
      $("route").innerHTML = C.stages
        .map((r, i) => {
          const valid = D.activeApproval(s, r.id),
            old = s.approvals.some((a) => a.requirementId === r.id),
            current = s.status === "playing" && G.target(s) === i;
          return `<li class="${valid ? "complete" : current ? "current" : old ? "revalidate" : ""}"><button data-sector="${i}" ${s.status !== "playing" ? "disabled" : ""}><span class="route-number">${valid ? "✓" : old ? "↻" : String(i + 1).padStart(2, "0")}</span><span><b>${E(r.role)}</b><small>${valid ? "Aprovação válida" : old ? "Revisão necessária" : E(C.actors[G.actorFor(s, i)].name)}</small></span>${current ? '<span class="route-arrow">→</span>' : ""}</button></li>`;
        })
        .join("");
      $("route")
        .querySelectorAll("[data-sector]")
        .forEach((b) => (b.onclick = () => visit(Number(b.dataset.sector))));
      $("event-count").textContent =
        s.mode === "classic"
          ? "Modo sem imprevistos"
          : s.eventIndex + "/3 imprevistos";
      $("event-log").innerHTML = s.journal.length
        ? s.journal
            .slice(-5)
            .reverse()
            .map(
              (j) =>
                `<li><span class="journal-dot ${j.type === "penalty" ? "penalty" : ""}"></span><span>${E(j.text)}</span></li>`,
            )
            .join("")
        : '<li><span class="journal-dot"></span><span>Seu primeiro expediente começou. Registre o pedido no Protocolo.</span></li>';
      $("folder-count").textContent =
        Object.keys(s.documents).length + " documentos · REQ-001";
      const pin = folder.pinned,
        doc = s.documents[pin];
      $("pinned-document").hidden = !doc;
      if (doc)
        $("pinned-document").innerHTML =
          `<small>FIXADO NA SUA MESA</small><b>${E(C.documentNames[pin])}</b><span>Rev. ${doc.currentRevision} · ${pin === "request" ? D.current(doc).fields.quantity + " computadores" : D.attachmentValid(s, pin) ? "Anexado à pasta" : "Anexo pendente"}</span>`;
      $("save-status").textContent = session.conflict
        ? "Outra aba atualizou esta partida. Recarregue a página."
        : {
            idle: "Partida local",
            saving: "Salvando…",
            saved: "✓ Progresso salvo neste navegador",
            failed:
              "Não foi possível salvar. Mantenha esta aba aberta ou exporte sua pasta.",
          }[session.storageStatus];
    }
    function begin(state) {
      dialog.close();
      saved = null;
      session = root.LB.Session.create(state, {
        store,
        nonce:
          root.crypto?.randomUUID?.() ||
          "s" + Date.now() + "-" + Math.random().toString(36).slice(2),
      });
      session.subscribe((_, r) => {
        refresh();
        if (r.conflict) {
          dialog.show(
            "PARTIDA ATUALIZADA",
            "Outra aba continuou este expediente",
            '<p>Recarregue para retomar o progresso mais recente. Esta aba deixou de gravar alterações.</p><button id="reload-game" class="primary">Recarregar partida</button>',
            { locked: true },
          );
          dialog.bind("reload-game", () => location.reload());
        }
      });
      $("welcome").hidden = true;
      $("play").hidden = false;
      scene.start();
      timerSecond = -1;
      saveClock = 0;
      refresh();
      session.save();
      $("office").focus({ preventScroll: true });
      if (state.status !== "playing") result();
    }
    function newGame() {
      begin(
        G.fresh({
          mode: $("difficulty").value,
          seed:
            root.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now(),
          randomQuestions: true,
        }),
      );
    }
    function restart() {
      dialog.show(
        "RECOMEÇAR",
        "Um novo expediente?",
        `<p>Uma nova partida substituirá o progresso salvo deste expediente. Você pode exportar sua pasta antes de recomeçar.</p><div class="modal-actions"><button id="confirm-restart" class="primary">Começar nova partida</button><button id="cancel-restart" class="secondary">Continuar aqui</button></div>`,
      );
      dialog.bind("confirm-restart", newGame);
      dialog.bind("cancel-restart", () => {
        dialog.close();
        if (session && session.state.status !== "playing") result();
      });
    }
    function visit(index) {
      if (!session || session.state.status !== "playing") return;
      scene.visit(index);
      $("room-label").textContent = "/ " + C.stages[index].role.toUpperCase();
      talk(index);
    }
    function talk(index) {
      if (!session || session.state.status !== "playing") return;
      const r = session.dispatch({ type: "TALK", target: index });
      if (r.result === "rejected") return notice(r.outcome.message);
      showTalk();
    }
    function npcHeader(target) {
      const s = session.state,
        actor = G.actorFor(s, target);
      return `<div class="npc-header"><div class="portrait"><img src="assets/portraits/${actor}.png" alt=""></div><div><b>${E(C.actors[actor].name)}</b><span>${E(C.stages[target].role)}${actor === "marina" ? " · substituta designada" : ""}</span></div></div>`;
    }
    function choices(items, attr) {
      const shuffled = items
        .map((text, id) => ({ text, id, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort);
      return (
        '<div class="choice-list">' +
        shuffled
          .map(
            (c, i) =>
              `<button class="choice" ${attr}="${c.id}"><span class="choice-number">${i + 1}</span><span>${E(c.text)}</span><span>→</span></button>`,
          )
          .join("") +
        "</div>"
      );
    }
    function showTalk() {
      const s = session.state,
        conv = s.conversation;
      if (!conv) return;
      if (conv.node === "decision") return analysis();
      const node = Q.nodes[conv.node],
        stage = C.stages[conv.target];
      let text = node.text;
      if (conv.node === "reception" && conv.target === 3)
        text = s.flags.favorWarningSeen
          ? "Que bom ver você de novo. Nossa conversa anterior fica registrada; seguimos pelos critérios. Como posso ajudar?"
          : "Oi! Nos conhecemos antes de você entrar na NetFeliz. Posso orientar você e analisar o pedido dentro dos critérios.";
      dialog.show(
        "CONVERSA · " + stage.role,
        conv.node === "warning"
          ? "Amizade tem limites no processo"
          : conv.node === "refused"
            ? "O critério vale para todos"
            : "Converse com " + C.actors[conv.actorId].name,
        npcHeader(conv.target) +
          `<p class="${conv.node === "warning" ? "warning-box" : ""}">${E(text)}</p><div class="choice-list">${node.choices
            .filter((c) => Q.allowed(c, s, stage.id))
            .map(
              (c) =>
                `<button class="choice" data-dialogue="${c.id}"><span>${E(c.label)}</span><span>→</span></button>`,
            )
            .join(
              "",
            )}</div><p class="pause-note">Conversa pausada. Orientação e reconsideração não gastam ações.</p>`,
      );
      dialog.content.querySelectorAll("[data-dialogue]").forEach(
        (b) =>
          (b.onclick = () => {
            const r = session.dispatch({
              type: "DIALOGUE_CHOICE",
              node: conv.node,
              choice: b.dataset.dialogue,
            });
            if (r.result === "rejected") return notice(r.outcome.message);
            if (r.outcome.kind === "penalty") {
              root.LB.Audio.play("bad");
              notice(
                "Favor recusado: −1 vida, −" +
                  r.outcome.loss +
                  " pontos e até 2 ações.",
              );
            }
            if (session.state.status !== "playing") result();
            else showTalk();
          }),
      );
    }
    function analysis() {
      const s = session.state,
        conv = s.conversation;
      if (!conv) return;
      const t = conv.target,
        stage = C.stages[t],
        event = G.event(s);
      if (event) {
        if (s.pending.phase === "decision") return eventPlan();
        if (event.target === t) return reviewEvent();
        dialog.show(
          "ANÁLISE SUSPENSA",
          event.title,
          npcHeader(t) +
            `<p>${E(event.task)} Conclua essa conferência antes de obter novas assinaturas.</p><button id="visit-event" class="primary">Ir para ${E(C.stages[event.target].role)} →</button>`,
        );
        dialog.bind("visit-event", () => visit(event.target));
        return;
      }
      const missing = D.missing(s, stage.id),
        valid = D.activeApproval(s, stage.id);
      if (valid) {
        dialog.show(
          "APROVAÇÃO VÁLIDA",
          "Este parecer já está registrado",
          npcHeader(t) +
            '<p>A aprovação permanece válida para os dados atuais. Consulte a pasta ou siga para a próxima pendência.</p><div class="modal-actions"><button id="valid-folder" class="secondary">Consultar pasta</button><button id="valid-next" class="primary">Próximo setor →</button></div>',
        );
        dialog.bind("valid-folder", folder.open);
        dialog.bind("valid-next", goNext);
        return;
      }
      if (missing.length) {
        dialog.show(
          "REQUISITOS PENDENTES",
          "A pasta precisa de uma conferência",
          npcHeader(t) +
            `<ul class="help-list">${missing.map((m) => "<li>" + E(m) + "</li>").join("")}</ul><div class="modal-actions"><button id="regularize" class="primary">${missing.some((m) => m.startsWith("Anexe")) ? "Organizar anexos" : "Ir ao setor pendente"}</button><button id="skip-order" class="secondary">Insistir sem os requisitos</button></div><p class="warning-box">Insistir custa 1 vida, até 25 pontos e 2 ações. Consultar a pasta e voltar ao fluxo é gratuito.</p>`,
        );
        dialog.bind(
          "regularize",
          missing.some((m) => m.startsWith("Anexe")) ? folder.open : goNext,
        );
        dialog.bind("skip-order", () =>
          feedback(session.dispatch({ type: "SKIP_ORDER", target: t }), t),
        );
        return;
      }
      const qIdx = s.questions?.[t] ?? 0;
      const q = stage.questions?.[qIdx] || stage;
      dialog.show(
        "ANÁLISE FORMAL · " + C.concepts[t].name,
        stage.title,
        npcHeader(t) +
          `<p>${E(q.question)}</p>` +
          choices(q.choices, "data-answer") +
          '<p class="pause-note">Acerto: 1 ação. Erro: −1 vida, até −25 pontos e 2 ações.</p>',
      );
      dialog.content
        .querySelectorAll("[data-answer]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              feedback(
                session.dispatch({
                  type: "APPROVE",
                  target: t,
                  choice: Number(b.dataset.answer),
                }),
                t,
              )),
        );
    }
    function feedback(r, target) {
      if (r.result === "rejected") {
        notice(r.outcome.message);
        return;
      }
      const s = session.state,
        good = !["penalty", "expired"].includes(r.outcome.kind);
      root.LB.Audio.play(good ? "stamp" : "bad");
      notice(r.outcome.message);
      if (s.status !== "playing") return result();
      dialog.show(
        good ? "REGISTRO CONCLUÍDO" : "O PROCESSO ENSINA",
        good ? "Um passo registrado" : "Vamos ajustar o caminho",
        `<div class="stamp-feedback ${good ? "" : "error"}">${good ? "✓ REGISTRADO" : "REVER CRITÉRIO"}</div><p>${E(r.outcome.message)}</p>${!good ? `<p class="warning-box">${r.outcome.kind === "penalty" ? "−1 vida · −" + r.outcome.loss + " pontos · até 2 ações." : "Prazo insuficiente."}</p>` : ""}${target !== undefined ? `<div class="lesson-box"><b>${E(C.concepts[target].name)}</b><p>${E(C.concepts[target].description)}</p></div>` : ""}<button id="feedback-next" class="primary">${s.pending?.phase === "decision" ? "Ver mudança de planos →" : "Voltar ao escritório →"}</button>`,
      );
      dialog.bind("feedback-next", () => {
        dialog.close();
        if (target !== undefined) scene.stamp(target);
        if (session.state.pending?.phase === "decision") eventPlan();
      });
    }
    function eventPlan() {
      if (!session) return;
      const s = session.state,
        e = G.event(s);
      if (!e) return;
      if (s.pending.phase === "rework") return visit(e.target);
      dialog.show(
        e.tag,
        e.title,
        `<div class="incident-art" aria-hidden="true">!</div><p>${E(e.description)}</p><div class="choice-list">${e.choices.map((c, i) => `<button class="choice" data-plan="${i}"><span>${E(c.label)}<small class="event-cost">${c.wrong ? "Se irregular: 1 vida, até 25 pontos e 2 ações" : c.cost + " " + (c.cost === 1 ? "ação" : "ações") + " para executar o plano"}</small></span><span>→</span></button>`).join("")}</div><p class="pause-note">Depois do plano, a conferência no setor custa mais 1 ação.</p>`,
      );
      dialog.content
        .querySelectorAll("[data-plan]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              feedback(
                session.dispatch({
                  type: "EVENT_PLAN",
                  choice: Number(b.dataset.plan),
                }),
              )),
        );
    }
    function reviewEvent() {
      const s = session.state,
        e = G.event(s);
      dialog.show(
        "CONFERÊNCIA DA MUDANÇA",
        e.title,
        npcHeader(e.target) +
          `<p>${E(e.question)}</p>` +
          choices(e.checks, "data-review") +
          '<p class="pause-note">Conferência correta: 1 ação e 30 pontos.</p>',
      );
      dialog.content
        .querySelectorAll("[data-review]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              feedback(
                session.dispatch({
                  type: "EVENT_REVIEW",
                  choice: Number(b.dataset.review),
                }),
                e.target,
              )),
        );
    }
    function goNext() {
      if (!session) return;
      const s = session.state;
      if (s.pending?.phase === "decision") eventPlan();
      else visit(G.target(s));
    }
    function result() {
      if (!session) return;
      const s = session.state,
        won = s.status === "won";
      dialog.show(
        "FIM DO EXPEDIENTE",
        won
          ? "Compra aprovada. Trabalho registrado."
          : s.lives
            ? "O prazo chegou ao fim."
            : "Hora de rever o processo.",
        `<p>${won ? "Você concluiu as análises com responsabilidades, evidências e autoridade definidas." : "A pasta guarda suas decisões. Um novo expediente permite testar outros planos e caminhos."}</p><div class="result-stats"><div><b>${s.score}</b><span>pontos</span></div><div><b>${s.eventIndex}</b><span>imprevistos resolvidos</span></div><div><b>${s.mistakes.length}</b><span>erros registrados</span></div></div><h3>O que seu expediente mostra</h3><ul class="result-list">${C.concepts.map((c, i) => `<li><b>${D.activeApproval(s, C.roles[i]) ? "✓" : "○"} ${E(c.name)}</b><span>${E(c.example)}</span></li>`).join("")}</ul><div class="lesson-box"><p>O fluxo é uma simplificação didática. Setores especializados, como o Jurídico, não representam necessariamente um nível superior na hierarquia.</p></div><div class="modal-actions"><button id="result-new" class="primary">Jogar outro expediente</button><button id="result-folder" class="secondary">Examinar pasta final</button></div>`,
        { locked: true },
      );
      dialog.bind("result-new", () => {
        dialog.show(
          "NOVO EXPEDIENTE",
          "Escolha o ritmo",
          '<p>Volte à tela inicial para escolher a dificuldade.</p><button id="back-welcome" class="primary">Voltar ao início</button>',
        );
        dialog.bind("back-welcome", () => {
          dialog.close();
          scene.stop();
          saved = session.export();
          session = null;
          $("welcome").hidden = false;
          $("play").hidden = true;
          $("resume").hidden = false;
          $("load-status").textContent = "Seu último expediente está salvo.";
        });
      });
      dialog.bind("result-folder", folder.open);
    }
    function overview() {
      dialog.show(
        "NETFELIZ / ANDAR TÉRREO",
        "Conheça os setores",
        '<p>Selecione um setor para chegar à porta do responsável. Visitar e pedir orientação é gratuito.</p><div class="sector-grid">' +
          C.stages
            .map(
              (s, i) =>
                `<button class="secondary" data-visit="${i}"><b>${String(i + 1).padStart(2, "0")} · ${E(s.role)}</b><span>${E(C.actors[G.actorFor(session.state, i)].name)}</span></button>`,
            )
            .join("") +
          "</div>",
      );
      dialog.content
        .querySelectorAll("[data-visit]")
        .forEach((b) => (b.onclick = () => visit(Number(b.dataset.visit))));
    }
    function help() {
      dialog.show(
        "MANUAL DO PRIMEIRO DIA",
        "Um processo, várias decisões",
        `<ol class="help-list"><li><b>Explore.</b> Clique no mapa para focar e use WASD/setas; E/Enter conversa. Clique no chão para caminhar. No celular, use os botões. “Visitar setor” também funciona com Tab e Enter.</li><li><b>Converse.</b> Apresente o pedido para análise ou peça orientação. Pedir um favor mostra um aviso antes da penalização.</li><li><b>Organize a pasta.</b> Anexe o parecer financeiro antes da Diretoria e a minuta antes da decisão final. Se houver substituição, anexe também a delegação.</li><li><b>Replaneje.</b> Ocorrências exigem um plano e uma conferência no setor. Revise os anexos quando uma nova versão for emitida.</li><li><b>Cuide do prazo.</b> Acertos custam 1 ação; planos mostram o custo; erros custam 1 vida, até 25 pontos e 2 ações. Ler, mover e anexar são gratuitos. Revalidar não repete recompensas.</li></ol><p class="lesson-box">Não há corrida contra segundos. O tempo ativo é informativo e pausa durante as consultas. O modo Tranquilo remove imprevistos e limite de ações.</p>`,
      );
    }
    $("start").onclick = () => (saved ? restart() : newGame());
    $("resume").onclick = () => saved && begin(saved);
    $("go-next").onclick = goNext;
    $("event-open").onclick = eventPlan;
    $("document").onclick = folder.open;
    $("restart").onclick = restart;
    $("overview").onclick = overview;
    $("help").onclick = help;
    $("interact").onclick = () => {
      const n = scene.nav.nearest();
      if (n >= 0) talk(n);
      else notice("Aproxime-se de um colega ou use Visitar setor.");
    };
    $("sound").onclick = () => {
      const on = root.LB.Audio.toggle();
      $("sound").textContent = "Som " + (on ? "ligado" : "desligado");
      $("sound").setAttribute("aria-pressed", String(on));
    };
    $("settings").onclick = () => {
      dialog.show(
        "PREFERÊNCIAS VISUAIS",
        "Seu escritório, seu ritmo",
        `<label class="settings-row"><span><b>Expediente noturno</b><small>Luzes locais e sombras mais profundas.</small></span><input id="setting-night" type="checkbox" ${scene.settings.night ? "checked" : ""}></label><label class="settings-row"><span><b>Modo econômico</b><small>Iluminação simples e limite de 30 quadros por segundo.</small></span><input id="setting-economy" type="checkbox" ${scene.settings.economy ? "checked" : ""}></label><p class="small muted">A preferência de reduzir movimento do seu sistema é respeitada.</p>`,
      );
      for (const key of ["night", "economy"])
        $("setting-" + key).onchange = (e) => {
          scene.settings[key] = e.target.checked;
          try {
            localStorage.setItem(
              "labirinto-visual",
              JSON.stringify(scene.settings),
            );
          } catch {}
        };
    };
    $("glossary").onclick = () =>
      dialog.show(
        "TEORIA EM CAMPO",
        "Guia de bolso",
        C.concepts
          .map(
            (c) =>
              `<div class="lesson-box"><h3>${E(c.name)}</h3><p>${E(c.description)}</p><p class="small muted">No expediente: ${E(c.example)}</p></div>`,
          )
          .join(""),
      );
    $("about").onclick = () =>
      dialog.show(
        "PROJETO ACADÊMICO · IFTO",
        "O Labirinto Burocrático",
        "<p>Uma adaptação educativa da proposta NetFeliz para estudar a Teoria da Burocracia de Max Weber. Personagens e acontecimentos são fictícios.</p><p>Referência conceitual: Max Weber, <em>Economia e sociedade</em>, discussão sobre dominação legal e administração burocrática. A equipe deve indicar a edição consultada em seu trabalho acadêmico.</p><p>Uma organização racional depende de responsabilidades e critérios verificáveis. Lentidão e excesso de formalismo, sozinhos, não definem a teoria.</p>",
      );
    root.addEventListener("pagehide", () => session?.quickSave());
    document.addEventListener("visibilitychange", () => {
      scene.nav.clear();
      if (document.hidden) session?.quickSave();
    });
    root.addEventListener("storage", (e) => {
      if (e.key === store.key && session) {
        try {
          const envelope = JSON.parse(e.newValue);
          if (G.restore(envelope?.state)) session.onExternal(envelope);
        } catch {}
      }
    });
    $("start").disabled = true;
    try {
      const data = await store.load();
      for (const candidate of data.candidates) {
        saved = G.restore(candidate.state);
        if (saved) break;
      }
      if (!saved && data.legacy) {
        saved = root.LB.Migration.migrate(data.legacy);
        if (saved)
          $("load-status").textContent =
            "Partida anterior recuperada. O salvamento original foi preservado.";
      }
      if (saved) {
        $("resume").hidden = false;
        if (!$("load-status").textContent.startsWith("Partida anterior"))
          $("load-status").textContent =
            "Sua pasta está pronta para continuar.";
      } else
        $("load-status").textContent =
          data.candidates.length || data.legacy
            ? "O salvamento encontrado não pôde ser validado. Você pode iniciar um novo expediente."
            : "Tudo pronto. Seu progresso será salvo neste navegador.";
    } catch {
      $("load-status").textContent =
        "Armazenamento indisponível. Você pode jogar mantendo esta aba aberta.";
    } finally {
      $("start").disabled = false;
    }
    return {
      get session() {
        return session;
      },
      scene,
      folder,
      dialog,
    };
  }
  root.LB.App = { boot };
})(globalThis);
