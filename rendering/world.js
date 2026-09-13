(function (root) {
  "use strict";
  const rooms = Array.from({ length: 6 }, (_, i) => ({
    index: i,
    x: 16 + (i % 3) * 320,
    y: i < 3 ? 24 : 424,
    w: 288,
    h: 224,
    upper: i < 3,
    door: 160 + (i % 3) * 320,
    npcX: 224 + (i % 3) * 320,
    npcY: i < 3 ? 190 : 574,
  }));
  const walls = [],
    furniture = [],
    occluders = [];
  function box(x, y, w, h) {
    return { x, y, w, h };
  }
  for (const r of rooms) {
    const opening = r.upper ? r.y + r.h - 10 : r.y,
      closed = r.upper ? r.y : r.y + r.h - 10;
    walls.push(
      box(r.x, r.y, 10, r.h),
      box(r.x + r.w - 10, r.y, 10, r.h),
      box(r.x, closed, r.w, 10),
      box(r.x, opening, r.door - 36 - r.x, 10),
      box(r.door + 36, opening, r.x + r.w - r.door - 36, 10),
    );
    r.desk = box(r.x + 52, r.y + 80, 112, 38);
    furniture.push(
      r.desk,
      box(r.x + 18, r.y + 43, 27, 38),
      box(r.x + r.w - 47, r.y + 43, 24, 22),
    );
  }
  const segments = [];
  for (const o of walls) {
    segments.push(
      [o.x, o.y, o.x + o.w, o.y],
      [o.x + o.w, o.y, o.x + o.w, o.y + o.h],
      [o.x + o.w, o.y + o.h, o.x, o.y + o.h],
      [o.x, o.y + o.h, o.x, o.y],
    );
  }
  segments.push(
    [0, 0, 960, 0],
    [960, 0, 960, 672],
    [960, 672, 0, 672],
    [0, 672, 0, 0],
  );
  function canStand(x, y, radius = 7) {
    return (
      x >= radius &&
      y >= radius &&
      x <= 960 - radius &&
      y <= 672 - radius &&
      ![...walls, ...furniture].some(
        (o) =>
          x + radius > o.x &&
          x - radius < o.x + o.w &&
          y + radius > o.y &&
          y - radius < o.y + o.h,
      )
    );
  }
  function path(from, to) {
    const cell = 16,
      cols = 60,
      rows = 42;
    if (!canStand(to.x, to.y)) return null;
    const sx = Math.floor(from.x / cell),
      sy = Math.floor(from.y / cell),
      gx = Math.floor(to.x / cell),
      gy = Math.floor(to.y / cell),
      start = sy * cols + sx,
      goal = gy * cols + gx;
    if (!canStand(gx * cell + 8, gy * cell + 8)) return null;
    const q = [start],
      parents = new Int32Array(cols * rows).fill(-1);
    parents[start] = start;
    for (let h = 0; h < q.length; h++) {
      const node = q[h];
      if (node === goal) break;
      const x = node % cols,
        y = Math.floor(node / cols);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          id = ny * cols + nx;
        if (
          nx < 0 ||
          ny < 0 ||
          nx >= cols ||
          ny >= rows ||
          parents[id] !== -1 ||
          !canStand(nx * cell + 8, ny * cell + 8)
        )
          continue;
        parents[id] = node;
        q.push(id);
      }
    }
    if (parents[goal] === -1) return null;
    const result = [to];
    for (let id = goal; id !== start; id = parents[id])
      result.push({
        x: (id % cols) * cell + 8,
        y: Math.floor(id / cols) * cell + 8,
      });
    return result.reverse();
  }
  const api = {
    rooms,
    walls,
    furniture,
    segments,
    width: 960,
    height: 672,
    canStand,
    path,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LB ||= {}).World = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
