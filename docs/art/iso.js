// Tiny isometric voxel renderer for the README visuals.
// px = (x - y) * s * .866, py = (x + y) * s * .5 - z * s
window.ISO = (function () {
  function model() {
    const v = new Map();
    const put = (x, y, z, c) => v.set(`${x},${y},${z}`, { x, y, z, c });
    // stone floor 8x6
    for (let x = 0; x < 8; x++) for (let y = 0; y < 6; y++) put(x, y, 0, 'stone');
    // walls 7x5 footprint at x1..6 y0..4? keep inset by 1 on x
    for (let z = 1; z <= 3; z++) {
      for (let x = 1; x <= 6; x++) for (let y = 1; y <= 4; y++) {
        const edge = x === 1 || x === 6 || y === 1 || y === 4;
        if (!edge) continue;
        let c = 'brick';
        if (y === 4 && x === 3 && z <= 2) continue; // door
        if (y === 4 && x === 5 && z === 2) c = 'glass';
        if (x === 6 && (y === 2 || y === 3) && z === 2) c = 'glass';
        put(x, y, z, c);
      }
    }
    // stepped roof
    for (let x = 1; x <= 6; x++) for (let y = 1; y <= 4; y++) put(x, y, 4, 'roof');
    for (let x = 2; x <= 5; x++) for (let y = 2; y <= 3; y++) put(x, y, 5, 'roof');
    put(5, 2, 6, 'brick'); put(5, 2, 7, 'brick'); // chimney
    // tree
    put(7, 0, 1, 'trunk'); put(7, 0, 2, 'trunk');
    for (let x = 6; x <= 8; x++) for (let y = -1; y <= 1; y++) { put(x, y, 3, 'leaf'); if (Math.abs(x - 7) + Math.abs(y) <= 1) put(x, y, 4, 'leaf'); }
    put(7, 0, 5, 'leaf');
    return v;
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // draw: mode parts | mesh | xray
  function draw(ctx, opts) {
    const v = opts.voxels || model();
    const s = opts.s, ox = opts.ox, oy = opts.oy, gap = opts.explode || 0;
    const P = (x, y, z) => [ox + (x - y) * s * 0.866, oy + (x + y) * s * 0.5 - z * s];
    const has = (x, y, z) => v.has(`${x},${y},${z}`);
    const list = [...v.values()].sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z) || a.z - b.z);
    const pal = opts.palette;
    const poly = (pts, fill, stroke, lw) => {
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.lineJoin = 'round'; ctx.stroke(); }
    };
    for (const b of list) {
      const ex = opts.explodeXY ?? gap, ez = opts.explodeZ ?? gap;
      const bx = b.x * (1 + ex), by = b.y * (1 + ex), bz = b.z * (1 + ez);
      const col = pal[b.c];
      const c = (x, y, z) => P(bx + x, by + y, bz + z);
      const top = [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)];
      const right = [c(1, 0, 1), c(1, 1, 1), c(1, 1, 0), c(1, 0, 0)]; // +x
      const left = [c(0, 1, 1), c(1, 1, 1), c(1, 1, 0), c(0, 1, 0)]; // +y
      if (opts.mode === 'parts') {
        const ol = opts.outline;
        poly(left, shade(col, -0.32), ol, opts.lw);
        poly(right, shade(col, -0.16), ol, opts.lw);
        poly(top, shade(col, 0.06), ol, opts.lw);
        if (opts.studs) stud(ctx, c(0.5, 0.5, 1), s, col);
      } else if (opts.mode === 'mesh') {
        const showTop = !has(b.x, b.y, b.z + 1), showR = !has(b.x + 1, b.y, b.z), showL = !has(b.x, b.y + 1, b.z);
        // fill with same-colour stroke to close seams: one surface, no part edges
        if (!opts.skipFill) {
          if (showL) poly(left, shade(col, -0.32), shade(col, -0.32), 1.2);
          if (showR) poly(right, shade(col, -0.16), shade(col, -0.16), 1.2);
          if (showTop) poly(top, shade(col, 0.06), shade(col, 0.06), 1.2);
          if (showTop && opts.studs) stud(ctx, c(0.5, 0.5, 1), s, col, true);
        }
        // silhouette edges: where neighbour missing or colour changes
        const w = opts.wire;
        if (w) {
          ctx.strokeStyle = w; ctx.lineWidth = opts.wlw || 1.4; ctx.beginPath();
          const nb = (dx, dy, dz) => v.get(`${b.x + dx},${b.y + dy},${b.z + dz}`);
          const diff = (n) => !n || n.c !== b.c;
          const seg = (a, z) => { ctx.moveTo(...a); ctx.lineTo(...z); };
          if (showTop) {
            if (diff(nb(0, -1, 0)) || nb(0, -1, 1)) seg(top[0], top[1]);
            if (diff(nb(-1, 0, 0)) || nb(-1, 0, 1)) seg(top[3], top[0]);
            if (diff(nb(1, 0, 0)) || nb(1, 0, 1)) seg(top[1], top[2]);
            if (diff(nb(0, 1, 0)) || nb(0, 1, 1)) seg(top[2], top[3]);
          }
          if (showR) {
            if (diff(nb(0, 0, -1)) || nb(1, 0, -1)) seg(right[2], right[3]);
            if (diff(nb(0, -1, 0)) || nb(1, -1, 0)) seg(right[0], right[3]);
            if (diff(nb(0, 1, 0)) || nb(1, 1, 0)) seg(right[1], right[2]);
          }
          if (showL) {
            if (diff(nb(0, 0, -1)) || nb(0, 1, -1)) seg(left[2], left[3]);
            if (diff(nb(-1, 0, 0)) || nb(-1, 1, 0)) seg(left[0], left[3]);
            if (diff(nb(1, 0, 0)) || nb(1, 1, 0)) seg(left[1], left[2]);
          }
          ctx.stroke();
        }
      } else if (opts.mode === 'xray') {
        // every face drawn as line; hidden (internal) faces filled with accent
        const hidTop = has(b.x, b.y, b.z + 1), hidR = has(b.x + 1, b.y, b.z), hidL = has(b.x, b.y + 1, b.z);
        const hf = opts.hidden, ink = opts.ink;
        if (hidL) poly(left, shade(hf, -0.25), ink, opts.lw);
        if (hidR) poly(right, shade(hf, -0.1), ink, opts.lw);
        if (hidTop) poly(top, hf, ink, opts.lw);
      }
    }
  }

  function stud(ctx, [cx, cy], s, col, baked) {
    const rx = s * 0.26, ry = rx * 0.58, h = s * 0.14;
    ctx.save();
    if (baked) { // texture only: a soft ring, no geometry
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = shade(col, -0.18); ctx.lineWidth = Math.max(1, s * 0.035); ctx.stroke();
      ctx.restore(); return;
    }
    ctx.fillStyle = shade(col, -0.25);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); ctx.lineTo(cx - rx, cy - h); ctx.ellipse(cx, cy - h, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, 0.18);
    ctx.beginPath(); ctx.ellipse(cx, cy - h, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function stats(v) {
    v = v || model();
    let faces = 0;
    const has = (x, y, z) => v.has(`${x},${y},${z}`);
    for (const b of v.values()) for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) if (!has(b.x + dx, b.y + dy, b.z + dz)) faces++;
    return { parts: v.size, faces, allFaces: v.size * 6 };
  }

  // greedy-merge exposed unit faces per (normal, plane, colour) into rectangles
  function quads(v) {
    v = v || model();
    const has = (x, y, z) => v.has(`${x},${y},${z}`);
    const groups = new Map();
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (const b of v.values()) dirs.forEach((d, i) => {
      if (has(b.x + d[0], b.y + d[1], b.z + d[2])) return;
      const axis = d[0] ? 0 : d[1] ? 1 : 2, pos = [b.x, b.y, b.z];
      const [u, w] = [0, 1, 2].filter((a) => a !== axis);
      const key = `${i}|${pos[axis]}|${b.c}`;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(`${pos[u]},${pos[w]}`);
    });
    let n = 0;
    for (const cells of groups.values()) {
      const left = new Set(cells);
      const pts = [...cells].map((k) => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      for (const [u0, w0] of pts) {
        if (!left.has(`${u0},${w0}`)) continue;
        let du = 1; while (left.has(`${u0 + du},${w0}`)) du++;
        let dw = 1;
        outer: for (;;) { for (let k = 0; k < du; k++) if (!left.has(`${u0 + k},${w0 + dw}`)) break outer; dw++; }
        for (let a = 0; a < du; a++) for (let c = 0; c < dw; c++) left.delete(`${u0 + a},${w0 + c}`);
        n++;
      }
    }
    return n;
  }

  return { model, draw, stats, shade, quads };
})();
