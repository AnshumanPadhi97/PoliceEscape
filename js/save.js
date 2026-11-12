// ---------- persistent save + shop data ----------
// col/len/wid/stripe/roof drive the in-game look and the shop preview; armor = seconds of shield at the start of a run
const CARS = {
  hatch:  { kind: 'car', name: 'Hatchback',  cost: 0,   speed: 30, turn: 3.4, dashCd: 3,   desc: 'Balanced. Tight turns.', col: '#e8b020', len: 4.6, wid: 2.2 },
  van:    { kind: 'car', name: 'Cargo Van',  cost: 200, speed: 26, turn: 2.9, dashCd: 3,   armor: 4, desc: 'Slow, but starts armored.', col: '#e6e9ee', len: 5.6, wid: 2.6, roof: '#b9c0cc' },
  jeep:   { kind: 'car', name: 'Off-Roader', cost: 250, speed: 33, turn: 3.2, dashCd: 2.3, desc: 'Rugged. Fast nitro recharge.', col: '#5e8c3a', len: 4.4, wid: 2.4, roof: '#3f6226' },
  muscle: { kind: 'car', name: 'Muscle Car', cost: 150, speed: 38, turn: 2.5, dashCd: 3,   desc: 'Fast, but wide turns.', col: '#d02a2a', len: 5.2, wid: 2.5, stripe: '#fff' },
  coupe:  { kind: 'car', name: 'Getaway Coupe', cost: 300, speed: 34, turn: 3.0, dashCd: 1.9, desc: 'Quick nitro recharge.', col: '#1faa88', len: 4.6, wid: 2.2, roof: '#0d6a55' },
  hyper:  { kind: 'car', name: 'Hyper GT',   cost: 700, speed: 48, turn: 2.2, dashCd: 3.4, desc: 'Fastest car. Hard to steer.', col: '#7a3be0', len: 5.0, wid: 2.1, stripe: '#f4e9ff' },
  scooter:   { kind: 'bike', name: 'Scooter',    cost: 100, speed: 28, turn: 4.2, dashCd: 3,   desc: 'Slow, but turns on a dime.', col: '#e8e0d0', len: 3.4, wid: 1.1 },
  sportbike: { kind: 'bike', name: 'Sport Bike', cost: 220, speed: 42, turn: 2.8, dashCd: 3,   desc: 'Very fast, wide turns.', col: '#d02a8a', len: 3.4, wid: 1.1 },
  dirtbike:  { kind: 'bike', name: 'Dirt Bike',  cost: 320, speed: 34, turn: 3.4, dashCd: 1.9, desc: 'Quick nitro recharge.', col: '#e8701a', len: 3.4, wid: 1.1 },
  chopper:   { kind: 'bike', name: 'Chopper',    cost: 450, speed: 40, turn: 2.6, dashCd: 2.2, armor: 2, desc: 'Cruiser. Quick nitro, light armor.', col: '#2a2a32', len: 4.2, wid: 1.3 },
};
const UPGRADES = {
  shield: { name: 'Armor time',  desc: '+1s armor per level' },
  turn:   { name: 'Handling',    desc: '+6% turn rate per level' },
  magnet: { name: 'Cash magnet', desc: 'Pulls cash from further' },
  dash:   { name: 'Nitro recharge', desc: '-12% cooldown per level' },
};
const UP_MAX = 5, UP_COST = [40, 90, 160, 250, 360];

const DEFAULT_SAVE = {
  best: 0, coins: 0,
  up: { shield: 0, turn: 0, magnet: 0, dash: 0 },
  car: 'hatch', owned: { hatch: true },
  stats: { kills: 0, boss: 0, maxTime: 0, maxScore: 0, runs: 0, coins: 0 },
  settings: { sound: true, music: true, haptics: true },
};
function deepMerge(dst, src) {
  for (const k in src) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object') deepMerge(dst[k], src[k]);
    else dst[k] = src[k];
  }
  return dst;
}
function loadSave() {
  const s = JSON.parse(JSON.stringify(DEFAULT_SAVE));
  try { const raw = localStorage.getItem('policeSave'); if (raw) deepMerge(s, JSON.parse(raw)); } catch (e) {}
  return s;
}
let save = loadSave();
function persist() { try { localStorage.setItem('policeSave', JSON.stringify(save)); } catch (e) {} }
function evt(name, n = 1, mode = 'add') {
  const st = save.stats;
  if (name === 'kill') st.kills += n;
  else if (name === 'boss') st.boss += n;
  else if (name === 'coin') st.coins += n;
  else if (name === 'survive') st.maxTime = Math.max(st.maxTime, n);
}
