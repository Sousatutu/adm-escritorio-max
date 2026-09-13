(function (root) {
  "use strict";
  const { World: W, Content: C, Documents: D, Domain: G, Atlas: A } = root.LB;
  const palettes = [
    ["#D7C8AC", "#487969"],
    ["#C3D2D5", "#5B7A97"],
    ["#D6C0A5", "#A47F4E"],
    ["#C7D5BC", "#628766"],
    ["#CCC4D5", "#847297"],
    ["#BED1CC", "#477786"],
  ];
  function create(
    canvas,
    { getState, isPaused, onInteract, onNotice, onTick },
  ) {
    const ctx = canvas.getContext("2d"),
      base = document.createElement("canvas");
    base.width = W.width;
    base.height = W.height;
    const b = base.getContext("2d");
    const sprite = new Image();
    sprite.src = "assets/characters.png";
    const camera = { x: 0, y: 0 },
      settings = { economy: false, night: false },
      reduced = root.matchMedia("(prefers-reduced-motion: reduce)");
    let last = 0,
      active = false,
      lastDraw = 0,
      frameCount = 0,
      sampleStart = 0,
      fps = 0,
      animation = null,
      nearby = -2;
    const light = root.LB.Lighting.create(canvas.width, canvas.height, W);
    function rect(c, x, y, w, h, color) {
      c.fillStyle = color;
      c.fillRect(Math.round(x), Math.round(y), w, h);
    }
    function text(c, str, x, y, size = 9, color = "#233D4C", align = "left") {
      c.fillStyle = color;
      c.font = `${size}px Consolas, monospace`;
      c.textAlign = align;
      c.fillText(str, Math.round(x), Math.round(y));
    }
    function poly(c, points, color) {
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
    }
    function plant(c, x, y) {
      rect(c, x + 2, y + 17, 17, 17, "#835E45");
      rect(c, x, y + 14, 21, 5, "#B88D61");
      rect(c, x + 4, y + 19, 3, 12, "#C69C74");
      rect(c, x + 9, y - 4, 3, 21, "#446F4C");
      for (const [dx, dy, col] of [
        [0, 0, "#5F9770"],
        [10, -9, "#769F72"],
        [-5, -8, "#4E8963"],
        [6, -18, "#83B57D"],
      ]) {
        rect(c, x + dx, y + dy, 13, 8, col);
        rect(c, x + dx + 3, y + dy - 3, 7, 14, col);
      }
    }
    function cabinet(c, x, y) {
      rect(c, x + 3, y + 5, 29, 42, "#1E3D482A");
      rect(c, x, y, 28, 40, "#557988");
      for (let i = 0; i < 3; i++) {
        rect(c, x + 2, y + 2 + i * 12, 24, 10, "#A3B8BA");
        rect(c, x + 10, y + 6 + i * 12, 7, 2, "#486A76");
      }
      rect(c, x + 2, y + 40, 4, 4, "#385260");
      rect(c, x + 22, y + 40, 4, 4, "#385260");
    }
    function desk(c, r) {
      const d = r.desk;
      rect(c, d.x + 6, d.y + d.h - 3, 5, 12, "#705344");
      rect(c, d.x + d.w - 11, d.y + d.h - 3, 5, 12, "#705344");
      rect(c, d.x, d.y, d.w, d.h, "#9B7657");
      rect(c, d.x, d.y - 5, d.w, d.h, "#BD966F");
      rect(c, d.x + 2, d.y - 4, d.w - 4, 2, "#DFC39A");
      for (let k = 0; k < 3; k++)
        rect(c, d.x + 4, d.y + 7 + k * 8, d.w - 8, 1, "#91694F27");
      rect(c, d.x + 35, d.y - 22, 37, 26, "#233C4D");
      rect(c, d.x + 38, d.y - 19, 31, 19, "#7CAEBB");
      rect(c, d.x + 41, d.y - 16, 16, 2, "#E1F0DB");
      rect(c, d.x + 41, d.y - 11, 24, 1, "#BAD8CE");
      rect(c, d.x + 41, d.y - 7, 19, 1, "#BAD8CE");
      rect(c, d.x + 50, d.y + 4, 5, 8, "#3B5362");
      rect(c, d.x + 43, d.y + 11, 20, 3, "#3B5362");
      rect(c, d.x + 36, d.y + 18, 36, 9, "#E8DEBD");
      for (let k = 0; k < 6; k++)
        rect(c, d.x + 39 + k * 5, d.y + 21, 3, 3, "#8C9D96");
      rect(c, d.x + 80, d.y + 14, 16, 18, "#EEE4C9");
      rect(c, d.x + 83, d.y + 18, 10, 1, "#8EA59A");
      rect(c, d.x + 83, d.y + 23, 10, 1, "#8EA59A");
      rect(c, d.x + 13, d.y + 18, 9, 10, "#E9DDC3");
      rect(c, d.x + 14, d.y + 18, 7, 3, "#74523E");
      rect(c, d.x + 21, d.y + 20, 3, 5, "#E9DDC3");
    }
    function build() {
      rect(b, 0, 0, W.width, W.height, "#294354");
      for (let y = 0; y < W.height; y += 32)
        for (let x = 0; x < W.width; x += 32) {
          rect(b, x + 1, y + 1, 30, 30, (x + y) % 64 ? "#304E5D" : "#345462");
        }
      rect(b, 8, 264, 944, 144, "#57707A");
      rect(b, 8, 268, 944, 2, "#A4B3A4");
      rect(b, 8, 402, 944, 2, "#A4B3A4");
      for (let x = 32; x < 944; x += 32) {
        rect(b, x, 272, 1, 128, "#8FA8A22A");
        rect(b, x + 8, 334, 15, 2, "#BDCCA553");
      }
      rect(b, 40, 285, 65, 105, "#294958");
      rect(b, 45, 290, 55, 95, "#34596A");
      text(b, "NET", 72, 327, 13, "#E4C38E", "center");
      text(b, "FELIZ", 72, 345, 11, "#C8D9CF", "center");
      rect(b, 53, 355, 38, 2, "#C6B17A");
      text(b, "REGISTROS  ←", 230, 313, 9, "#D5DFD2", "center");
      text(b, "CORREDOR CENTRAL", 550, 313, 9, "#D5DFD2", "center");
      text(b, "DECISÕES  →", 838, 374, 9, "#D5DFD2", "center");
      for (const r of W.rooms) {
        const [floor, accent] = palettes[r.index];
        rect(b, r.x + 4, r.y + 7, r.w, r.h, "#0C213954");
        rect(b, r.x, r.y, r.w, r.h, floor);
        for (let y = r.y + 10; y < r.y + r.h - 10; y += 16) {
          rect(b, r.x + 10, y, r.w - 20, 1, "#776D5830");
          for (
            let x = r.x + 12 + ((y - r.y) % 32 < 16 ? 0 : 32);
            x < r.x + r.w - 10;
            x += 64
          )
            rect(b, x, y, 1, 15, "#776D5820");
        }
        rect(b, r.x + 10, r.y + 10, r.w - 20, 17, "#223A4729");
        rect(b, r.x + 43, r.y + 125, 136, 74, accent + "38");
        rect(b, r.x + 48, r.y + 130, 126, 2, accent + "45");
        rect(b, r.x + 48, r.y + 192, 126, 2, accent + "45");
        const segments = W.walls.slice(r.index * 5, r.index * 5 + 5);
        for (const o of segments) {
          rect(b, o.x, o.y, o.w, o.h, accent);
          rect(b, o.x, o.y, o.w, 2, "#DCE5D880");
        }
        const dy = r.upper ? r.y + r.h - 10 : r.y;
        rect(b, r.door - 36, dy + 2, 72, 6, "#D6BC8B");
        rect(b, r.door - 32, dy + 4, 64, 2, "#F0D9A4");
        rect(b, r.x + 53, r.y + 17, 184, 19, "#F5EEDC");
        text(
          b,
          String(r.index + 1).padStart(2, "0") +
            "  " +
            C.stages[r.index].role.toUpperCase(),
          r.x + 145,
          r.y + 30,
          9,
          "#29485B",
          "center",
        );
        cabinet(b, r.x + 18, r.y + 43);
        plant(b, r.x + r.w - 46, r.y + 42);
        rect(b, r.x + 70, r.y + 45, 76, 23, "#507788");
        rect(b, r.x + 73, r.y + 47, 70, 17, "#B3D7D6");
        rect(b, r.x + 105, r.y + 47, 2, 17, "#648C99");
        rect(b, r.x + 67, r.y + 66, 82, 4, "#EAE0C7");
        poly(
          b,
          [
            [r.x + 73, r.y + 70],
            [r.x + 143, r.y + 70],
            [r.x + 185, r.y + 108],
            [r.x + 107, r.y + 108],
          ],
          "#FFF6D326",
        );
        rect(
          b,
          r.desk.x + 4,
          r.desk.y + 8,
          r.desk.w,
          r.desk.h + 5,
          "#22344430",
        );
        rect(b, r.x + 91, r.y + 135, 33, 24, "#466371");
        rect(b, r.x + 94, r.y + 133, 27, 9, "#65818A");
        rect(b, r.x + 106, r.y + 156, 4, 13, "#365363");
        rect(b, r.x + 97, r.y + 168, 23, 2, "#365363");
        rect(b, r.x + 22, r.y + r.h - 46, 42, 24, accent);
        rect(b, r.x + 23, r.y + r.h - 49, 40, 8, accent);
        rect(b, r.x + 25, r.y + r.h - 22, 4, 5, "#466053");
        rect(b, r.x + 56, r.y + r.h - 22, 4, 5, "#466053");
        if (r.index === 0) {
          rect(b, r.x + 177, r.y + 50, 48, 27, "#A4825E");
          rect(b, r.x + 181, r.y + 54, 15, 15, "#F5EEDC");
          rect(b, r.x + 202, r.y + 55, 19, 10, "#DAE1C3");
        }
        if (r.index === 1) {
          rect(b, r.x + 185, r.y + 47, 33, 30, "#F5EEDC");
          for (let k = 0; k < 3; k++) {
            rect(b, r.x + 190 + k * 8, r.y + 54 + k * 4, 7, 5, accent);
          }
        }
        if (r.index === 2) {
          for (let k = 0; k < 5; k++)
            rect(b, r.x + 184 + k * 8, r.y + 74 - k * 4, 5, 6 + k * 4, accent);
        }
        if (r.index === 3) {
          rect(b, r.x + 179, r.y + 46, 50, 31, "#A78558");
          rect(b, r.x + 183, r.y + 50, 42, 23, "#E6E8CD");
          text(b, "NETFELIZ", r.x + 204, r.y + 64, 7, accent, "center");
        }
        if (r.index === 4) {
          rect(b, r.x + 176, r.y + 44, 56, 38, "#9D7B5B");
          for (let row = 0; row < 2; row++)
            for (let k = 0; k < 7; k++)
              rect(
                b,
                r.x + 179 + k * 7,
                r.y + 47 + row * 17,
                5,
                13,
                ["#5B7B8E", "#A9795F", "#7B9879"][k % 3],
              );
        }
        if (r.index === 5) {
          rect(b, r.x + 190, r.y + 48, 27, 15, "#D9B768");
          rect(b, r.x + 201, r.y + 62, 5, 13, "#BB9654");
          rect(b, r.x + 192, r.y + 75, 23, 4, "#526970");
        }
      }
    }
    build();
    function resize() {
      const width = canvas.parentElement.clientWidth,
        scale = width >= 700 ? 2 : 1;
      canvas.width = Math.min(600, Math.max(300, Math.floor(width / scale)));
      canvas.height = width < 600 ? 300 : 320;
      canvas.style.width = Math.min(width, canvas.width * scale) + "px";
      canvas.style.height =
        canvas.height * Math.min(width / canvas.width, scale) + "px";
      ctx.imageSmoothingEnabled = false;
    }
    const nav = root.LB.Navigation.create(canvas, {
      toWorld: (x, y) => {
        const r = canvas.getBoundingClientRect();
        return {
          x: ((x - r.left) / r.width) * canvas.width + camera.x,
          y: ((y - r.top) / r.height) * canvas.height + camera.y,
        };
      },
      canMove: () => active && !isPaused(),
      onInteract,
      onNotice,
    });
    nav.bindTouch();
    function avatar(actor, x, y, direction = "down", state = "idle", time = 0) {
      const ai = A.actors.indexOf(actor),
        anim = A.animations[state],
        frame =
          anim.start + (Math.floor((time / 1000) * anim.fps) % anim.count),
        di = A.directions.indexOf(direction);
      if (sprite.complete && sprite.naturalWidth)
        ctx.drawImage(
          sprite,
          frame * 34 + 1,
          (Math.max(0, ai) * 4 + di) * 50 + 1,
          32,
          48,
          Math.round(x - 16),
          Math.round(y - 44),
          32,
          48,
        );
    }
    function draw(time) {
      const state = getState(),
        p = nav.player;
      camera.x = Math.max(
        0,
        Math.min(W.width - canvas.width, Math.round(p.x - canvas.width / 2)),
      );
      camera.y = Math.max(
        0,
        Math.min(
          W.height - canvas.height,
          Math.round(p.y - canvas.height * 0.58),
        ),
      );
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, -camera.x, -camera.y);
      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      const target = G.target(state),
        items = W.rooms.map((r) => ({
          y: r.desk.y + r.desk.h,
          draw: () => desk(ctx, r),
        }));
      for (const r of W.rooms) {
        const actor = G.actorFor(state, r.index);
        items.push({
          y: r.npcY,
          draw: () => {
            ctx.fillStyle = "#18344235";
            ctx.beginPath();
            ctx.ellipse(r.npcX, r.npcY + 1, 15, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            const effect =
              animation &&
              animation.target === r.index &&
              time - animation.start < 500;
            avatar(
              actor,
              r.npcX,
              r.npcY,
              "down",
              effect
                ? "stamp"
                : state.conversation?.target === r.index
                  ? "talk"
                  : "idle",
              time,
            );
            rect(ctx, r.npcX - 29, r.npcY + 9, 58, 14, "#F5EEDCE8");
            text(
              ctx,
              C.actors[actor].name,
              r.npcX,
              r.npcY + 19,
              8,
              "#29485B",
              "center",
            );
            if (D.activeApproval(state, C.roles[r.index]))
              text(ctx, "✓", r.npcX + 21, r.npcY - 27, 12, "#2D6958");
            if (r.index === target && state.status === "playing") {
              const bob = reduced.matches
                ? 0
                : Math.round(Math.sin(time / 300) * 2);
              rect(
                ctx,
                r.npcX - 8,
                r.npcY - 61 + bob,
                16,
                14,
                state.pending ? "#BB7648" : "#E3B56B",
              );
              text(
                ctx,
                state.pending ? "!" : "↓",
                r.npcX,
                r.npcY - 50 + bob,
                11,
                "#233D4C",
                "center",
              );
            }
          },
        });
      }
      items.push({
        y: p.y,
        draw: () => {
          ctx.fillStyle = "#132C4438";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 1, 15, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          avatar(
            "player",
            p.x,
            p.y,
            p.direction,
            p.moving ? "walk" : "idle",
            time,
          );
          rect(ctx, p.x - 17, p.y + 9, 34, 13, "#213D50");
          text(ctx, "VOCÊ", p.x, p.y + 18, 7, "#F3D49C", "center");
        },
      });
      items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());
      if (nav.destination?.length) {
        const d = nav.destination.at(-1);
        ctx.strokeStyle = "#E9CB87";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 8, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      const lamps = W.rooms
        .map((r) => ({ x: r.x + 200, y: r.y + 95, radius: 135 }))
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        );
      light.draw(
        ctx,
        camera,
        [{ x: p.x, y: p.y - 8, radius: 130 }, ...lamps.slice(0, 3)],
        settings,
      );
    }
    function frame(time) {
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
      last = time;
      if (active && !document.hidden) {
        nav.update(dt);
        onTick(dt);
        const n = nav.nearest();
        if (n !== nearby) {
          nearby = n;
          const el = document.getElementById("nearby");
          el.hidden = n < 0;
          el.textContent = n >= 0 ? "E / Enter · " + C.stages[n].person : "";
        }
        if (!settings.economy || time - lastDraw >= 32) {
          draw(reduced.matches ? 0 : time);
          lastDraw = time;
          frameCount++;
        }
        if (time - sampleStart > 1000) {
          fps = Math.round((frameCount * 1000) / (time - sampleStart));
          frameCount = 0;
          sampleStart = time;
        }
      }
      root.requestAnimationFrame(frame);
    }
    root.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      last = 0;
    });
    resize();
    root.requestAnimationFrame(frame);
    return {
      nav,
      settings,
      get fps() {
        return fps;
      },
      start: () => {
        active = true;
        nav.reset();
        resize();
      },
      stop: () => {
        active = false;
        nav.clear();
      },
      visit: (i) => {
        nav.visit(i);
      },
      resize,
      stamp: (target) => {
        animation = { target, start: performance.now() };
      },
      draw,
    };
  }
  (root.LB ||= {}).Scene = { create };
})(globalThis);
