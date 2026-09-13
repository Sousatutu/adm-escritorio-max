(function (root) {
  "use strict";
  function intersect(x, y, angle, segment) {
    const dx = Math.cos(angle),
      dy = Math.sin(angle),
      [ax, ay, bx, by] = segment,
      sx = bx - ax,
      sy = by - ay,
      den = dx * sy - dy * sx;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((ax - x) * sy - (ay - y) * sx) / den,
      u = ((ax - x) * dy - (ay - y) * dx) / den;
    return t >= 0 && u >= 0 && u <= 1
      ? { x: x + dx * t, y: y + dy * t, distance: t }
      : null;
  }
  function visibility(x, y, segments) {
    const rays = [];
    for (const s of segments)
      for (const [vx, vy] of [
        [s[0], s[1]],
        [s[2], s[3]],
      ]) {
        const a = Math.atan2(vy - y, vx - x);
        for (const delta of [-0.0001, 0, 0.0001]) {
          const angle = a + delta;
          let closest = null;
          for (const edge of segments) {
            const hit = intersect(x, y, angle, edge);
            if (hit && (!closest || hit.distance < closest.distance))
              closest = hit;
          }
          if (closest) rays.push({ ...closest, angle });
        }
      }
    return rays.sort((a, b) => a.angle - b.angle);
  }
  function create(width, height, world) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d"),
      cache = new Map();
    function draw(
      target,
      camera,
      lights,
      { night = false, economy = false } = {},
    ) {
      if (
        canvas.width !== target.canvas.width ||
        canvas.height !== target.canvas.height
      ) {
        canvas.width = target.canvas.width;
        canvas.height = target.canvas.height;
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = night ? "rgba(10,23,42,.52)" : "rgba(13,29,44,.20)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!economy) {
        ctx.globalCompositeOperation = "destination-out";
        for (const light of lights.slice(0, 4)) {
          const key = Math.round(light.x / 4) + "," + Math.round(light.y / 4);
          let points = cache.get(key);
          if (!points) {
            points = visibility(light.x, light.y, world.segments);
            cache.set(key, points);
            if (cache.size > 80) cache.delete(cache.keys().next().value);
          }
          ctx.save();
          ctx.beginPath();
          points.forEach((p, i) =>
            i
              ? ctx.lineTo(p.x - camera.x, p.y - camera.y)
              : ctx.moveTo(p.x - camera.x, p.y - camera.y),
          );
          ctx.closePath();
          ctx.clip();
          const x = light.x - camera.x,
            y = light.y - camera.y,
            g = ctx.createRadialGradient(x, y, 4, x, y, light.radius);
          g.addColorStop(0, "rgba(255,255,255,.96)");
          g.addColorStop(0.6, "rgba(255,255,255,.5)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(
            x - light.radius,
            y - light.radius,
            light.radius * 2,
            light.radius * 2,
          );
          ctx.restore();
        }
      }
      ctx.globalCompositeOperation = "source-over";
      target.drawImage(canvas, 0, 0);
    }
    return { draw, cache };
  }
  const api = { intersect, visibility, create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LB ||= {}).Lighting = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
