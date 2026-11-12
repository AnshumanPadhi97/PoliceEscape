// ---------- game state + simulation ----------
let state = 'menu'; // menu | play | pause | over
let overShown = false, lastRun = null;
let car = { trail: [], tt: 0, x: 0, y: 0, a: -Math.PI / 2, shield: 0, inv: 0, dashT: 0, dashCd: 0, vx: 0, vy: 0, onOil: false };
let traffic = [], enemies = [], shells = [], rockets = [], zones = [], hspikes = [];
let powerups = [], dcoins = [], particles = [], rings = [], foam = [], floaters = [];
let cam = { x: 0, y: 0 };
let t = 0, score = 0, kills = 0, runCoins = 0, bonusPts = 0;
let spawnT = 1.5, powerT = 8, bossT = 0, evT = 6, bossCount = 0, boss = null, shake = 0, overT = 0, secT = 1, foamT = 0, trafT = 0;
let slowT = 0, speedT = 0, magnetT = 0, banner = { text: '', t: 0 };
let wType = 'clear', wNext = null, wGoal = 0, wAmt = 0, wTimer = 12, flash = 0, sirenV = 0;
let skids = [], radioLog = [], radioCd = 0, radioIdle = 8, radioSeen = {}, radioHeat = 0, radioW = 'clear';
let fuelT = 6, lens = [], blocks = [], blockT = 24, slowmoT = 0, lightning = 0, lightFlick = 0, thunderT = -1, lightT = 8, rsplash = [];
let dayClock = 24; const DAY = 80; // a full day is ~80 seconds

const TYPES = {
  patrol:      { speed: 34, turn: 1.6, life: 15, r: 1.9, unlock: 0,  w: 3 },
  swat:        { speed: 18, turn: 1.7, life: 22, r: 2.6, unlock: 22, w: 1 },
  chopper:     { speed: 26, turn: 1.8, life: 20, r: 1.5, unlock: 14, w: 1.5 },
  gunbike:     { speed: 20, turn: 2.0, life: 22, r: 1.5, unlock: 35, w: 1.2 },
  heli:        { speed: 16, turn: 1.5, life: 28, r: 3,   unlock: 45, w: 1.1 },
  moto:        { speed: 44, turn: 2.4, life: 10, r: 1.4, unlock: 30, w: 1.2 },
  interceptor: { speed: 17, turn: 2.2, life: 18, r: 2.0, unlock: 40, w: 1.1 },
  spiker:      { speed: 24, turn: 1.8, life: 20, r: 2.3, unlock: 26, w: 1.1 },
  truck:       { speed: 20, turn: 1.2, life: 26, r: 3.4, unlock: 55, w: 0.9, hp: 3 },
  apc:         { speed: 15, turn: 1.3, life: 30, r: 3.0, unlock: 70, w: 0.8, hp: 2 },
};
const PU = {
  shield: { col: '#8ab4ff', icon: '🛡', w: 3 },
  speed:  { col: '#ffe14d', icon: '⚡', w: 2 },
  magnet: { col: '#ff7a7a', icon: '🧲', w: 1.5 },
  slow:   { col: '#c9a0ff', icon: '⏱', w: 1.5 },
  bomb:   { col: '#ffb347', icon: '💥', w: 1.2 },
  repair: { col: '#4cd964', icon: '🔧', w: 1.6 },
  nitro:  { col: '#4db8ff', icon: '🚀', w: 1.4 },
  fuel:   { col: '#ff5a3c', icon: '⛽', w: 0 }, // spawned on its own schedule
};
const PU_NAME = { shield: 'ARMOR', speed: 'TURBO', magnet: 'MAGNET', slow: 'SLOW-MO', bomb: 'EMP', repair: 'REPAIRED', nitro: 'BOOST READY', fuel: 'FUEL' };
const DMG = { mine: 2, bomb: 4 };

// ---------- police radio ----------
const RADIO_NEW = {
  patrol: 'Suspect fleeing!',
  swat: 'SWAT is in!',
  chopper: 'Bike on his tail!',
  heli: 'Air support!',
  gunbike: 'Weapons free!',
  moto: 'Moto closing in!',
  interceptor: 'Ramming him!',
  spiker: 'Laying spikes!',
  truck: 'Riot truck here!',
  apc: 'APC rolling in!',
};
const RADIO_IDLE = ['Keep pursuing!', 'Block the road!', 'Where did he go?', 'Need backup!', 'Cut him off!', 'Do not lose him!'];
const RADIO_DOWN = ['Unit down!', 'Officer down!', 'We lost one!'];
const RADIO_HEAT = ['Suspect is dangerous!', 'All units, converge!', 'Call in everything!'];
function radio(text, prio = 0, src) { // the line is spoken by (and drawn above) a police vehicle
  if (state !== 'play' || (radioCd > 0 && prio < 1)) return;
  if (!src || src.dead) { let bd = 1e9; src = null; for (const e of enemies) if (!e.dead) { const d = Math.hypot(e.x - car.x, e.y - car.y); if (d < bd) { bd = d; src = e; } } }
  if (!src) return;
  radioLog.push({ text, t: 5.5, e: src, x: src.x, y: src.y }); if (radioLog.length > 3) radioLog.shift();
  radioCd = 3.2; Sound.sfx('radio');
}
function updateRadio(dt) {
  radioCd -= dt; radioIdle -= dt;
  if (radioIdle <= 0) { radioIdle = rnd(12, 20); radio(pick(RADIO_IDLE)); }
  const h = Math.min(3, Math.floor(intensity() * 1.5));
  if (h > radioHeat) { radioHeat = h; radio(RADIO_HEAT[h - 1], 1); } else if (h < radioHeat) radioHeat = h;
  if (wType !== radioW && wAmt > 0.3) { radioW = wType; if (wType === 'rain') radio('Roads are slick!'); else if (wType === 'storm') radio('Storm warning!'); else if (wType === 'fog') radio('Low visibility!'); }
}

// ---------- tire skid marks (stay on the road, fade slowly; wet marks in rain) ----------
function addSkid(o, active, back, side, wet) {
  const k = o.sk || (o.sk = { l: null, r: null });
  if (!active) { k.l = k.r = null; return; }
  const ca = Math.cos(o.a), sa = Math.sin(o.a), bx = o.x - ca * back, by = o.y - sa * back;
  const Lp = { x: bx - sa * side, y: by + ca * side }, Rp = { x: bx + sa * side, y: by - ca * side };
  if (!k.l) { k.l = Lp; k.r = Rp; return; }
  if (Math.hypot(Lp.x - k.l.x, Lp.y - k.l.y) < 0.9 * U) return;
  const life = wet ? 7 : 22;
  skids.push({ x1: k.l.x, y1: k.l.y, x2: Lp.x, y2: Lp.y, life, max: life, wet }, { x1: k.r.x, y1: k.r.y, x2: Rp.x, y2: Rp.y, life, max: life, wet });
  k.l = Lp; k.r = Rp;
  if (skids.length > 900) skids.splice(0, skids.length - 900);
}

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
  car = { trail: [], tt: 0, x: 0, y: 0, a: -Math.PI / 2, shield: CARS[save.car].armor || 0, hp: maxHp(), fuel: 100, dry: 0, inv: 0, dashT: 0, dashCd: 0, vx: undefined, vy: 0, onOil: false };
  cam.x = -W / 2; cam.y = -H / 2;
  traffic = []; enemies = []; shells = []; rockets = []; zones = []; hspikes = [];
  powerups = []; dcoins = []; particles = []; rings = []; foam = []; floaters = [];
  blocks = []; blockT = 24; slowmoT = 0; lightning = 0; thunderT = -1; lightT = 8; rsplash = []; lens = []; fuelT = 6; zoom = 1;
  skids = []; radioLog = []; radioSeen = {}; radioHeat = 0; radioW = 'clear'; radioIdle = 8; radioCd = 2;
  t = 0; score = 0; kills = 0; runCoins = 0; bonusPts = 0;
  spawnT = 1.5; powerT = 8; bossT = 0; evT = rnd(2, 14); bossCount = 0; boss = null; shake = 0; overT = 0; secT = 1; trafT = 0;
  slowT = speedT = magnetT = 0; banner = { text: '', t: 0 };
  wType = pick(['clear', 'clear', 'rain', 'storm', 'fog']); wNext = null; wGoal = wType === 'clear' ? 0 : 1; wAmt = wGoal; radioW = wType; wTimer = rnd(14, 28); // every run starts with a random scene: weather as well as time of day
  lightT = rnd(1, 5); flash = 0; dayClock = rnd(0, DAY); // every run starts at a random time of day
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
  score = Math.floor(t) + runCoins + bonusPts;
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
  if (e.hp > 1 && how !== 'shield' && how !== 'bomb') { // armored units take several hits
    if (e.iframe > 0) return;
    e.hp--; e.flash = 0.3; e.iframe = 0.7; explode(e.x, e.y, false); Sound.sfx('explode');
    e.x -= Math.cos(e.a) * 2.5 * U; e.y -= Math.sin(e.a) * 2.5 * U; e.a += Math.PI * 0.6 * e.side;
    return;
  }
  e.dead = true; buzz(14);
  if (Math.random() < 0.3) radio(pick(RADIO_DOWN));
  explode(e.x, e.y, false, how === 'shield' ? '#8ab4ff' : null);
  kills++; evt('kill');
}
function hurtBoss(e, d) {
  if (e.dead || e.iframe > 0) return;
  e.hp -= d; e.flash = 0.18; e.iframe = 0.12; Sound.sfx('explode');
  explode(e.x + rnd(-3, 3) * U, e.y + rnd(-3, 3) * U, false);
  if (e.hp <= 0) {
    e.dead = true; boss = null; bossT = 25; slowmoT = 1.6; radio('Heavy unit down!', 2);
    for (let i = 0; i < 6; i++) explode(e.x + rnd(-6, 6) * U, e.y + rnd(-6, 6) * U, true);
    Sound.sfx('big'); shake = 20; buzz(200); kills++; evt('boss');
    for (let i = 0; i < 25; i++) dcoins.push({ x: e.x + rnd(-8, 8) * U, y: e.y + rnd(-8, 8) * U, life: 20 });
    showBanner('BOSS DOWN!'); Sound.setMood('calm');
  }
}
// returns true if the car died
const maxHp = () => { const V = CARS[save.car]; return V.hp || (V.kind === 'bike' ? 2 : 3); };
function hitCar() {
  if (car.inv > 0 || state !== 'play') return false;
  if (car.shield > 0) { car.shield = 0; car.inv = 0.8; Sound.sfx('shield'); buzz(40); shake = Math.max(shake, 5); return false; }
  car.hp--;
  if (car.hp <= 0) { die(); return true; }
  car.inv = 1.3; shake = Math.max(shake, 9); Sound.sfx('explode'); buzz(90); explode(car.x, car.y, false, '#ff7a5c');
  floaters.push({ x: car.x, y: car.y - 3 * U, text: car.hp === 1 ? 'LAST HIT!' : 'DAMAGE', life: 1.1, rgb: '255,120,100' });
  if (car.hp === 1) radio('He is smoking! One more!', 1);
  return false;
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
    cd: rnd(1.5, 3), cd2: rnd(3, 6), side: Math.random() < 0.5 ? 1 : -1, flash: 0, smart: Math.random() < 0.85, flying: type === 'heli', hp: d.hp || 1, iframe: 0 };
}
function spawnEnemy() {
  const avail = Object.keys(TYPES).filter(k => k !== 'heli' && t >= TYPES[k].unlock), w = avail.map(k => TYPES[k].w);
  let roll = rnd(0, w.reduce((a, b) => a + b, 0)), type = avail[0];
  for (let i = 0; i < avail.length; i++) { roll -= w[i]; if (roll <= 0) { type = avail[i]; break; } }
  const sa = rnd(0, TAU), dist = Math.hypot(W, H) / 2 + 4 * U;
  let p = { x: car.x + Math.cos(sa) * dist, y: car.y + Math.sin(sa) * dist };
  if (type !== 'heli') p = snapToRoad(p.x, p.y);
  const ne = makeEnemy(type, p.x, p.y, Math.atan2(car.y - p.y, car.x - p.x) + rnd(-0.4, 0.4)); enemies.push(ne);
  if (!radioSeen[type]) { radioSeen[type] = 1; radio(RADIO_NEW[type], 1, ne); }
}
function spawnBoss() {
  const n = bossCount++, kind = Math.random() < 0.5 ? 'tank' : 'dozer', sa = rnd(0, TAU), dist = Math.hypot(W, H) / 2 + 10 * U;
  const x = car.x + Math.cos(sa) * dist, y = car.y + Math.sin(sa) * dist, hp = (kind === 'tank' ? 14 : 16) + 4 * n;
  boss = { boss: true, type: kind, x, y, a: sa + Math.PI, age: 0, speed: (kind === 'tank' ? 12 : 13) * U, turn: 1, life: Infinity,
    r: (kind === 'tank' ? 7 : 6) * U, dead: false, ph: 0, hp, maxHp: hp, cd: 2.5, cd2: 6, side: 1, flash: 0, iframe: 0 };
  enemies.push(boss);
  showBanner('⚠ WARNING: ' + (kind === 'tank' ? 'ARMORED TANK' : 'RIOT DOZER') + ' ⚠', 3.5);
  Sound.sfx('roar'); Sound.setMood('boss'); buzz(150);
  radio(kind === 'tank' ? 'Tank deployed!' : 'Dozer incoming!', 2, boss);
}
// choose a heading that does not point into a building (smart cops only)
function freeAngle(e, want, L) {
  const blk = a => hitBuilding(e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, 1.3 * U) || hitBuilding(e.x + Math.cos(a) * L * 0.5, e.y + Math.sin(a) * L * 0.5, 1.3 * U);
  if (!blk(want)) return want;
  const s = angDiff(want, e.a) >= 0 ? 1 : -1;
  for (let k = 1; k <= 7; k++) { const d = k * 0.4; if (!blk(want + s * d)) return want + s * d; if (!blk(want - s * d)) return want - s * d; }
  return want;
}

function pushTrail(o, dt, max) {
  if (!o.trail) o.trail = [];
  o.tt = (o.tt || 0) + dt;
  if (o.tt > 0.03) { o.tt = 0; o.trail.push({ x: o.x, y: o.y }); if (o.trail.length > max) o.trail.shift(); }
}
function updateEnemy(e, dt) {
  if (!e.flying) pushTrail(e, dt, e.boss ? 18 : 12);
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
    case 'truck': {
      e.cd -= dt;
      if (e.cd <= 0 && dist < 70 * U && enemies.length < 16) {
        e.cd = 6; const m = makeEnemy('moto', e.x - Math.cos(e.a) * 5 * U, e.y - Math.sin(e.a) * 5 * U, e.a); enemies.push(m); Sound.sfx('warn');
      }
      break;
    }
    case 'apc': {
      want = toP + e.side * (dist > 38 * U ? 0.2 : dist < 22 * U ? 2.4 : Math.PI / 2);
      e.cd -= dt;
      if (e.cd <= 0 && dist < 60 * U) {
        e.cd = 3; for (const o of [-0.2, 0, 0.2]) shells.push({ x: e.x + Math.cos(e.a) * 3 * U, y: e.y + Math.sin(e.a) * 3 * U, vx: Math.cos(toP + o) * 32 * U, vy: Math.sin(toP + o) * 32 * U, life: 3 }); Sound.sfx('shoot');
      }
      break;
    }
    case 'heli': {
      // searchlight: the spot creeps toward you; stay inside it for a couple of seconds and backup is called in
      if (!e.spot) e.spot = { x: car.x, y: car.y };
      const sdx = car.x - e.spot.x, sdy = car.y - e.spot.y, sd = Math.hypot(sdx, sdy), step = Math.min(sd, 13 * U * dt);
      if (sd > 0.01) { e.spot.x += sdx / sd * step; e.spot.y += sdy / sd * step; }
      e.lit = sd < 7 * U ? (e.lit || 0) + dt : Math.max(0, (e.lit || 0) - dt * 1.5);
      if (e.lit >= 2.2) { e.lit = -4; callBackup(e); }
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
  if (!e.boss && !e.flying) {
    const wet = isRain() && wAmt > 0.3, da = Math.abs(angDiff(e.a, e.pa === undefined ? e.a : e.pa)) / Math.max(dt, 1e-4);
    addSkid(e, (e.type === 'interceptor' && e.ph === 2) || da > e.turn * 0.8 || (wet && onScreenW(e.x, e.y)), e.r * 0.8, e.r * 0.4, wet && !(e.type === 'interceptor' && e.ph === 2));
    e.pa = e.a;
  }
  if (e.boss || e.flying) return;
  // crash into things
  if (hitBuilding(e.x, e.y, e.r * 0.7)) return killEnemy(e, 'crash');
  for (const o of parkedL) if (Math.hypot(e.x - o.x, e.y - o.y) < o.r + e.r * 0.7) return killEnemy(e, 'crash'); // trees/bushes don't hurt cops
  for (const b of blocks) if (Math.hypot(e.x - b.x, e.y - b.y) < b.r + e.r * 0.6) return killEnemy(e, 'crash');
  if (hitStrips(spikesL, e.x, e.y, e.r * 0.6)) return killEnemy(e, 'spike');
  for (const s of hspikes) if (!(s.owner === e && s.grace > 0) && circleRect(e.x, e.y, e.r * 0.6, s.x - s.w / 2, s.y - s.h / 2, s.x + s.w / 2, s.y + s.h / 2)) return killEnemy(e, 'spike');
  for (const b of barrelsL) if (!b.dead && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 1.6 * U) { detonate(b); return; }
  if (hitTraffic(e.x, e.y, e.r * 0.8)) return killEnemy(e, 'crash');
}

function onScreenW(x, y) { return x > cam.x - 10 * U && x < cam.x + W + 10 * U && y > cam.y - 10 * U && y < cam.y + H + 10 * U; }
// ---------- roadblocks: a wall of police cars across the road with one gap ----------
function spawnRoadblock() {
  const vert = Math.abs(Math.sin(car.a)) > Math.abs(Math.cos(car.a)), d = Math.hypot(W, H) * 0.62;
  const px = car.x + Math.cos(car.a) * d, py = car.y + Math.sin(car.a) * d;
  let cx, cy, ang;
  if (vert) {
    cx = Math.round(car.x / CELL) * CELL; cy = (Math.floor(py / CELL) + 0.5) * CELL; ang = 0;
    if (Math.abs(car.x - cx) > ROAD * 0.7) return false;
    const sg = Math.sign(Math.sin(car.a)); if ((cy - car.y) * sg < d * 0.5) cy += sg * CELL;
  } else {
    cy = Math.round(car.y / CELL) * CELL; cx = (Math.floor(px / CELL) + 0.5) * CELL; ang = Math.PI / 2;
    if (Math.abs(car.y - cy) > ROAD * 0.7) return false;
    const sg = Math.sign(Math.cos(car.a)); if ((cx - car.x) * sg < d * 0.5) cx += sg * CELL;
  }
  if (blocks.some(b => Math.hypot(b.x - cx, b.y - cy) < 60 * U)) return false;
  const gap = Math.floor(rnd(0, 4)), sp = 4.4 * U;
  [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
    if (i === gap) return;
    blocks.push({ x: cx + (vert ? k * sp : 0), y: cy + (vert ? 0 : k * sp), a: ang + rnd(-0.15, 0.15) + (Math.random() < 0.5 ? 0 : Math.PI), r: 2 * U, ph: i });
  });
  radio('Roadblock ahead!', 1);
  return true;
}
function updateRoadblocks(dt) {
  blockT -= dt;
  if (blockT <= 0 && t > 25) blockT = spawnRoadblock() ? rnd(35, 55) : 2;
  for (const b of blocks) {
    if (state === 'play' && car.inv <= 0 && Math.hypot(car.x - b.x, car.y - b.y) < b.r + 1 * U) { if (!hitCar()) shove(b, 1 * U); }
  }
  blocks = blocks.filter(b => Math.hypot(b.x - car.x, b.y - car.y) < 260 * U);
}

// ---------- boat actions -> car actions ----------
function dash() {
  if (state !== 'play' || car.dashCd > 0) return;
  const C = CARS[save.car];
  car.dashT = 0.35; car.inv = Math.max(car.inv, 0.45); car.dashCd = C.dashCd * (1 - 0.12 * save.up.dash);
  splash(car.x, car.y); Sound.sfx('dash'); buzz(25);
  if (Math.random() < 0.4) radio('He is using nitro!');
}
function takePU(p) {
  Sound.sfx('power'); buzz(30); splash(p.x, p.y);
  const k = p.type;
  floaters.push({ x: p.x, y: p.y - 2 * U, text: PU_NAME[k], life: 1.2 });
  if (k === 'shield') car.shield = 6 + save.up.shield;
  else if (k === 'speed') speedT = 8;
  else if (k === 'magnet') magnetT = 10;
  else if (k === 'slow') slowT = 6;
  else if (k === 'fuel') car.fuel = Math.min(100, car.fuel + 45);
  else if (k === 'nitro') { car.dashCd = 0; speedT = Math.max(speedT, 2.5); }
  else if (k === 'repair') { if (car.hp < maxHp()) car.hp++; else car.shield = Math.max(car.shield, 4); }
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
    wTimer = rnd(12, 24);
    let nx = pick(['clear', 'rain', 'storm', 'fog', 'fog']); if (nx === wType) nx = 'clear';
    wNext = nx; wGoal = 0;
  }
  if (wNext !== null && wAmt <= 0.02) { wType = wNext; wNext = null; wGoal = wType === 'clear' ? 0 : 1; }
  wAmt += clamp(wGoal - wAmt, -0.4 * dt, 0.4 * dt);
}

function callBackup(h) {
  radio('Target spotted! Send units!', 1, h); Sound.sfx('warn'); buzz(40);
  const sa = rnd(0, TAU), dist = Math.hypot(W, H) / 2 + 4 * U;
  for (const type of ['patrol', 'moto']) {
    const a = sa + rnd(-0.5, 0.5), p = snapToRoad(car.x + Math.cos(a) * dist, car.y + Math.sin(a) * dist);
    enemies.push(makeEnemy(type, p.x, p.y, Math.atan2(car.y - p.y, car.x - p.x)));
  }
}
// ---------- random events (like the weather): a boss or a helicopter can show up at any moment ----------
function spawnHeli() {
  const sa = rnd(0, TAU), dist = Math.hypot(W, H) / 2 + 4 * U, n = Math.random() < 0.3 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const a = sa + i * 0.6, ne = makeEnemy('heli', car.x + Math.cos(a) * dist, car.y + Math.sin(a) * dist, a + Math.PI); enemies.push(ne);
    if (i === 0) radio(RADIO_NEW.heli, 1, ne);
  }
}
function updateEvents(dt) {
  bossT -= dt; evT -= dt;
  if (evT > 0) return;
  evT = rnd(8, 20);
  const roll = pick(['none', 'none', 'none', 'heli', 'heli', 'boss']);
  if (roll === 'heli' && enemies.filter(e => e.type === 'heli' && !e.dead).length < 2) spawnHeli();
  else if (roll === 'boss' && !boss && bossT <= 0) spawnBoss();
}

// ---------- storm: lightning, thunder and rain splashes on the road ----------
function updateStorm(dt) {
  if (isRain() && wAmt > 0.3 && lens.length < 16 && Math.random() < (wType === 'storm' ? 3 : 1.4) * wAmt * dt) { // droplets on the camera lens
    lens.push({ x: rnd(0.02, 0.98) * W, y: rnd(0.02, 0.98) * H, r: rnd(0.4, 1.1) * HU, life: rnd(3.5, 6), max: 6, slide: rnd(0, 1) < 0.35 ? rnd(2, 6) * HU : 0, hold: rnd(0.4, 1.5) });
  }
  if (isRain() && wAmt > 0.4) {
    lightT -= dt * (wType === 'storm' ? 1 : 0.35);
    if (lightT <= 0) { lightT = rnd(2.5, 6); lightning = 1; lightFlick = 0.14; thunderT = rnd(0.3, 1.3); }
    const n = (wType === 'storm' ? 28 : 12) * wAmt * dt + Math.random() * 0.5;
    for (let i = 0; i < n && rsplash.length < 90; i++) rsplash.push({ x: cam.x + W / 2 + rnd(-0.6, 0.6) * W / zoom, y: cam.y + H / 2 + rnd(-0.6, 0.6) * H / zoom, life: 0.45, max: 0.45 });
  }
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
  zoom += ((state === 'play' ? (car.dashT > 0 ? 0.8 : speedT > 0 ? 0.92 : 1) : 1) - zoom) * Math.min(1, (car.dashT > 0 ? 9 : 4) * dt);
  lightning = Math.max(0, lightning - dt * 4);
  if (lightFlick > 0) { lightFlick -= dt; if (lightFlick <= 0) lightning = 0.75; }
  if (thunderT > 0) { thunderT -= dt; if (thunderT <= 0) { thunderT = -1; Sound.sfx('thunder'); shake = Math.max(shake, 4); buzz(70); } }
  for (const d of lens) { d.life -= dt; d.hold -= dt; if (d.slide && d.hold < 0) { d.y += d.slide * dt; d.r *= 1 - 0.05 * dt; } }
  if (lens.length && lens.some(d => d.life <= 0)) lens = lens.filter(d => d.life > 0);
  for (const r of rsplash) r.life -= dt;
  if (rsplash.length && rsplash[0].life <= 0) rsplash = rsplash.filter(r => r.life > 0);
  for (const k of skids) k.life -= dt;
  if (skids.length && skids[0].life <= 0) skids = skids.filter(k => k.life > 0);
  for (const r of radioLog) { r.t -= dt; if (r.e && !r.e.dead) { r.x = r.e.x; r.y = r.e.y; } }
  if (radioLog.length && radioLog[0].t <= 0) radioLog = radioLog.filter(r => r.t > 0);
}

// ---------- main update ----------
function update(dt) {
  if (slowmoT > 0) { slowmoT -= dt; dt *= 0.3; } // cinematic slow-mo after a boss kill
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
  score = Math.floor(t) + runCoins + bonusPts;

  // steering + movement
  const turnRate = C.turn * (1 + 0.06 * save.up.turn);
  if (ptr.down) {
    const want = Math.atan2(ptr.y - sy(car.y), ptr.x - sx(car.x));
    car.a += clamp(angDiff(car.a, want), -turnRate * dt, turnRate * dt);
  }
  if (joy.active && Math.hypot(joy.dx, joy.dy) > 0.18) car.a += clamp(angDiff(car.a, Math.atan2(joy.dy, joy.dx)), -turnRate * dt, turnRate * dt);
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) car.a -= turnRate * dt;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) car.a += turnRate * dt;
  let drag = 1; if (car.dashT <= 0) for (const o of conesL) if (Math.hypot(car.x - o.x, car.y - o.y) < 2.2 * U) { drag = 0.55; break; }
  const bs = C.speed * (speedT > 0 ? 1.4 : 1) * (car.dashT > 0 ? 2.6 : 1) * (car.fuel <= 0 ? 0.35 : 1) * drag * U;
  const onOil = oilL.some(o => Math.hypot(car.x - o.x, car.y - o.y) < o.r);
  if (car.vx === undefined) { car.vx = Math.cos(car.a) * bs; car.vy = Math.sin(car.a) * bs; }
  const kv = Math.min(1, (onOil ? 0.15 : 18) * dt);
  car.vx += (Math.cos(car.a) * bs - car.vx) * kv; car.vy += (Math.sin(car.a) * bs - car.vy) * kv;
  car.px = car.x; car.py = car.y;
  car.x += car.vx * dt; car.y += car.vy * dt; car.onOil = onOil;
  car.fuel = Math.max(0, car.fuel - dt * (car.dashT > 0 ? 7 : 1.5));
  car.dry = car.fuel <= 0 ? car.dry + dt : 0;
  if (car.dry > 9) { floaters.push({ x: car.x, y: car.y - 3 * U, text: 'OUT OF FUEL', life: 1.4, rgb: '255,120,100' }); die(); return updateFx(dt); }
  if (car.fuel <= 25 && !car.lowWarned) { car.lowWarned = true; radio('He is running low on fuel!', 1); }
  if (car.fuel > 40) car.lowWarned = false;
  if (car.fuel <= 0 && !car.dryWarned) { car.dryWarned = true; radio('His tank is empty!', 1); }
  if (car.fuel > 0) car.dryWarned = false;
  pushTrail(car, dt, car.dashT > 0 ? 30 : 20);
  {
    const V = CARS[save.car], wet = isRain() && wAmt > 0.3, da = Math.abs(angDiff(car.a, car.pa === undefined ? car.a : car.pa)) / Math.max(dt, 1e-4);
    const hard = da > 2 || car.dashT > 0 || onOil;
    addSkid(car, hard || wet, V.len * U * 0.35, V.wid * U * 0.36, wet && !hard);
    car.pa = car.a;
  }
  foamT -= dt;
  if (foamT <= 0 && (car.dashT > 0 || speedT > 0 || onOil)) { foamT = 0.03; foam.push({ x: car.x - Math.cos(car.a) * 2.5 * U, y: car.y - Math.sin(car.a) * 2.5 * U, vx: rnd(-1, 1) * U, vy: rnd(-1, 1) * U, life: 0.5, max: 0.5, s: 0.7 * U }); }
  { const k = 1 - Math.exp(-8 * dt); cam.x += (car.x - W / 2 - cam.x) * k; cam.y += (car.y - H / 2 - cam.y) * k; }
  loadCells();

  // crashes: buildings always wreck you; other solid things are soaked up by armor / nitro
  if (hitBuilding(car.x, car.y, 1.5 * U)) {
    if (hitCar()) return updateFx(dt);
    car.x = car.px; car.y = car.py; car.a += Math.PI; car.vx = -car.vx * 0.6; car.vy = -car.vy * 0.6; // bounce back onto the road
    if (hitBuilding(car.x, car.y, 1.5 * U)) { die(); return updateFx(dt); }
  }
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
    if (d < 2.6 * U) { k.dead = true; destroyed.add(k.id); collectCoin(1); Sound.sfx('coin'); buzz(8); }
  }
  for (const k of billsL) {
    const d = Math.hypot(car.x - k.x, car.y - k.y);
    if (d < magR && d > 0.5) { k.x += (car.x - k.x) / d * 40 * U * dt; k.y += (car.y - k.y) / d * 40 * U * dt; }
    if (d < 2.6 * U) {
      k.dead = true; destroyed.add(k.id); collectCoin(5); Sound.sfx('bill'); buzz(15);
      floaters.push({ x: k.x, y: k.y - 2 * U, text: '+5', life: 1.1, rgb: '90,235,120' });
    }
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
  fuelT -= dt; // fuel cans show up ahead of you, more often as the tank runs down
  if (fuelT <= 0 && powerups.length < 4) {
    fuelT = rnd(5, 8) * (car.fuel < 35 ? 0.6 : car.fuel > 75 ? 1.8 : 1);
    if (car.fuel < 85 && !powerups.some(q => q.type === 'fuel')) {
      const a = car.a + rnd(-0.9, 0.9), d = rnd(26, 42) * U, p = snapToRoad(car.x + Math.cos(a) * d, car.y + Math.sin(a) * d);
      powerups.push({ x: p.x, y: p.y, type: 'fuel', life: 20 });
    }
  }

  // police
  spawnT -= edt;
  if (spawnT <= 0) { spawnT = spawnGap(); spawnEnemy(); if (intensity() > 1.1 && Math.random() < 0.3) spawnEnemy(); }
  updateEvents(dt);
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
      if (hitCar()) break;
      killEnemy(e, 'shield');
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
  updateRadio(dt);
  updateRoadblocks(dt);
  updateStorm(dt);
  updateFx(dt);
  // sound: engine + siren that grows as the cops close in
  Sound.engine(car.dashT > 0 ? 70 : 30); Sound.setMood(boss ? 'boss' : 'calm');
  let near = 1e9; for (const e of enemies) near = Math.min(near, Math.hypot(e.x - car.x, e.y - car.y));
  Sound.siren(enemies.length ? clamp(1 - near / (90 * U), 0, 1) : 0);
}
