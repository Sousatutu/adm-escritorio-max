(function (root) {
  "use strict";
  const W = root.LB.World;
  function create(canvas, { toWorld, canMove, onInteract, onNotice }) {
    const player = { x: 128, y: 336, direction: "down", moving: false },
      keys = new Set();
    let destination = null;
    const movement = [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowleft",
      "arrowdown",
      "arrowright",
    ];
    function nearest() {
      let best = 60,
        index = -1;
      W.rooms.forEach((r, i) => {
        const dist = Math.hypot(r.npcX - player.x, r.npcY - player.y);
        if (dist < best) {
          best = dist;
          index = i;
        }
      });
      return index;
    }
    function clear() {
      keys.clear();
      destination = null;
    }
    root.addEventListener("keydown", (e) => {
      if (!canMove() || document.activeElement !== canvas) return;
      const key = e.key.toLowerCase();
      if (movement.includes(key)) {
        e.preventDefault();
        keys.add(key);
        destination = null;
      }
      if (["e", "enter"].includes(key) && !e.repeat) {
        e.preventDefault();
        const n = nearest();
        if (n >= 0) onInteract(n);
        else onNotice("Aproxime-se de um colega ou use Visitar setor.");
      }
    });
    root.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
    root.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    canvas.addEventListener("pointerdown", (e) => {
      if (!canMove()) return;
      canvas.focus({ preventScroll: true });
      const point = toWorld(e.clientX, e.clientY),
        n = nearest();
      if (
        n >= 0 &&
        Math.hypot(
          point.x - W.rooms[n].npcX,
          point.y - (W.rooms[n].npcY - 20),
        ) < 24
      )
        return onInteract(n);
      destination = W.path(player, point);
      if (!destination)
        onNotice(
          "Escolha um ponto livre. As portas ligam as salas ao corredor.",
        );
    });
    function bindTouch() {
      document.querySelectorAll("[data-dir]").forEach((button) => {
        const key = { up: "w", left: "a", down: "s", right: "d" }[
          button.dataset.dir
        ];
        button.addEventListener("pointerdown", (e) => {
          if (!canMove()) return;
          e.preventDefault();
          button.setPointerCapture(e.pointerId);
          keys.add(key);
          destination = null;
        });
        for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
          button.addEventListener(name, () => keys.delete(key));
      });
    }
    function update(dt) {
      player.moving = false;
      if (!canMove()) {
        clear();
        return;
      }
      let dx =
          (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
          (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
        dy =
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
          (keys.has("w") || keys.has("arrowup") ? 1 : 0),
        distance = Infinity;
      if (!dx && !dy && destination?.length) {
        const end = destination[0];
        dx = end.x - player.x;
        dy = end.y - player.y;
        distance = Math.hypot(dx, dy);
        if (distance < 2) {
          destination.shift();
          return;
        }
      }
      const len = Math.hypot(dx, dy);
      if (!len) return;
      player.direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
      const step = Math.min(112 * dt, distance),
        old = { ...player };
      dx = (dx / len) * step;
      dy = (dy / len) * step;
      if (W.canStand(player.x + dx, player.y)) player.x += dx;
      if (W.canStand(player.x, player.y + dy)) player.y += dy;
      player.moving = player.x !== old.x || player.y !== old.y;
      if (!player.moving) destination = null;
    }
    return {
      player,
      update,
      clear,
      nearest,
      bindTouch,
      reset: () => {
        clear();
        player.x = 128;
        player.y = 336;
        player.direction = "down";
      },
      visit: (index) => {
        clear();
        const r = W.rooms[index];
        player.x = r.npcX - 44;
        player.y = r.npcY + 30;
        player.direction = "right";
      },
      get destination() {
        return destination;
      },
    };
  }
  (root.LB ||= {}).Navigation = { create };
})(globalThis);
