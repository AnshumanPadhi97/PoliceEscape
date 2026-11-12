// ---------- game state + simulation ----------
let state = 'menu'; // menu | play | pause | over
let overShown = false, lastRun = null;
let car = { x: 0, y: 0, a: -Math.PI / 2, shield: 0, inv: 0, dashT: 0, dashCd: 0, vx: 0, vy: 0, onOil: false };
let traffic = [], enemies = [], shells = [], rockets = [], zones = [], hspikes = [];
let powerups = [], dcoins = [], particles = [], rings = [], foam = [], floaters = [];
let cam = { x: 0, y: 0 };
let t = 0, score = 0, kills = 0, runCoins = 0;
let spawnT = 1.5, powerT = 8, bossT = 100, bossCount = 0, boss = null, shake = 0, overT = 0, secT = 1, foamT = 0, trafT = 0;
let slowT = 0, speedT = 0, magnetT = 0, banner = { text: '', t: 0 };
let wType = 'clear', wNext = null, wGoal = 0, wAmt = 0, wTimer = 35, flash = 0, sirenV = 0;
let dayClock = 24; const DAY = 120; // a full day is 2 minutes

const TYPES = {
  patrol:      { speed: 34, turn: 1.6, life: 15, r: 1.9, unlock: 0,  w: 3 },
  swat:        { speed: 18, turn: 1.7, life: 22, r: 2.6, unlock: 22, w: 1 },
  chopper:     { speed: 26, turn: 1.8, life: 20, r: 1.5, unlock: 14, w: 1.5 },
  gunbike:     { speed: 20, turn: 2.0, life: 22, r: 1.5, unlock: 35, w: 1.2 },
  heli:        { speed: 16, turn: 1.5, life: 28, r: 3,   unlock: 45, w: 1.1 },
  moto:        { speed: 44, turn: 2.4, life: 10, r: 1.4, unlock: 30, w: 1.2 },
  interceptor: { speed: 17, turn: 2.2, life: 18, r: 2.0, unlock: 40, w: 1.1 },
};
const PU = {
  shield: { col: '#8ab4ff', icon: '🛡', w: 3 },
  speed:  { col: '#ffe14d', icon: '⚡', w: 2 },
  magnet: { col: '#ff7a7a', icon: '🧲', w: 1.5 },
  slow:   { col: '#c9a0ff', icon: '⏱', w: 1.5 },
  bomb:   { col: '#ffb347', icon: '💥', w: 1.2 },
};
const PU_NAME = { shield: 'ARMOR', speed: 'TURBO', magnet: 'MAGNET', slow: 'SLOW-MO', bomb: 'EMP' };
const DMG = { mine: 2, bomb: 4 };

// ---------- difficulty: rising and falling surges (speeds never change, only how much comes at you) ----------
const SURGE_LEN = 45;
const surgePeak = tt => 1 + tt / 90;
const intensityAt = tt => (0.5 - 0.5 * Math.cos(TAU * tt / SURGE_LEN)) * surgePeak(tt);
const intensity = () => intensityAt(t);
const spawnGap = () => Math.max(0.35, 2.6 / (0.6 + 1.4 * intensity()));
function showBanner(text, sec = 2.8) { banner = { text, t: sec }; }
function snapToRoad(x, y) {
  const lx = Math.round(x / CELL) * CELL, ly = Math.round(y / CELL) * CELL;
  return Math.abs(x - lx) < Math.abs(y - ly) ? { x: lx + rnd(-3, 3) * U, y } : { x, y: ly + rnd(-3, 3) * U };
}

// ---------- start / end ----------
function start() {
  Sound.init();
  worldSeed = (Math.random() * 1e9) | 0;
  CELL = 64 * U; ROAD = 16 * U; cells = new Map(); destroyed = new Set(); worldT = 0;
  car = { x: 0, y: 0, a: -Math.PI / 2, shield: 0, inv: 0, dashT: 0, dashCd: 0, vx: undefined, vy: 0, onOil: false };
  cam.x = -W / 2; cam.y = -H / 2;
  traffic = []; enemies = []; shells = []; rockets = []; zones = []; hspikes = [];
  powerups = []; dcoins = []; particles = []; rings = []; foam = []; floaters = [];
  t = 0; score = 0; kills = 0; runCoins = 0;
  spawnT = 1.5; powerT = 8; bossT = 100; bossCount = 0; boss = null; shake = 0; overT = 0; secT = 1; trafT = 0;
  slowT = speedT = magnetT = 0; banner = { text: '', t: 0 };
  wType = 'clear'; wNext = null; wGoal = 0; wAmt = 0; wTimer = rnd(30, 45); flash = 0; dayClock = rnd(0, DAY); // every run starts at a random time of day
  loadCells();
  save.stats.runs++; persist();
  state = 'play'; overShown = false;
  showPanel(null);
  Sound.setMood('calm'); Sound.music(true);
}
function die() {
  if (state !== 'play') return;
  state = 'over'; overT = 0; overShown = false;
  explode(car.x, car.y, true, '#ffd27f'); explode(car.x, car.y, true);
  shake = 18; Sound.sfx('die'); Sound.engine(0); Sound.siren(0); Sound.setMood('calm'); buzz(300);
  score = Math.floor(t) + runCoins;
  const newBest = score > save.best; if (newBest) save.best = score;
  save.coins += runCoins; save.stats.maxScore = Math.max(save.stats.maxScore || 0, score);
  evt('survive', t);
  lastRun = { score, kills, coins: runCoins, time: t, newBest };
  persist();
}

// ---------- scoring / kills ----------
function collectCoin(n) { runCoins += n; evt('coin', n); }
function killEnemy(e, how) {
  if (e.dead) return;
  if (e.boss) { hurtBoss(e, DMG[how] ?? 1); return; }
  if (e.type === 'heli' && how !== 'bomb') return; // helicopters only fall to the EMP
  e.dead = true;
  explode(e.x, e.y, false, how === 'shield' ? '#8ab4ff' : null);
  kills++; evt('kill');
}
function hurtBoss(e, d) {
  if (e.dead || e.iframe > 0) return;
  e.hp -= d; e.flash = 0.18; e.iframe = 0.12; Sound.sfx('explode');
  explode(e.x + rnd(-3, 3) * U, e.y + rnd(-3, 3) * U, false);
  if (e.hp <= 0) {
    e.dead = true; boss = null; bossT = 110;
    for (let i = 0; i < 6; i++) explode(e.x + rnd(-6, 6) * U, e.y + rnd(-6, 6) * U, true);
    Sound.sfx('big'); shake = 20; buzz(200); kills++; evt('boss');
    for (let i = 0; i < 25; i++) dcoins.push({ x: e.x + rnd(-8, 8) * U, y: e.y + rnd(-8, 8) * U, life: 20 });
    showBanner('BOSS DOWN!'); Sound.setMood('calm');
  }
}
// returns true if the car died
function hitCar() {
  if (car.inv > 0 || state !== 'play') return false;
  if (car.shield > 0) { car.shield = 0; car.inv = 0.8; Sound.sfx('shield'); buzz(40); shake = Math.max(shake, 5); return false; }
  die(); return true;
}
function shove(o, r) { // push the car out of a solid thing after the armor soaked the hit
  const a = Math.atan2(car.y - o.y, car.x - o.x), d = o.r + r + 1.5 * U;
  car.x = o.x + Math.cos(a) * d; car.y = o.y + Math.sin(a) * d; car.vx = Math.cos(a) * 10 * U; car.vy = Math.sin(a) * 10 * U;
}

// ---------- explosive barrels ----------
function detonate(m) {
  if (m.dead) return;
  m.dead = true; if (m.id) destroyed.add(m.id);
  explode(m.x, m.y, true); Sound.sfx('explode');
  const R = 11 * U;
  for (const e of enemies) if (!e.dead && Math.hypot(e.x - m.x, e.y - m.y) < R + (e.boss ? e.r : 0)) killEnemy(e, 'mine');
  for (const o of barrelsL) if (!o.dead && Math.hypot(o.x - m.x, o.y - m.y) < R) detonate(o);
  if (state === 'play' && Math.hypot(car.x - m.x, car.y - m.y) < 6.5 * U) hitCar();
}

// ---------- police ----------
function makeEnemy(type, x, y, a) {
  const d = TYPES[type];
  return { type, x, y, a, age: 0, speed: d.speed * U, turn: d.turn, life: d.life, r: d.r * U, dead: false, ph: 0, pt: 0, aim: 0,
    cd: rnd(1.5, 3), cd2: rnd(3, 6), side: Math.random() < 0.5 ? 1 : -1, flash: 0, smart: Math.random() < 0.85, flying: type === 'heli' };
}
function spawnEnemy() {
  const avail = Object.keys(TYPES).filter(k => t >= TYPES[k].unlock), w = avail.map(k => TYPES[k].w);
  let roll = rnd(0, w.reduce((a, b) => a + b, 0)), type = avail[0];
  for (let i = 0; i < avail.length; i++) { roll -= w[i]; if (roll <= 0) { type = avail[i]; break; } }
  const sa = rnd(0, TAU), dist = Math.hypot(W, H) / 2 + 4 * U;
  let p = { x: car.x + Math.cos(sa) * dist, y: car.y + Math.sin(sa) * dist };
  if (type !== 'heli') p = snapToRoad(p.x, p.y);
  enemies.push(makeEnemy(type, p.x, p.y, Math.atan2(car.y - p.y, car.x - p.x) + rnd(-0.4, 0.4)));
}
function spawnBoss() {
  const n = bossCount++, kind = n % 2 === 0 ? 'tank' : 'dozer', sa = rnd(0, TAU), dist = Math.hypot(W, H) / 2 + 10 * U;
  const x = car.x + Math.cos(sa) * dist, y = car.y + Math.sin(sa) * dist, hp = (kind === 'tank' ? 14 : 16) + 4 * n;
  boss = { boss: true, type: kind, x, y, a: sa + Math.PI, age: 0, speed: (kind === 'tank' ? 12 : 13) * U, turn: 1, life: Infinity,
    r: (kind === 'tank' ? 7 : 6) * U, dead: false, ph: 0, hp, maxHp: hp, cd: 2.5, cd2: 6, side: 1, flash: 0, iframe: 0 };
  enemies.push(boss);
  showBanner('⚠ WARNING: ' + (kind === 'tank' ? 'ARMORED TANK' : 'RIOT DOZER') + ' ⚠', 3.5);
  Sound.sfx('roar'); Sound.setMood('boss'); buzz(150);
}
// choose a heading that does not point into a building (smart cops only)
function freeAngle(e, want, L) {
  const blk = a => hitBuilding(e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, 1.3 * U) || hitBuilding(e.x + Math.cos(a) * L * 0.5, e.y + Math.sin(a) * L * 0.5, 1.3 * U);
  if (!blk(want)) return want;
  const s = angDiff(want, e.a) >= 0 ? 1 : -1;
  for (let k = 1; k <= 7; k++) { const d = k * 0.4; if (!blk(want + s * d)) return want + s * d; if (!blk(want - s * d)) return want - s * d; }
  return want;
}

function updateEnemy(e, dt) {
  e.age += dt; e.flash = Math.max(0, e.flash - dt); if (e.iframe) e.iframe = Math.max(0, e.iframe - dt);
  e.life -= dt; if (e.life <= 0) { e.dead = true; return; } // the cop gives up
  const dx = car.x - e.x, dy = car.y - e.y, dist = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
  let want = toP, sp = e.speed, avoid = e.smart && !e.boss && !e.flying;
  switch (e.type) {
    case 'swat': case 'gunbike': case 'spiker': {
      const rng = e.type === 'spiker' ? 20 * U : e.type === 'gunbike' ? 24 * U : 30 * U;
      want = toP + e.side * (dist > rng * 1.25 ? 0.3 : dist < rng * 0.7 ? 2.3 : Math.PI / 2);
      e.cd -= dt;
      if ((e.type === 'swat' || e.type === 'gunbike') && e.cd <= 0 && dist < 60 * U) {
        e.cd = e.type === 'swat' ? 2.2 : 2.6; const a = toP + rnd(-0.08, 0.08);
        shells.push({ x: e.x + Math.cos(e.a) * 2 * U, y: e.y + Math.sin(e.a) * 2 * U, vx: Math.cos(a) * 34 * U, vy: Math.sin(a) * 34 * U, life: 3 }); Sound.sfx('shoot');
      } else if (e.type === 'spiker' && e.cd <= 0) {
        e.cd = 1.6; const horiz = Math.abs(Math.cos(e.a)) > Math.abs(Math.sin(e.a));
        hspikes.push({ x: e.x - Math.cos(e.a) * 4 * U, y: e.y - Math.sin(e.a) * 4 * U, w: horiz ? 1.5 * U : 8 * U, h: horiz ? 8 * U : 1.5 * U, life: 12, owner: e, grace: 1.2 });
      }
      break;
    }
    case 'heli': {
      want = toP + e.side * (dist > 32 * U ? 0.6 : dist < 22 * U ? 2.2 : Math.PI / 2);
      e.cd -= dt;
      if (e.cd <= 0 && dist < 55 * U) {
        e.cd = 3.2;
        for (let k = 0; k < (t > 90 ? 2 : 1); k++) zones.push({ x: car.x + (car.vx || 0) * (0.5 + k * 0.3) + rnd(-2, 2) * U, y: car.y + (car.vy || 0) * (0.5 + k * 0.3) + rnd(-2, 2) * U, r: 6 * U, t: 1.1, max: 1.1, kind: 'strike' });
        Sound.sfx('warn');
      }
      break;
    }
    case 'interceptor': {
      if (e.ph === 0) { e.pt += dt; if (dist < 26 * U && e.pt > 2) { e.ph = 1; e.pt = 0; e.aim = toP; Sound.sfx('warn'); } }
      else if (e.ph === 1) { e.pt += dt; sp = 0; want = e.a; e.aim = toP; if (e.pt > 0.9) { e.ph = 2; e.pt = 0; e.a = e.aim; Sound.sfx('dash'); } }
      else { e.pt += dt; sp = 72 * U; want = e.a; avoid = false; if (e.pt > 0.8) { e.ph = 0; e.pt = -1; } }
      break;
    }
    case 'tank': {
      want = toP + e.side * (dist > 45 * U ? 0 : dist < 28 * U ? Math.PI : Math.PI / 2);
      if (dist < 45 * U && dist > 28 * U) sp = e.speed * 0.5;
      const f = boss.hp < boss.maxHp / 2 ? 0.65 : 1;
      e.cd -= dt; e.cd2 -= dt;
      if (e.cd <= 0) { e.cd = 3.2 * f; for (const o of [-0.22, 0, 0.22]) shells.push({ x: e.x + Math.cos(e.a) * 5 * U, y: e.y + Math.sin(e.a) * 5 * U, vx: Math.cos(toP + o) * 36 * U, vy: Math.sin(toP + o) * 36 * U, life: 3.2 }); Sound.sfx('shoot'); }
      if (e.cd2 <= 0) { e.cd2 = 6 * f; for (const o of [-0.5, 0.5]) rockets.push({ x: e.x, y: e.y, a: e.a + o, life: 4.5 }); Sound.sfx('shoot'); }
      break;
    }
    case 'dozer': {
      const f = boss.hp < boss.maxHp / 2 ? 0.6 : 1;
      e.cd -= dt; e.cd2 -= dt;
      if (e.cd <= 0) { e.cd = 4 * f; zones.push({ x: car.x, y: car.y, r: 9 * U, t: 1.1, max: 1.1, kind: 'slam' }); Sound.sfx('warn'); }
      break;
    }
  }
  const tgt = avoid ? freeAngle(e, want, (TYPES[e.type] && TYPES[e.type].r < 1.6 ? 6 : 8) * U) : want;
  e.a += clamp(angDiff(e.a, tgt), -e.turn * dt, e.turn * dt);
  e.x += Math.cos(e.a) * sp * dt; e.y += Math.sin(e.a) * sp * dt;
  if (e.boss || e.flying) return;
  // crash into things
  if (hitBuilding(e.x, e.y, e.r * 0.7)) return killEnemy(e, 'crash');
  for (const o of parkedL) if (Math.hypot(e.x - o.x, e.y - o.y) < o.r + e.r * 0.7) return killEnemy(e, 'crash'); // trees/bushes don't hurt cops
  if (hitStrips(spikesL, e.x, e.y, e.r * 0.6)) return killEnemy(e, 'spike');
  for (const s of hspikes) if (!(s.owner === e && s.grace > 0) && circleRect(e.x, e.y, e.r * 0.6, s.x - s.w / 2, s.y - s.h / 2, s.x + s.w / 2, s.y + s.h / 2)) return killEnemy(e, 'spike');
  for (const b of barrelsL) if (!b.dead && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 1.6 * U) { detonate(b); return; }
  if (hitTraffic(e.x, e.y, e.r * 0.8)) return killEnemy(e, 'crash');
}

// ---------- boat actions -> car actions ----------
function dash() {
  if (state !== 'play' || car.dashCd > 0) return;
  const C = CARS[save.car];
  car.dashT = 0.35; car.inv = Math.max(car.inv, 0.45); car.dashCd = C.dashCd * (1 - 0.12 * save.up.dash);
  splash(car.x, car.y); Sound.sfx('dash'); buzz(25);
}
function takePU(p) {
  Sound.sfx('power'); buzz(30); splash(p.x, p.y);
  const k = p.type;
  floaters.push({ x: p.x, y: p.y - 2 * U, text: PU_NAME[k], life: 1.2 });
  if (k === 'shield') car.shield = 6 + save.up.shield;
  else if (k === 'speed') speedT = 8;
  else if (k === 'magnet') magnetT = 10;
  else if (k === 'slow') slowT = 6;
  else if (k === 'bomb') {
    Sound.sfx('big'); shake = 14; rings.push({ x: car.x, y: car.y, r: 1 * U, life: 0.5, max: 0.5 });
    for (const e of enemies) if (!e.dead && Math.hypot(e.x - car.x, e.y - car.y) < 70 * U) killEnemy(e, 'bomb');
  }
}
function pickPowerType() {
  const keys = Object.keys(PU); let roll = rnd(0, keys.reduce((a, k) => a + PU[k].w, 0));
  for (const k of keys) { roll -= PU[k].w; if (roll <= 0) return k; }
  return 'shield';
}

// ---------- weather + day/night ----------
function nightAmt() {
  const p = (dayClock / DAY) % 1;
  if (p < 0.45) return 0; if (p < 0.55) return (p - 0.45) / 0.1; if (p < 0.9) return 1; return 1 - (p - 0.9) / 0.1;
}
function duskTint() {
  const p = (dayClock / DAY) % 1;
  if (p > 0.4 && p < 0.6) return Math.sin(Math.PI * (p - 0.4) / 0.2);
  if (p > 0.88) return Math.sin(Math.PI * (p - 0.88) / 0.12);
  return 0;
}
function updateWeather(dt) {
  wTimer -= dt;
  if (wTimer <= 0) {
    wTimer = rnd(25, 45);
    let nx = pick(['clear', 'clear', 'rain', 'fog']); if (nx === wType) nx = 'clear';
    wNext = nx; wGoal = 0;
  }
  if (wNext !== null && wAmt <= 0.02) { wType = wNext; wNext = null; wGoal = wType === 'clear' ? 0 : 1; }
  wAmt += clamp(wGoal - wAmt, -0.4 * dt, 0.4 * dt);
}

// ---------- civilian traffic: drives straight along the lanes ----------
function spawnTraffic(fx, fy) {
  const a = rnd(0, TAU), d = Math.hypot(W, H) / 2 + rnd(2, 12) * U, px = fx + Math.cos(a) * d, py = fy + Math.sin(a) * d, hues = [0, 30, 50, 120, 200, 260, 300];
  let o;
  if (Math.random() < 0.5) { const i = Math.round(px / CELL), dir = Math.random() < 0.5 ? 1 : -1; o = { x: i * CELL - dir * ROAD / 4, y: py, a: dir > 0 ? Math.PI / 2 : -Math.PI / 2 }; }
  else { const j = Math.round(py / CELL), dir = Math.random() < 0.5 ? 1 : -1; o = { x: px, y: j * CELL + dir * ROAD / 4, a: dir > 0 ? 0 : Math.PI }; }
  if (traffic.some(q => Math.hypot(q.x - o.x, q.y - o.y) < 14 * U)) return;
  if (state === 'play' && Math.hypot(o.x - car.x, o.y - car.y) < 20 * U) return;
  o.kind = pickVeh(); o.r = VEH[o.kind].r * U; o.hue = pick(hues); o.sp = 13 * U;
  traffic.push(o);
}
function updateTraffic(dt, fx, fy) {
  trafT -= dt;
  if (trafT <= 0 && traffic.length < 12) { trafT = 0.7; spawnTraffic(fx, fy); }
  for (const o of traffic) { o.x += Math.cos(o.a) * o.sp * dt; o.y += Math.sin(o.a) * o.sp * dt; }
  const far = Math.hypot(W, H) * 0.9;
  traffic = traffic.filter(o => Math.hypot(o.x - fx, o.y - fy) < far);
}

// ---------- effects ----------
function explode(x, y, big, col) {
  const n = big ? 26 : 14;
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), s = rnd(4, big ? 26 : 16) * U;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.4, 0.9), max: 0.9, s: rnd(0.5, big ? 1.8 : 1.2) * U, c: col || pick(['#ffd27f', '#ff9a3c', '#ff5a3c', '#555']) });
  }
  rings.push({ x, y, r: 1 * U, life: 0.35, max: 0.35 });
  if (!col || big) { Sound.sfx(big ? 'explode' : 'explode'); shake = Math.max(shake, big ? 9 : 4); }
}
function splash(x, y) {
  for (let i = 0; i < 8; i++) { const a = rnd(0, TAU), s = rnd(3, 10) * U; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5, s: rnd(0.4, 0.9) * U, c: 'rgba(220,220,220,.8)' }); }
}
function updateFx(dt) {
  shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt * 2); banner.t = Math.max(0, banner.t - dt);
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.life -= dt; }
  particles = particles.filter(p => p.life > 0);
  for (const r of rings) { r.life -= dt; r.r += 60 * U * dt; }
  rings = rings.filter(r => r.life > 0);
  for (const p of foam) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  foam = foam.filter(p => p.life > 0);
  for (const f of floaters) { f.y -= 4 * U * dt; f.life -= dt; }
  floaters = floaters.filter(f => f.life > 0);
}

// ---------- main update ----------
function update(dt) {
  worldT += dt;
  updatePeds(dt, car.x, car.y, state === 'play');
  if (state === 'menu') { cam.x += 7 * U * dt; cam.y = -H / 2 - 0.0; loadCells(); updateTraffic(dt, cam.x + W / 2, cam.y + H / 2); }
  if (state === 'over') { overT += dt; if (!overShown && overT > 0.9) { overShown = true; showPanel('over'); } }
  if (state !== 'play') { updateFx(dt); return; }
  const C = CARS[save.car], edt = slowT > 0 ? dt * 0.5 : dt;
  t += dt; dayClock += dt;
  slowT = Math.max(0, slowT - dt); speedT = Math.max(0, speedT - dt); magnetT = Math.max(0, magnetT - dt);
  car.inv = Math.max(0, car.inv - dt); car.dashCd = Math.max(0, car.dashCd - dt); car.dashT = Math.max(0, car.dashT - dt);
  car.shield = Math.max(0, car.shield - dt);
  secT -= dt; if (secT <= 0) { secT = 1; evt('survive', t); }
  score = Math.floor(t) + runCoins;

  // steering + movement
  const turnRate = C.turn * (1 + 0.06 * save.up.turn);
  if (ptr.down) {
    const want = Math.atan2(ptr.y - (car.y - cam.y), ptr.x - (car.x - cam.x));
    car.a += clamp(angDiff(car.a, want), -turnRate * dt, turnRate * dt);
  }
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) car.a -= turnRate * dt;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) car.a += turnRate * dt;
  let drag = 1; if (car.dashT <= 0) for (const o of conesL) if (Math.hypot(car.x - o.x, car.y - o.y) < 2.2 * U) { drag = 0.55; break; }
  const bs = C.speed * (speedT > 0 ? 1.4 : 1) * (car.dashT > 0 ? 2.6 : 1) * drag * U;
  const onOil = oilL.some(o => Math.hypot(car.x - o.x, car.y - o.y) < o.r);
  if (car.vx === undefined) { car.vx = Math.cos(car.a) * bs; car.vy = Math.sin(car.a) * bs; }
  const kv = Math.min(1, (onOil ? 0.15 : 18) * dt);
  car.vx += (Math.cos(car.a) * bs - car.vx) * kv; car.vy += (Math.sin(car.a) * bs - car.vy) * kv;
  car.x += car.vx * dt; car.y += car.vy * dt; car.onOil = onOil;
  foamT -= dt;
  if (foamT <= 0 && (car.dashT > 0 || speedT > 0 || onOil)) { foamT = 0.03; foam.push({ x: car.x - Math.cos(car.a) * 2.5 * U, y: car.y - Math.sin(car.a) * 2.5 * U, vx: rnd(-1, 1) * U, vy: rnd(-1, 1) * U, life: 0.5, max: 0.5, s: 0.7 * U }); }
  { const k = 1 - Math.exp(-8 * dt); cam.x += (car.x - W / 2 - cam.x) * k; cam.y += (car.y - H / 2 - cam.y) * k; }
  loadCells();

  // crashes: buildings always wreck you; other solid things are soaked up by armor / nitro
  if (hitBuilding(car.x, car.y, 1.5 * U)) { die(); return updateFx(dt); }
  const so = parkedL.find(o => Math.hypot(car.x - o.x, car.y - o.y) < o.r + 1.5 * U); // bushes and trees are passable
  if (so && !hitCar()) { if (state === 'play') shove(so, 1.5 * U); else return updateFx(dt); }
  if (state !== 'play') return updateFx(dt);
  if (hitStrips(spikesL, car.x, car.y, 1.2 * U) && hitCar()) return updateFx(dt);
  for (const s of hspikes) if (circleRect(car.x, car.y, 1.2 * U, s.x - s.w / 2, s.y - s.h / 2, s.x + s.w / 2, s.y + s.h / 2) && hitCar()) return updateFx(dt);
  for (const b of barrelsL) if (!b.dead && Math.hypot(car.x - b.x, car.y - b.y) < 3 * U) detonate(b);
  if (state !== 'play') return updateFx(dt);
  if (hitTraffic(car.x, car.y, 1.5 * U)) { if (hitCar()) return updateFx(dt); }

  // coins + powerups
  const magR = (magnetT > 0 ? 3 : 1) * (6 + 2.5 * save.up.magnet) * U;
  for (const k of coinsL) {
    const d = Math.hypot(car.x - k.x, car.y - k.y);
    if (d < magR && d > 0.5) { k.x += (car.x - k.x) / d * 40 * U * dt; k.y += (car.y - k.y) / d * 40 * U * dt; }
    if (d < 2.6 * U) { k.dead = true; destroyed.add(k.id); collectCoin(1); Sound.sfx('coin'); }
  }
  for (const k of dcoins) {
    const d = Math.hypot(car.x - k.x, car.y - k.y); k.life -= dt;
    if (d < magR * 1.5 && d > 0.5) { k.x += (car.x - k.x) / d * 40 * U * dt; k.y += (car.y - k.y) / d * 40 * U * dt; }
    if (d < 2.6 * U) { k.life = 0; collectCoin(1); Sound.sfx('coin'); }
  }
  dcoins = dcoins.filter(k => k.life > 0);
  powerT -= dt;
  if (powerT <= 0 && powerups.length < 2) {
    powerT = rnd(9, 14); const a = rnd(0, TAU), d = rnd(22, 40) * U, p = snapToRoad(car.x + Math.cos(a) * d, car.y + Math.sin(a) * d);
    powerups.push({ x: p.x, y: p.y, type: pickPowerType(), life: 14 });
  }
  for (const p of powerups) {
    p.life -= dt; const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (magnetT > 0 && d < magR && d > 0.5) { p.x += (car.x - p.x) / d * 40 * U * dt; p.y += (car.y - p.y) / d * 40 * U * dt; }
    if (d < 3.2 * U) { p.life = 0; takePU(p); }
  }
  powerups = powerups.filter(p => p.life > 0);

  // police
  spawnT -= edt;
  if (spawnT <= 0) { spawnT = spawnGap(); spawnEnemy(); if (intensity() > 1.1 && Math.random() < 0.3) spawnEnemy(); }
  if (!boss) { bossT -= dt; if (bossT <= 0) spawnBoss(); }
  for (const e of enemies) if (!e.dead) updateEnemy(e, edt);
  // cop vs cop / boss
  for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) {
    const a = enemies[i], b = enemies[j]; if (a.dead || b.dead || a.flying || b.flying) continue;
    if (Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.85) {
      if (a.boss) { killEnemy(b, 'crash'); hurtBoss(a, 1); } else if (b.boss) { killEnemy(a, 'crash'); hurtBoss(b, 1); } else { killEnemy(a, 'crash'); killEnemy(b, 'crash'); }
    }
  }
  // cop vs player
  for (const e of enemies) {
    if (e.dead || state !== 'play') continue;
    const hitR = e.type === 'heli' ? 0 : e.r + 1.4 * U;
    if (hitR && Math.hypot(car.x - e.x, car.y - e.y) < hitR) {
      if (car.inv > 0) continue;
      if (car.shield > 0) { hitCar(); killEnemy(e, 'shield'); } else { die(); break; }
    }
  }
  if (state !== 'play') return updateFx(dt);
  enemies = enemies.filter(e => !e.dead && Math.hypot(e.x - car.x, e.y - car.y) < 400 * U);

  // bullets, rockets, hostile spikes, warning zones
  for (const s of shells) {
    s.x += s.vx * edt; s.y += s.vy * edt; s.life -= edt;
    if (hitBuilding(s.x, s.y, 0.5 * U)) { s.life = 0; splash(s.x, s.y); }
    else if (Math.hypot(s.x - car.x, s.y - car.y) < 1.8 * U) { s.life = 0; hitCar(); }
  }
  shells = shells.filter(s => s.life > 0);
  for (const m of rockets) {
    m.life -= edt; m.a += clamp(angDiff(m.a, Math.atan2(car.y - m.y, car.x - m.x)), -1.6 * edt, 1.6 * edt);
    m.x += Math.cos(m.a) * 30 * U * edt; m.y += Math.sin(m.a) * 30 * U * edt;
    if (hitBuilding(m.x, m.y, 0.6 * U)) { m.life = 0; explode(m.x, m.y, false); }
    else if (Math.hypot(m.x - car.x, m.y - car.y) < 2 * U) { m.life = 0; explode(m.x, m.y, false); hitCar(); }
  }
  rockets = rockets.filter(m => m.life > 0);
  for (const s of hspikes) { s.life -= edt; s.grace = Math.max(0, (s.grace || 0) - edt); }
  hspikes = hspikes.filter(s => s.life > 0);
  for (const z of zones) {
    z.t -= edt;
    if (z.t <= 0) {
      explode(z.x, z.y, true, z.kind === 'slam' ? '#c9a07a' : null); shake = Math.max(shake, 8);
      if (Math.hypot(car.x - z.x, car.y - z.y) < z.r) hitCar();
    }
  }
  zones = zones.filter(z => z.t > 0);

  updateTraffic(dt, car.x, car.y);
  updateWeather(dt);
  updateFx(dt);
  // sound: engine + siren that grows as the cops close in
  Sound.engine(car.dashT > 0 ? 70 : 30); Sound.setMood(boss ? 'boss' : 'calm');
  let near = 1e9; for (const e of enemies) near = Math.min(near, Math.hypot(e.x - car.x, e.y - car.y));
  Sound.siren(enemies.length ? clamp(1 - near / (90 * U), 0, 1) : 0);
}
