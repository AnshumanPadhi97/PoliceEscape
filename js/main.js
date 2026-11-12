// ---------- input + main loop ----------
const ptr = { down: false, x: 0, y: 0, id: null };
const keys = {};
const inCircle = (x, y, c, k = 1.25) => Math.hypot(x - c.x, y - c.y) < c.r * k;

function pauseGame() { joy.active = false; joy.dx = joy.dy = 0; if (state !== 'play') return; state = 'pause'; Sound.engine(0); Sound.siren(0); showPanel('pause'); }
function resumeGame() { if (state !== 'pause') return; state = 'play'; showPanel(null); Sound.music(true); last = performance.now(); }

const JOY_R = () => 11 * HU;
const joyHome = () => ({ x: SAFE.l + 17 * HU, y: H - SAFE.b - 17 * HU });
cv.addEventListener('pointerdown', e => {
  Sound.init();
  touchUI = e.pointerType === 'touch';
  if (state !== 'play') return;
  const b = btns();
  if (inCircle(e.clientX, e.clientY, b.pause)) return pauseGame();
  if (inCircle(e.clientX, e.clientY, b.dash)) return dash();
  if (touchUI) { // left side of the screen: floating joystick
    if (joy.active || e.clientX > W * 0.62) return;
    joy.active = true; joy.id = e.pointerId; joy.bx = joy.x = e.clientX; joy.by = joy.y = e.clientY; joy.dx = joy.dy = 0;
    return;
  }
  ptr.id = e.pointerId; ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY;
});
cv.addEventListener('pointermove', e => {
  if (joy.active && e.pointerId === joy.id) {
    let dx = e.clientX - joy.bx, dy = e.clientY - joy.by; const R = JOY_R(), m = Math.hypot(dx, dy);
    if (m > R) { dx = dx / m * R; dy = dy / m * R; }
    joy.x = joy.bx + dx; joy.y = joy.by + dy; joy.dx = dx / R; joy.dy = dy / R;
  } else if (ptr.down && e.pointerId === ptr.id) { ptr.x = e.clientX; ptr.y = e.clientY; }
});
const release = e => { if (e.pointerId === ptr.id) ptr.down = false; if (e.pointerId === joy.id) { joy.active = false; joy.dx = joy.dy = 0; } };
window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);

window.addEventListener('keydown', e => {
  keys[e.key] = true; Sound.init(); touchUI = false;
  const k = e.key.toLowerCase();
  if (state === 'play') {
    if (e.key === ' ' || e.key === 'Shift') { dash(); e.preventDefault(); }
    else if (k === 'p' || e.key === 'Escape') pauseGame();
  } else if (state === 'pause') {
    if (k === 'p' || e.key === 'Escape') resumeGame();
  } else if (e.key === 'Enter' || e.key === ' ') {
    if (panel === 'menu') start(false); else if (panel === 'over') start(false);
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { ptr.down = false; pauseGame(); } }); // Android: app sent to background
window.addEventListener('blur', () => { ptr.down = false; for (const k in keys) keys[k] = false; pauseGame(); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(frame);
}
function sizeCity() { CELL = 64 * U; ROAD = 16 * U; }
sizeCity(); window.addEventListener('resize', () => { if (state === 'menu') { sizeCity(); cells = new Map(); } });
loadCells(); showPanel('menu');
requestAnimationFrame(frame);

['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault())); // no pinch-zoom
