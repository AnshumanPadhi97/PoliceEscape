// ---------- canvas + helpers ----------
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W, H, U, DPR;
let HU = 5.2;                                   // HUD unit: like U, but never smaller than a readable size on phones
const SAFE = { t: 0, r: 0, b: 0, l: 0 };        // screen insets (notch, rounded corners, system bars) in px
const TOUCH = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window;
function readSafe() {
  const el = document.getElementById('sai');
  if (el) { const cs = getComputedStyle(el); SAFE.t = parseFloat(cs.paddingTop) || 0; SAFE.r = parseFloat(cs.paddingRight) || 0; SAFE.b = parseFloat(cs.paddingBottom) || 0; SAFE.l = parseFloat(cs.paddingLeft) || 0; }
  if (TOUCH) { SAFE.t = Math.max(SAFE.t, 24); SAFE.b = Math.max(SAFE.b, 16); SAFE.l = Math.max(SAFE.l, 8); SAFE.r = Math.max(SAFE.r, 8); }
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  U = Math.min(W, H) / 100; // base unit
  HU = Math.max(U, 5.2); readSafe();
}
window.addEventListener('resize', resize); resize();

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hash2(a, b, s = 0) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function mulberry(s) {
  return () => { s = (s + 0x6D2B79F5) | 0; let z = Math.imul(s ^ (s >>> 15), 1 | s); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };
}
function dailySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function buzz(ms) { try { if (save.settings.haptics && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

window.addEventListener('contextmenu', e => e.preventDefault()); // no long-press menu on phones
