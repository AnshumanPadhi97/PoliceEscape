// ---------- infinite city: a grid of roads with a city block in every cell ----------
// Cell (i,j) has its corner (intersection) at (i*CELL, j*CELL). Roads run along x = i*CELL and y = j*CELL.
// The block of the cell sits between the roads: [i*CELL+ROAD/2, (i+1)*CELL-ROAD/2].
let worldSeed = 1, worldT = 0, CELL = 64, ROAD = 16;
let cells = new Map(), destroyed = new Set();
let pedsL = [], treesL = [], parkedL = [], barrelsL = [], oilL = [], conesL = [], spikesL = [], coinsL = [];

function cellKind(i, j) {
  const v = (hash2(i, j, worldSeed) & 1023) / 1024;
  return v < 0.15 ? 'bld' : v < 0.58 ? 'park' : 'lot';
}
const blockRect = (i, j) => ({ x0: i * CELL + ROAD / 2, y0: j * CELL + ROAD / 2, x1: (i + 1) * CELL - ROAD / 2, y1: (j + 1) * CELL - ROAD / 2 });

function genCell(i, j) {
  const R = mulberry(hash2(i, j, worldSeed + 7)), rr = (a, b) => a + R() * (b - a);
  const ox = i * CELL, oy = j * CELL, kind = cellKind(i, j), far = Math.hypot(i, j);
  const c = { i, j, kind, peds: [], subs: [], trees: [], cars: [], barrels: [], oil: [], cones: [], spikes: [], coins: [] };
  const B = blockRect(i, j), bw = B.x1 - B.x0, bh = B.y1 - B.y0, gap = 2 * U;
  if (kind === 'bld') {
    const layout = R(), pal = ['#8a8f9c', '#a1887f', '#7e8fa6', '#9e9a8c', '#8c7f9a', '#7f9a8c'];
    const mk = (x, y, w, h) => c.subs.push({ x, y, w, h, col: pick(pal), hgt: rr(0.4, 1), ac: R() < 0.6 });
    if (layout < 0.3) mk(B.x0 + gap, B.y0 + gap, bw - 2 * gap, bh - 2 * gap);
    else if (layout < 0.6) { const h = (bh - 3 * gap) / 2; mk(B.x0 + gap, B.y0 + gap, bw - 2 * gap, h); mk(B.x0 + gap, B.y0 + 2 * gap + h, bw - 2 * gap, h); }
    else { const w = (bw - 3 * gap) / 2, h = (bh - 3 * gap) / 2; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) mk(B.x0 + gap + a * (w + gap), B.y0 + gap + b * (h + gap), w, h); }
  } else if (kind === 'park') {
    const n = 4 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) c.trees.push({ x: rr(B.x0 + 5 * U, B.x1 - 5 * U), y: rr(B.y0 + 5 * U, B.y1 - 5 * U), r: rr(2.2, 3.2) * U, ph: R() * TAU });
  } else {
    const hues = [0, 25, 55, 120, 200, 260, 320];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) if (R() < 0.6) {
      const x = B.x0 + bw * (0.2 + a * 0.3), y = B.y0 + bh * (0.3 + b * 0.4);
      c.cars.push({ x, y, a: R() < 0.5 ? Math.PI / 2 : -Math.PI / 2, r: 1.8 * U, hue: pick(hues) });
    }
  }
  // pedestrians strolling around the sidewalk of the block
  const nP = (kind === 'park' ? 3 : 1) + Math.floor(R() * 3), ins = 0.6 * U;
  for (let k = 0; k < nP; k++) {
    const p = { x0: B.x0 + ins, y0: B.y0 + ins, w: bw - 2 * ins, h: bh - 2 * ins, s: R() * 2 * (bw + bh), dir: R() < 0.5 ? 1 : -1, sp: rr(2.2, 3.6) * U, ...pedLook(R), ph: R() * TAU, x: 0, y: 0 };
    pedXY(p, p.s); p.x = pedXY.x; p.y = pedXY.y; c.peds.push(p);
  }
  // groups of people: some stroll together, some stand around chatting in a circle
  if (R() < (kind === 'park' ? 0.85 : 0.5)) {
    const gs = R() * 2 * (bw + bh), gdir = R() < 0.5 ? 1 : -1, gsp = rr(2.2, 3.2) * U, n = 3 + Math.floor(R() * 3), standing = R() < 0.4;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, p = { x0: B.x0 + ins, y0: B.y0 + ins, w: bw - 2 * ins, h: bh - 2 * ins, s: standing ? gs : gs - gdir * k * 1.8 * U, dir: gdir, sp: standing ? 0 : gsp,
        ox: standing ? Math.cos(a) * 1.8 * U : rr(-0.5, 0.5) * U, oy: standing ? Math.sin(a) * 1.8 * U : rr(-0.5, 0.5) * U, ang: standing ? a + Math.PI : 0,
        ...pedLook(R), ph: R() * TAU, x: 0, y: 0 };
      pedXY(p, p.s); p.x = pedXY.x + p.ox; p.y = pedXY.y + p.oy; c.peds.push(p);
    }
  }
  const away = (x, y, m) => Math.hypot(x, y) > m * U;
  // a random spot on one of the two roads that border this cell
  const road = () => {
    if (R() < 0.5) return { x: ox + rr(-ROAD / 2 + 2.5 * U, ROAD / 2 - 2.5 * U), y: oy + R() * CELL, v: true };
    return { x: ox + R() * CELL, y: oy + rr(-ROAD / 2 + 2.5 * U, ROAD / 2 - 2.5 * U), v: false };
  };
  // explosive barrels
  const nB = 0; // barrels removed
  for (let k = 0; k < nB; k++) { const p = road(), id = i + ',' + j + ',b' + k; if (away(p.x, p.y, 70) && !destroyed.has(id)) c.barrels.push({ x: p.x, y: p.y, id, ph: R() * TAU, dead: false }); }
  // oil slicks (you lose grip)
  if (R() < 0.3) { const p = road(); if (away(p.x, p.y, 50)) c.oil.push({ x: p.x, y: p.y, r: rr(3.5, 5.5) * U, seed: R() * 10 }); }
  // traffic cones and debris (slow you down)
  if (R() < 0.4) {
    const p = road(); if (away(p.x, p.y, 50)) for (let k = 0, n = 5 + Math.floor(R() * 5); k < n; k++) { const a = R() * TAU, d = R() * 5 * U; c.cones.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, rot: R() * TAU, ph: R() }); }
  }
  // spike strips across part of the road
  if (false) { // spike strips removed
    const p = road(); if (away(p.x, p.y, 70)) c.spikes.push(p.v ? { x: p.x, y: p.y, w: 9 * U, h: 1.5 * U } : { x: p.x, y: p.y, w: 1.5 * U, h: 9 * U });
  }
  // cash trail
  if (R() < 0.55) {
    const p = road(), n = 5 + Math.floor(R() * 4), dir = p.v ? (R() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (R() < 0.5 ? 0 : Math.PI);
    for (let k = 0; k < n; k++) {
      const off = Math.sin(k * 0.8) * 2 * U, x = p.x + Math.cos(dir) * k * 3.2 * U - Math.sin(dir) * off, y = p.y + Math.sin(dir) * k * 3.2 * U + Math.cos(dir) * off, id = i + ',' + j + ',c' + k;
      if (away(x, y, 20) && !destroyed.has(id)) c.coins.push({ x, y, id, dead: false });
    }
  }
  return c;
}

function loadCells() {
  const i0 = Math.floor(cam.x / CELL) - 1, i1 = Math.floor((cam.x + W) / CELL) + 1, j0 = Math.floor(cam.y / CELL) - 1, j1 = Math.floor((cam.y + H) / CELL) + 1;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = i + ',' + j; if (!cells.has(k)) cells.set(k, genCell(i, j)); }
  for (const [k, c] of cells) if (c.i < i0 - 3 || c.i > i1 + 3 || c.j < j0 - 3 || c.j > j1 + 3) cells.delete(k);
  pedsL = []; treesL = []; parkedL = []; barrelsL = []; oilL = []; conesL = []; spikesL = []; coinsL = [];
  for (const c of cells.values()) {
    for (const o of c.peds) pedsL.push(o);
    for (const o of c.trees) treesL.push(o);
    for (const o of c.cars) parkedL.push(o);
    for (const o of c.barrels) if (!o.dead) barrelsL.push(o);
    for (const o of c.oil) oilL.push(o);
    for (const o of c.cones) conesL.push(o);
    for (const o of c.spikes) spikesL.push(o);
    for (const o of c.coins) if (!o.dead) coinsL.push(o);
  }
}
function onScreen(x, y, m) { return x > cam.x - m && x < cam.x + W + m && y > cam.y - m && y < cam.y + H + m; }

// ---------- collision helpers ----------
function circleRect(x, y, r, x0, y0, x1, y1) {
  const cx = clamp(x, x0, x1), cy = clamp(y, y0, y1);
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}
function hitBuilding(x, y, r) {
  for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((y - r) / CELL); j <= Math.floor((y + r) / CELL); j++) {
    if (cellKind(i, j) !== 'bld') continue;
    const B = blockRect(i, j); if (circleRect(x, y, r, B.x0, B.y0, B.x1, B.y1)) return true;
  }
  return false;
}
function hitSolid(x, y, r) {
  for (const o of treesL) if (Math.hypot(x - o.x, y - o.y) < o.r * 0.85 + r) return o;
  for (const o of parkedL) if (Math.hypot(x - o.x, y - o.y) < o.r + r) return o;
  return null;
}
function hitStrips(list, x, y, r) {
  for (const s of list) if (circleRect(x, y, r, s.x - s.w / 2, s.y - s.h / 2, s.x + s.w / 2, s.y + s.h / 2)) return s;
  return null;
}

// ---------- pedestrians walk around the edge of their block ----------
function pedXY(p, s) { // writes the position at distance s along the walkway loop into pedXY.x / pedXY.y
  const w = p.w, h = p.h, P = 2 * (w + h); s = ((s % P) + P) % P;
  if (s < w) { pedXY.x = p.x0 + s; pedXY.y = p.y0; }
  else if (s < w + h) { pedXY.x = p.x0 + w; pedXY.y = p.y0 + s - w; }
  else if (s < 2 * w + h) { pedXY.x = p.x0 + w - (s - w - h); pedXY.y = p.y0 + h; }
  else { pedXY.x = p.x0; pedXY.y = p.y0 + h - (s - 2 * w - h); }
}
function updatePeds(dt, fx, fy, scared) {
  const SCARE = 14 * U;
  for (const p of pedsL) {
    // where this person would be on their walk (or at their chatting spot)
    p.s += p.dir * p.sp * dt; pedXY(p, p.s);
    const tx = pedXY.x + (p.ox || 0), ty = pedXY.y + (p.oy || 0);
    if (p.tx === undefined) { p.tx = tx; p.ty = ty; p.vx = 0; p.vy = 0; }
    const rvx = (tx - p.tx) / Math.max(dt, 1e-3), rvy = (ty - p.ty) / Math.max(dt, 1e-3);
    p.tx = tx; p.ty = ty;
    let dvx = rvx + (tx - p.x) * 2.5, dvy = rvy + (ty - p.y) * 2.5; // follow the walk, and come back to it after a scare
    const dx = p.x - fx, dy = p.y - fy, d = Math.hypot(dx, dy);
    if (scared && d < SCARE && d > 0.01) { // panic away from the car, in any direction, like fish
      const k = (6 + 26 * (1 - d / SCARE)) * U;
      dvx = dx / d * k + rvx * 0.3; dvy = dy / d * k + rvy * 0.3;
    } else { const m = Math.hypot(dvx, dvy), mx = 8 * U; if (m > mx) { dvx *= mx / m; dvy *= mx / m; } }
    const kv = Math.min(1, 10 * dt); p.vx += (dvx - p.vx) * kv; p.vy += (dvy - p.vy) * kv;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.spd = Math.hypot(p.vx, p.vy); p.run = p.spd > 9 * U;
    if (p.spd > 1.2 * U) p.ang = Math.atan2(p.vy, p.vx);
  }
}
// ---------- civilian vehicle kinds (sizes in U; c = collision circle offsets along the body) ----------
const VEH = {
  sedan: { L: 4.2, W: 2.1, c: [0], r: 1.9, w: 40 }, van: { L: 5.2, W: 2.5, c: [0], r: 2.2, w: 12 }, taxi: { L: 4.2, W: 2.1, c: [0], r: 1.9, w: 14 },
  bus: { L: 9.5, W: 2.9, c: [-3, 0, 3], r: 2.0, w: 8 }, truck: { L: 8, W: 2.7, c: [-2.5, 0, 2.5], r: 1.9, w: 8 },
  bike: { L: 3, W: 1, c: [0], r: 1.1, w: 12 }, ambulance: { L: 5.4, W: 2.4, c: [0], r: 2.2, w: 3 },
};
function pickVeh() { let roll = rnd(0, Object.values(VEH).reduce((a, v) => a + v.w, 0)); for (const k in VEH) { roll -= VEH[k].w; if (roll <= 0) return k; } return 'sedan'; }
function hitTraffic(x, y, r) {
  for (const o of traffic) { const V = VEH[o.kind]; for (const off of V.c) if (Math.hypot(x - (o.x + Math.cos(o.a) * off * U), y - (o.y + Math.sin(o.a) * off * U)) < r + V.r * U) return o; }
  return null;
}

function pedLook(R) {
  const pk = a => a[Math.floor(R() * a.length)];
  return { hue: Math.floor(R() * 360), skin: pk(['#f0c8a0', '#d9a577', '#a9744f', '#6e4a31']), hair: pk(['#2a1a10', '#5a3a1c', '#c9a24a', '#111', '#8a8a8a', '#a33a2a']),
    pants: pk(['#2b3a55', '#3a3a3a', '#5a4a3a', '#4a5a3a', '#6a2a2a']), hat: R() < 0.2, bag: R() < 0.25 };
}
