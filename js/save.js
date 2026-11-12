// ---------- persistent save + shop data ----------
const CARS = {
  hatch:  { kind: 'car', name: 'Hatchback',  cost: 0,   speed: 30, turn: 3.4, dashCd: 3,   desc: 'Balanced. Tight turns.' },
  muscle: { kind: 'car', name: 'Muscle Car', cost: 150, speed: 38, turn: 2.5, dashCd: 3,   desc: 'Fast, but wide turns.' },
  coupe:  { kind: 'car', name: 'Getaway Coupe', cost: 300, speed: 34, turn: 3.0, dashCd: 1.9, desc: 'Quick nitro recharge.' },
  scooter:   { kind: 'bike', name: 'Scooter',    cost: 100, speed: 28, turn: 4.2, dashCd: 3,   desc: 'Slow, but turns on a dime.' },
  sportbike: { kind: 'bike', name: 'Sport Bike', cost: 220, speed: 42, turn: 2.8, dashCd: 3,   desc: 'Very fast, wide turns.' },
  dirtbike:  { kind: 'bike', name: 'Dirt Bike',  cost: 320, speed: 34, turn: 3.4, dashCd: 1.9, desc: 'Quick nitro recharge.' },
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
