// ---------- input + main loop ----------
const ptr = { down: false, x: 0, y: 0, id: null };
const keys = {};
const inCircle = (x, y, c, k = 1.25) => Math.hypot(x - c.x, y - c.y) < c.r * k;

function pauseGame() { if (state !== 'play') return; state = 'pause'; Sound.music(false); Sound.engine(0); Sound.siren(0); showPanel('pause'); }
function resumeGame() { if (state !== 'pause') return; state = 'play'; showPanel(null); Sound.music(true); last = performance.now(); }

cv.addEventListener('pointerdown', e => {
  Sound.init();
  if (state !== 'play') return;
  const b = btns();
  if (inCircle(e.clientX, e.clientY, b.pause)) return pauseGame();
  if (inCircle(e.clientX, e.clientY, b.dash)) return dash();
  ptr.id = e.pointerId; ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY;
});
cv.addEventListener('pointermove', e => { if (ptr.down && e.pointerId === ptr.id) { ptr.x = e.clientX; ptr.y = e.clientY; } });
const release = e => { if (e.pointerId === ptr.id) ptr.down = false; };
window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);

window.addEventListener('keydown', e => {
  keys[e.key] = true; Sound.init();
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
