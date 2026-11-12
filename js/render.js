function drawTrail(o, color, width) {
  if (!o.trail || o.trail.length < 2) return;
  ctx.lineCap = 'round';
  for (let i = 1; i < o.trail.length; i++) {
    ctx.strokeStyle = color.replace('A', (i / o.trail.length * 0.45).toFixed(2));
    ctx.lineWidth = width * (i / o.trail.length);
    ctx.beginPath(); ctx.moveTo(o.trail[i - 1].x, o.trail[i - 1].y); ctx.lineTo(o.trail[i].x, o.trail[i].y); ctx.stroke();
  }
}
// ---------- drawing ----------
let tmNow = 0;
const rrect = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };

// generic top-down car, facing +x
function carSprite(x, y, a, L, Wd, body, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(-L / 2 + 0.4 * U, -Wd / 2 + 0.5 * U, L, Wd, 0.8 * U); ctx.fill();
  ctx.fillStyle = body; rrect(-L / 2, -Wd / 2, L, Wd, 0.8 * U); ctx.fill();
  if (o.stripe) { ctx.fillStyle = o.stripe; ctx.fillRect(-L * 0.4, -Wd / 2, L * 0.8, Wd * 0.2); ctx.fillRect(-L * 0.4, Wd / 2 - Wd * 0.2, L * 0.8, Wd * 0.2); }
  ctx.fillStyle = o.glass || '#17222f'; rrect(-L * 0.2, -Wd / 2 + 0.35 * U, L * 0.42, Wd - 0.7 * U, 0.5 * U); ctx.fill();
  if (o.roof) { ctx.fillStyle = o.roof; rrect(-L * 0.12, -Wd / 2 + 0.55 * U, L * 0.26, Wd - 1.1 * U, 0.4 * U); ctx.fill(); }
  ctx.fillStyle = o.dark ? 'rgba(0,0,0,0)' : '#ffefa8'; if (!o.dark) { ctx.fillRect(L / 2 - 0.6 * U, -Wd / 2 + 0.2 * U, 0.6 * U, 0.5 * U); ctx.fillRect(L / 2 - 0.6 * U, Wd / 2 - 0.7 * U, 0.6 * U, 0.5 * U); }
  ctx.fillStyle = '#c0242a'; ctx.fillRect(-L / 2, -Wd / 2 + 0.2 * U, 0.4 * U, 0.5 * U); ctx.fillRect(-L / 2, Wd / 2 - 0.7 * U, 0.4 * U, 0.5 * U);
  if (o.bar) { // flashing light bar
    const f = Math.floor(tmNow * 8 + (o.ph || 0)) % 2;
    ctx.fillStyle = f ? '#ff2a2a' : '#5a1010'; ctx.fillRect(-0.5 * U, -Wd / 2 + 0.4 * U, 1 * U, (Wd - 0.8 * U) / 2);
    ctx.fillStyle = f ? '#102060' : '#3a6aff'; ctx.fillRect(-0.5 * U, 0, 1 * U, (Wd - 0.8 * U) / 2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 5 * U); g.addColorStop(0, f ? 'rgba(255,40,40,.4)' : 'rgba(60,110,255,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 5 * U, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
const hsl = (h, s = 55, l = 50) => `hsl(${h},${s}%,${l}%)`;

function drawPlayer() {
  const C = car, flick = C.inv > 0 && Math.floor(tmNow * 18) % 2 === 0;
  if (flick && C.dashT <= 0) return;
  const V = CARS[save.car], col = V.col, isBike = V.kind === 'bike', L = V.len * U, Wd = V.wid * U;
  if (C.dashT > 0) { // nitro flames
    ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(C.a);
    ctx.fillStyle = 'rgba(80,170,255,.85)'; ctx.beginPath(); ctx.moveTo(-L / 2, -0.8 * U); ctx.lineTo(-L / 2 - rnd(4, 7) * U, 0); ctx.lineTo(-L / 2, 0.8 * U); ctx.fill(); ctx.restore();
  }
  if (isBike) drawBike(C.x, C.y, C.a, L, Wd, col);
  else carSprite(C.x, C.y, C.a, L, Wd, col, { stripe: V.stripe || null, roof: V.roof || null });
  if (C.shield > 0) {
    ctx.strokeStyle = `rgba(138,180,255,${C.shield < 1.5 && Math.floor(tmNow * 8) % 2 ? 0.3 : 0.9})`; ctx.fillStyle = 'rgba(138,180,255,.16)'; ctx.lineWidth = 0.4 * U;
    ctx.beginPath(); ctx.arc(C.x, C.y, 3.8 * U, 0, TAU); ctx.fill(); ctx.stroke();
  }
}

function drawBike(x, y, a, L, Wd, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(-L / 2 + 0.3 * U, -Wd / 2 + 0.4 * U, L, Wd, 0.5 * U); ctx.fill();
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-L / 2, -0.3 * U, 0.9 * U, 0.6 * U); ctx.fillRect(L / 2 - 0.9 * U, -0.3 * U, 0.9 * U, 0.6 * U); // wheels
  ctx.fillStyle = col; rrect(-L / 2 + 0.5 * U, -Wd / 2, L - 1 * U, Wd, 0.5 * U); ctx.fill();
  ctx.fillStyle = '#222'; ctx.fillRect(L / 2 - 1.3 * U, -Wd / 2 - 0.5 * U, 0.4 * U, Wd + 1 * U); // handlebars
  ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.arc(-0.2 * U, 0, 0.6 * U, 0, TAU); ctx.fill(); // rider
  ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.arc(0.1 * U, 0, 0.45 * U, 0, TAU); ctx.fill(); // helmet
  ctx.fillStyle = '#ffefa8'; ctx.fillRect(L / 2 - 0.2 * U, -0.2 * U, 0.3 * U, 0.4 * U);
  ctx.restore();
}
function drawEnemy(e, tm) {
  const f = e.flash > 0 && Math.floor(tm * 20) % 2 === 0;
  switch (e.type) {
    case 'patrol': carSprite(e.x, e.y, e.a, 4.6 * U, 2.2 * U, '#eef0f4', { stripe: '#14161c', bar: true, ph: e.age * 0 }); break;
    case 'swat': {
      carSprite(e.x, e.y, e.a, 6.2 * U, 2.9 * U, '#2a2e3a', { bar: true, ph: 0, glass: '#0d1118', stripe: '#d7a600' });
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(car.y - e.y, car.x - e.x)); ctx.fillStyle = '#111'; ctx.fillRect(0, -0.25 * U, 3 * U, 0.5 * U); ctx.beginPath(); ctx.arc(0, 0, 0.9 * U, 0, TAU); ctx.fill(); ctx.restore();
      break;
    }
    case 'moto': case 'chopper': case 'gunbike': {
      const col = { moto: '#2a3a5a', chopper: '#eef0f4', gunbike: '#2a2e3a' }[e.type], big = e.type === 'chopper' ? 1.25 : 1;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a); ctx.scale(big, big);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-1.5 * U + 0.3 * U, -0.5 * U + 0.4 * U, 3 * U, 1 * U);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-1.6 * U, -0.3 * U, 0.8 * U, 0.6 * U); ctx.fillRect(0.8 * U, -0.3 * U, 0.8 * U, 0.6 * U);
      ctx.fillStyle = col; rrect(-1.3 * U, -0.5 * U, 2.6 * U, 1 * U, 0.5 * U); ctx.fill();
      if (e.type === 'chopper') { ctx.fillStyle = '#14161c'; ctx.fillRect(-0.9 * U, -0.5 * U, 1.8 * U, 0.25 * U); ctx.fillRect(-0.9 * U, 0.25 * U, 1.8 * U, 0.25 * U); }
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(-0.2 * U, 0, 0.7 * U, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f0c8a0'; ctx.beginPath(); ctx.arc(0, 0, 0.45 * U, 0, TAU); ctx.fill();
      ctx.fillStyle = Math.floor(tm * 9) % 2 ? '#ff2a2a' : '#3a6aff'; ctx.beginPath(); ctx.arc(-1.2 * U, 0, 0.35 * U, 0, TAU); ctx.fill();
      ctx.restore();
      if (e.type === 'gunbike') { ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(car.y - e.y, car.x - e.x)); ctx.fillStyle = '#111'; ctx.fillRect(0, -0.2 * U, 2.4 * U, 0.4 * U); ctx.restore(); }
      break;
    }
    case 'interceptor': {
      if (e.ph === 1) { // charge warning line
        ctx.strokeStyle = Math.floor(tm * 12) % 2 ? 'rgba(255,50,50,.9)' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.2 * U; ctx.setLineDash([2 * U, 1.5 * U]);
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.aim) * 70 * U, e.y + Math.sin(e.aim) * 70 * U); ctx.stroke(); ctx.setLineDash([]);
      }
      carSprite(e.x, e.y, e.a, 4.8 * U, 2.1 * U, '#2c5fd0', { stripe: '#eef0f4', bar: true, ph: 1, glass: '#0b1a33' });
      break;
    }
    case 'truck': {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(-6.4 * U + 0.4 * U, -2.7 * U + 0.5 * U, 12.4 * U, 5.4 * U, 0.8 * U); ctx.fill();
      ctx.fillStyle = f ? '#fff' : '#2f4f7a'; rrect(-6.4 * U, -2.7 * U, 8.6 * U, 5.4 * U, 0.6 * U); ctx.fill();
      ctx.fillStyle = f ? '#fff' : '#223a5c'; ctx.fillRect(-5.6 * U, -0.2 * U, 6.8 * U, 0.4 * U);
      ctx.fillStyle = f ? '#fff' : '#e8ecf2'; rrect(2.4 * U, -2.5 * U, 3.6 * U, 5 * U, 0.8 * U); ctx.fill();
      ctx.fillStyle = '#17222f'; rrect(4.2 * U, -2 * U, 1.4 * U, 4 * U, 0.4 * U); ctx.fill();
      const fl = Math.floor(tm * 8) % 2;
      ctx.fillStyle = fl ? '#ff2a2a' : '#5a1010'; ctx.fillRect(2.9 * U, -2 * U, 0.9 * U, 1.9 * U);
      ctx.fillStyle = fl ? '#102060' : '#3a6aff'; ctx.fillRect(2.9 * U, 0.1 * U, 0.9 * U, 1.9 * U);
      ctx.restore();
      break;
    }
    case 'apc': {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(-3.8 * U + 0.4 * U, -2.4 * U + 0.5 * U, 7.6 * U, 4.8 * U, 0.8 * U); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; for (const k of [-2.4, 0, 2.4]) { ctx.fillRect((k - 0.7) * U, -2.8 * U, 1.4 * U, 0.8 * U); ctx.fillRect((k - 0.7) * U, 2 * U, 1.4 * U, 0.8 * U); }
      ctx.fillStyle = f ? '#fff' : '#4a5a3a'; rrect(-3.8 * U, -2.3 * U, 7.6 * U, 4.6 * U, 0.8 * U); ctx.fill();
      ctx.fillStyle = f ? '#fff' : '#3a4830'; ctx.fillRect(-3.4 * U, -1.8 * U, 2 * U, 3.6 * U);
      ctx.fillStyle = '#17222f'; ctx.fillRect(2.4 * U, -1.6 * U, 1 * U, 3.2 * U);
      ctx.restore();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(car.y - e.y, car.x - e.x));
      ctx.fillStyle = f ? '#fff' : '#5d6e49'; ctx.beginPath(); ctx.arc(0, 0, 1.3 * U, 0, TAU); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(0, -0.3 * U, 3.4 * U, 0.6 * U);
      ctx.fillStyle = Math.floor(tm * 8) % 2 ? '#ff2a2a' : '#3a6aff'; ctx.beginPath(); ctx.arc(-0.4 * U, 0, 0.35 * U, 0, TAU); ctx.fill();
      ctx.restore();
      break;
    }
    case 'spiker': carSprite(e.x, e.y, e.a, 5.2 * U, 2.5 * U, '#43302c', { stripe: '#ff9a2a', bar: true, ph: 0 }); break;
    case 'heli': {
      ctx.save(); ctx.translate(e.x + 2.5 * U, e.y + 3.5 * U); ctx.rotate(e.a); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 3.4 * U, 1.3 * U, 0, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
      ctx.fillStyle = '#1c2b4a'; ctx.fillRect(-6 * U, -0.3 * U, 4 * U, 0.6 * U);
      ctx.fillStyle = '#26406e'; ctx.beginPath(); ctx.ellipse(0, 0, 3 * U, 1.4 * U, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9fd0ff'; ctx.beginPath(); ctx.ellipse(1.4 * U, 0, 1.1 * U, 0.9 * U, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = Math.floor(tm * 7) % 2 ? '#ff2a2a' : '#3a6aff'; ctx.beginPath(); ctx.arc(-0.5 * U, 0, 0.45 * U, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(tm * 22); ctx.strokeStyle = 'rgba(230,240,255,.55)'; ctx.lineWidth = 0.35 * U;
      ctx.beginPath(); ctx.moveTo(-6.5 * U, 0); ctx.lineTo(6.5 * U, 0); ctx.moveTo(0, -6.5 * U); ctx.lineTo(0, 6.5 * U); ctx.stroke(); ctx.restore();
      break;
    }
    case 'tank': {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
      ctx.fillStyle = f ? '#fff' : '#3a4030'; rrect(-6.5 * U, -4.4 * U, 13 * U, 8.8 * U, 1 * U); ctx.fill();
      ctx.fillStyle = '#1d211a'; ctx.fillRect(-6.5 * U, -5 * U, 13 * U, 1.8 * U); ctx.fillRect(-6.5 * U, 3.2 * U, 13 * U, 1.8 * U);
      ctx.fillStyle = f ? '#fff' : '#566049'; rrect(-4 * U, -3 * U, 8 * U, 6 * U, 1 * U); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(car.y - e.y, car.x - e.x));
      ctx.fillStyle = f ? '#fff' : '#6a7658'; ctx.beginPath(); ctx.arc(0, 0, 2.6 * U, 0, TAU); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(0, -0.5 * U, 7 * U, 1 * U); ctx.restore();
      break;
    }
    case 'dozer': {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
      ctx.fillStyle = f ? '#fff' : '#e0a800'; rrect(-5 * U, -3.5 * U, 9 * U, 7 * U, 0.8 * U); ctx.fill();
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-5 * U, -4.3 * U, 10 * U, 1.2 * U); ctx.fillRect(-5 * U, 3.1 * U, 10 * U, 1.2 * U);
      ctx.fillStyle = f ? '#fff' : '#8a8a92'; ctx.fillRect(4 * U, -6 * U, 2.2 * U, 12 * U);
      ctx.fillStyle = '#17222f'; rrect(-2.5 * U, -2 * U, 3.5 * U, 4 * U, 0.5 * U); ctx.fill();
      ctx.fillStyle = Math.floor(tm * 8) % 2 ? '#ff2a2a' : '#3a6aff'; ctx.fillRect(-1.2 * U, -0.6 * U, 1 * U, 1.2 * U);
      ctx.restore(); break;
    }
  }
}

function drawTraffic(o, tm) {
  const V = VEH[o.kind], L = V.L * U, Wd = V.W * U, col = hsl(o.hue, 45, 48);
  switch (o.kind) {
    case 'taxi': carSprite(o.x, o.y, o.a, L, Wd, '#f2c21b', { stripe: '#222', roof: '#f2c21b' }); break;
    case 'ambulance': {
      carSprite(o.x, o.y, o.a, L, Wd, '#f4f4f4', { stripe: '#d02a2a', bar: true, ph: 1 });
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); ctx.fillStyle = '#d02a2a'; ctx.fillRect(-1.6 * U, -0.25 * U, 1.2 * U, 0.5 * U); ctx.fillRect(-1.25 * U, -0.6 * U, 0.5 * U, 1.2 * U); ctx.restore(); break;
    }
    case 'bus': case 'truck': {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(-L / 2 + 0.4 * U, -Wd / 2 + 0.5 * U, L, Wd, 0.8 * U); ctx.fill();
      if (o.kind === 'bus') {
        ctx.fillStyle = o.hue % 2 ? '#2e8b57' : '#2a6fb0'; rrect(-L / 2, -Wd / 2, L, Wd, 0.8 * U); ctx.fill();
        ctx.fillStyle = '#d8ecf5'; for (let k = 0; k < 6; k++) ctx.fillRect(-L / 2 + 1 * U + k * 1.35 * U, -Wd / 2 + 0.3 * U, 1 * U, Wd - 0.6 * U);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-L / 2 + 0.6 * U, -0.2 * U, L - 1.2 * U, 0.4 * U);
      } else {
        ctx.fillStyle = col; rrect(L / 2 - 2.6 * U, -Wd / 2, 2.6 * U, Wd, 0.6 * U); ctx.fill(); // cab
        ctx.fillStyle = '#17222f'; ctx.fillRect(L / 2 - 1 * U, -Wd / 2 + 0.3 * U, 0.7 * U, Wd - 0.6 * U);
        ctx.fillStyle = '#d9d9de'; rrect(-L / 2, -Wd / 2 + 0.1 * U, L - 2.9 * U, Wd - 0.2 * U, 0.3 * U); ctx.fill(); // cargo box
        ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 0.2 * U; ctx.strokeRect(-L / 2, -Wd / 2 + 0.1 * U, L - 2.9 * U, Wd - 0.2 * U);
      }
      ctx.fillStyle = '#ffefa8'; ctx.fillRect(L / 2 - 0.4 * U, -Wd / 2 + 0.2 * U, 0.4 * U, 0.5 * U); ctx.fillRect(L / 2 - 0.4 * U, Wd / 2 - 0.7 * U, 0.4 * U, 0.5 * U);
      ctx.fillStyle = '#c0242a'; ctx.fillRect(-L / 2, -Wd / 2 + 0.2 * U, 0.4 * U, 0.5 * U); ctx.fillRect(-L / 2, Wd / 2 - 0.7 * U, 0.4 * U, 0.5 * U);
      ctx.restore(); break;
    }
    case 'bike': drawBike(o.x, o.y, o.a, L, Wd, col); break;
    default: carSprite(o.x, o.y, o.a, L, Wd, col, { dark: false });
  }
}
function drawPed(p, tm) {
  const run = p.run, moving = run || (p.spd || 0) > 1.2 * U, sw = moving ? Math.sin(tm * (run ? 17 : 9) + p.ph) * (run ? 0.6 : 0.4) * U : 0;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang || 0);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0.2 * U, 0.3 * U, 0.9 * U, 0.95 * U, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = p.pants; // legs / feet swing back and forth
  ctx.beginPath(); ctx.ellipse(sw, -0.32 * U, 0.42 * U, 0.26 * U, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-sw, 0.32 * U, 0.42 * U, 0.26 * U, 0, 0, TAU); ctx.fill();
  if (p.bag) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-0.85 * U, -0.45 * U, 0.7 * U, 0.9 * U); }
  ctx.fillStyle = p.skin; // arms swing opposite to the legs
  ctx.beginPath(); ctx.arc(-sw * 0.8, -0.85 * U, 0.2 * U, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(sw * 0.8, 0.85 * U, 0.2 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = hsl(p.hue, 55, 45); // shirt with sleeves
  ctx.beginPath(); ctx.ellipse(0, 0, 0.42 * U, 0.82 * U, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(0.08 * U, 0, 0.2 * U, 0.5 * U, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0.1 * U, 0, 0.44 * U, 0, TAU); ctx.fill(); // head
  ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(-0.02 * U, 0, 0.46 * U, Math.PI * 0.5, Math.PI * 1.5); ctx.fill(); // hair covers the back of the head
  if (p.hat) { ctx.fillStyle = hsl((p.hue + 180) % 360, 50, 35); ctx.beginPath(); ctx.arc(0, 0, 0.5 * U, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(-0.05 * U, -0.1 * U, 0.25 * U, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawParked(o) { carSprite(o.x, o.y, o.a, 4.2 * U, 2.1 * U, hsl(o.hue, 35, 42), { dark: true }); }
function drawTree(o, tm) {
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.arc(o.x + 0.8 * U, o.y + 1 * U, o.r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2f6b34'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3f8a43'; ctx.beginPath(); ctx.arc(o.x - o.r * 0.2, o.y - o.r * 0.2, o.r * 0.65, 0, TAU); ctx.fill();
}
function drawBarrel(m, tm) {
  const p = 0.5 + 0.5 * Math.sin(tm * 5 + m.ph);
  ctx.fillStyle = `rgba(255,80,40,${(0.12 + 0.12 * p).toFixed(2)})`; ctx.beginPath(); ctx.arc(m.x, m.y, 3.2 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(m.x + 0.4 * U, m.y + 0.5 * U, 1.6 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8362b'; ctx.beginPath(); ctx.arc(m.x, m.y, 1.6 * U, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7a1a14'; ctx.lineWidth = 0.3 * U; ctx.beginPath(); ctx.arc(m.x, m.y, 1.1 * U, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.moveTo(m.x, m.y - 0.8 * U); ctx.lineTo(m.x + 0.6 * U, m.y + 0.5 * U); ctx.lineTo(m.x - 0.6 * U, m.y + 0.5 * U); ctx.fill();
}
function drawOil(o, tm) {
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
  g.addColorStop(0, 'rgba(8,8,16,.85)'); g.addColorStop(0.7, 'rgba(20,20,40,.7)'); g.addColorStop(1, 'rgba(20,20,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.75, o.seed, 0, TAU); ctx.fill();
  ctx.strokeStyle = `hsla(${(tm * 40 + o.seed * 50) % 360},70%,60%,.25)`; ctx.lineWidth = 0.4 * U; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r * 0.6, o.r * 0.42, o.seed, 0, TAU); ctx.stroke();
}
function drawCone(o) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(o.x + 0.3 * U, o.y + 0.4 * U, 0.9 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(o.x, o.y, 0.9 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x, o.y, 0.5 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(o.x, o.y, 0.22 * U, 0, TAU); ctx.fill();
}
function drawStrip(s, hostile) {
  ctx.fillStyle = hostile ? '#5a4030' : '#3a3d44'; ctx.fillRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
  ctx.fillStyle = '#d8dce6'; const horiz = s.w > s.h, n = 7;
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n;
    ctx.beginPath();
    if (horiz) { const x = s.x - s.w / 2 + f * s.w; ctx.moveTo(x - 0.5 * U, s.y + s.h / 2); ctx.lineTo(x, s.y - s.h / 2 - 0.4 * U); ctx.lineTo(x + 0.5 * U, s.y + s.h / 2); }
    else { const y = s.y - s.h / 2 + f * s.h; ctx.moveTo(s.x + s.w / 2, y - 0.5 * U); ctx.lineTo(s.x - s.w / 2 - 0.4 * U, y); ctx.lineTo(s.x + s.w / 2, y + 0.5 * U); }
    ctx.fill();
  }
}
function drawCash(k, tm) {
  const y = k.y + Math.sin(tm * 4 + k.x) * 0.3 * U;
  ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(k.x, y, 1.1 * U, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c99a10'; ctx.lineWidth = 0.25 * U; ctx.stroke();
  ctx.fillStyle = '#a97a00'; ctx.font = `bold ${1.5 * U}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', k.x, y + 0.1 * U); ctx.textBaseline = 'alphabetic';
}
function drawBill(k, tm) {
  const y = k.y + Math.sin(tm * 4 + k.x) * 0.3 * U;
  ctx.save(); ctx.translate(k.x, y); ctx.rotate(Math.sin(tm * 2 + k.y) * 0.25);
  ctx.fillStyle = 'rgba(80,255,130,.18)'; ctx.beginPath(); ctx.arc(0, 0, 2.3 * U, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2fbf5b'; rrect(-1.6 * U, -0.95 * U, 3.2 * U, 1.9 * U, 0.3 * U); ctx.fill();
  ctx.strokeStyle = '#a8f5bf'; ctx.lineWidth = 0.18 * U; rrect(-1.35 * U, -0.72 * U, 2.7 * U, 1.44 * U, 0.2 * U); ctx.stroke();
  ctx.fillStyle = '#eafff0'; ctx.font = `bold ${1.5 * U}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 0.08 * U); ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
function drawPowerup(p, tm) {
  const d = PU[p.type], s = 1 + Math.sin(tm * 5) * 0.1, fade = p.life < 3 && Math.floor(p.life * 6) % 2 === 0 ? 0.4 : 1;
  ctx.globalAlpha = fade;
  ctx.fillStyle = d.col + '40'; ctx.beginPath(); ctx.arc(p.x, p.y, 3.6 * U * s, 0, TAU); ctx.fill();
  ctx.strokeStyle = d.col; ctx.lineWidth = 0.4 * U; ctx.beginPath(); ctx.arc(p.x, p.y, 2.8 * U * s, 0, TAU); ctx.stroke();
  ctx.font = `${3 * U}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.fillText(d.icon, p.x, p.y + 0.2 * U); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}

// ---------- city ----------
function drawCity(tm) {
  const i0 = Math.floor((cam.x - W * 0.125) / CELL) - 1, i1 = Math.floor((cam.x + W * 1.125) / CELL) + 1, j0 = Math.floor((cam.y - H * 0.125) / CELL) - 1, j1 = Math.floor((cam.y + H * 1.125) / CELL) + 1;
  // road markings
  ctx.strokeStyle = 'rgba(240,200,60,.75)'; ctx.lineWidth = 0.4 * U; ctx.setLineDash([3 * U, 3 * U]); ctx.beginPath();
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const ox = i * CELL, oy = j * CELL;
    ctx.moveTo(ox, oy + ROAD / 2); ctx.lineTo(ox, oy + CELL - ROAD / 2);
    ctx.moveTo(ox + ROAD / 2, oy); ctx.lineTo(ox + CELL - ROAD / 2, oy);
  }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(235,235,235,.7)';
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const ox = i * CELL, oy = j * CELL;
    for (let k = 0; k < 6; k++) {
      const o = -ROAD / 2 + 1.2 * U + k * (ROAD - 2.4 * U) / 5;
      ctx.fillRect(ox + o - 0.5 * U, oy + ROAD / 2 + 0.5 * U, 1 * U, 2.4 * U);
      ctx.fillRect(ox + ROAD / 2 + 0.5 * U, oy + o - 0.5 * U, 2.4 * U, 1 * U);
    }
  }
  for (const c of cells.values()) {
    if (c.i < i0 || c.i > i1 || c.j < j0 || c.j > j1) continue;
    const B = blockRect(c.i, c.j), w = B.x1 - B.x0, h = B.y1 - B.y0;
    ctx.fillStyle = '#9a9a9f'; ctx.fillRect(B.x0, B.y0, w, h); // sidewalk
    ctx.fillStyle = '#4a4d55'; ctx.beginPath(); ctx.arc(B.x0 + 0.6 * U, B.y0 + 0.6 * U, 0.55 * U, 0, TAU); ctx.fill(); // street lamp
    ctx.fillStyle = nightAmt() > 0.3 ? '#ffe9a8' : '#c9c9c9'; ctx.beginPath(); ctx.arc(B.x0 + 0.6 * U, B.y0 + 0.6 * U, 0.3 * U, 0, TAU); ctx.fill();
    if (c.kind === 'bld') {
      for (const s of c.subs) {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(s.x + 1.2 * U, s.y + 1.4 * U, s.w, s.h);
        ctx.fillStyle = s.col; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = `rgba(255,255,255,${(0.1 + 0.15 * s.hgt).toFixed(2)})`; ctx.fillRect(s.x + 0.8 * U, s.y + 0.8 * U, s.w - 1.6 * U, s.h - 1.6 * U);
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.3 * U; ctx.strokeRect(s.x, s.y, s.w, s.h);
        if (s.ac) { ctx.fillStyle = '#6b6f78'; ctx.fillRect(s.x + s.w * 0.15, s.y + s.h * 0.2, 3 * U, 2.4 * U); ctx.fillRect(s.x + s.w * 0.6, s.y + s.h * 0.55, 2.4 * U, 2.4 * U); }
      }
    } else if (c.kind === 'park') {
      ctx.fillStyle = '#5a9a50'; ctx.fillRect(B.x0 + 1.2 * U, B.y0 + 1.2 * U, w - 2.4 * U, h - 2.4 * U);
      ctx.fillStyle = '#c9b99a'; ctx.fillRect(B.x0 + w / 2 - 1 * U, B.y0 + 1.2 * U, 2 * U, h - 2.4 * U); ctx.fillRect(B.x0 + 1.2 * U, B.y0 + h / 2 - 1 * U, w - 2.4 * U, 2 * U);
    } else {
      ctx.fillStyle = '#4a4d55'; ctx.fillRect(B.x0 + 1 * U, B.y0 + 1 * U, w - 2 * U, h - 2 * U);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.3 * U; ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const x = B.x0 + 2 * U + k * (w - 4 * U) / 6; ctx.moveTo(x, B.y0 + 2 * U); ctx.lineTo(x, B.y0 + h * 0.45); ctx.moveTo(x, B.y0 + h * 0.55); ctx.lineTo(x, B.y1 - 2 * U); }
      ctx.stroke();
    }
  }
}

// ---------- screen-space buttons ----------
function btns() {
  const t = touchUI;
  return {
    dash: t ? { x: W - SAFE.r - 14 * HU, y: H - SAFE.b - 15 * HU, r: 10 * HU } : { x: W - SAFE.r - 10 * HU, y: H - SAFE.b - 10 * HU, r: 7 * HU },
    pause: { x: W - SAFE.r - 6 * HU, y: SAFE.t + 6 * HU, r: 4.2 * HU },
  };
}
function drawJoystick() {
  const R = JOY_R(), home = joyHome(), on = joy.active;
  const bx = on ? joy.bx : home.x, by = on ? joy.by : home.y, kx = on ? joy.x : home.x, ky = on ? joy.y : home.y;
  ctx.save();
  ctx.globalAlpha = on ? 1 : 0.45;
  ctx.fillStyle = 'rgba(10,14,30,.35)'; ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.4 * HU; ctx.stroke();
  if (on) { // direction tick
    const m = Math.hypot(joy.dx, joy.dy);
    if (m > 0.18) { const a = Math.atan2(joy.dy, joy.dx); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * (R + 1.8 * HU), by + Math.sin(a) * (R + 1.8 * HU)); ctx.lineTo(bx + Math.cos(a + 0.18) * (R + 0.2 * HU), by + Math.sin(a + 0.18) * (R + 0.2 * HU)); ctx.lineTo(bx + Math.cos(a - 0.18) * (R + 0.2 * HU), by + Math.sin(a - 0.18) * (R + 0.2 * HU)); ctx.fill(); }
  }
  const g = ctx.createRadialGradient(kx - 1.2 * HU, ky - 1.2 * HU, 0.5 * HU, kx, ky, 5.2 * HU);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8ab4ff');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kx, ky, 5.2 * HU, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawButtons() {
  const b = btns(), C = CARS[save.car];
  const cdMax = C.dashCd * (1 - 0.12 * save.up.dash), ready = car.dashCd <= 0, d = b.dash;
  if (touchUI) drawJoystick();
  ctx.fillStyle = ready ? 'rgba(255,170,50,.4)' : 'rgba(10,14,30,.4)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = ready ? '#ffb347' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.6 * HU;
  ctx.beginPath(); ctx.arc(d.x, d.y, d.r, -Math.PI / 2, -Math.PI / 2 + TAU * (ready ? 1 : 1 - car.dashCd / cdMax)); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.font = `bold ${(touchUI ? 3.2 : 2.5) * HU}px sans-serif`;
  ctx.fillText('BOOST', d.x, d.y + (touchUI ? 1.2 : 0.9) * HU);
  ctx.fillStyle = 'rgba(10,14,30,.4)'; ctx.beginPath(); ctx.arc(b.pause.x, b.pause.y, b.pause.r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(b.pause.x - 1.2 * HU, b.pause.y - 1.3 * HU, 0.8 * HU, 2.6 * HU); ctx.fillRect(b.pause.x + 0.4 * HU, b.pause.y - 1.3 * HU, 0.8 * HU, 2.6 * HU);
}

// ---------- main draw ----------
function draw() {
  const tm = performance.now() / 1000; tmNow = tm;
  ctx.save();
  if (shake > 0.5) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
  ctx.fillStyle = '#3b3f47'; ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2 - cam.x, -H / 2 - cam.y);
  drawCity(tm);
  for (const o of oilL) if (onScreen(o.x, o.y, o.r)) drawOil(o, tm);
  for (const s of spikesL) if (onScreen(s.x, s.y, 8 * U)) drawStrip(s, false);
  for (const s of hspikes) if (onScreen(s.x, s.y, 8 * U)) drawStrip(s, true);
  for (const o of conesL) if (onScreen(o.x, o.y, 2 * U)) drawCone(o);
  for (const m of barrelsL) if (!m.dead && onScreen(m.x, m.y, 5 * U)) drawBarrel(m, tm);
  for (const k of coinsL) if (!k.dead && onScreen(k.x, k.y, 3 * U)) drawCash(k, tm);
  for (const k of dcoins) if (onScreen(k.x, k.y, 3 * U)) drawCash(k, tm);
  for (const k of billsL) if (!k.dead && onScreen(k.x, k.y, 3 * U)) drawBill(k, tm);
  for (const p of powerups) drawPowerup(p, tm);
  if (state !== 'menu') {
    ctx.lineCap = 'round';
    for (const k of skids) {
      const a = clamp(k.life / k.max, 0, 1);
      ctx.strokeStyle = k.wet ? `rgba(200,220,240,${(0.3 * a).toFixed(3)})` : `rgba(8,8,10,${(0.42 * Math.min(1, a * 1.5)).toFixed(3)})`;
      ctx.lineWidth = (k.wet ? 0.5 : 0.4) * U;
      ctx.beginPath(); ctx.moveTo(k.x1, k.y1); ctx.lineTo(k.x2, k.y2); ctx.stroke();
    }
    for (const e of enemies) if (!e.flying) drawTrail(e, 'rgba(255,90,80,A)', e.boss ? 3 * U : 1.6 * U);
    if (state === 'play' || state === 'pause') drawTrail(car, car.dashT > 0 ? 'rgba(255,190,80,A)' : 'rgba(235,235,235,A)', car.dashT > 0 ? 3 * U : 2 * U);
  }
  for (const p of foam) { ctx.fillStyle = `rgba(230,230,230,${(0.5 * p.life / p.max).toFixed(2)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1.6 - p.life / p.max), 0, TAU); ctx.fill(); }
  for (const o of parkedL) if (onScreen(o.x, o.y, 5 * U)) drawParked(o);
  for (const p of pedsL) if (onScreen(p.x, p.y, 2 * U)) drawPed(p, tm);
  for (const o of traffic) if (onScreen(o.x, o.y, 10 * U)) drawTraffic(o, tm);
  for (const b of blocks) if (onScreen(b.x, b.y, 8 * U)) carSprite(b.x, b.y, b.a, 4.6 * U, 2.2 * U, '#eef0f4', { stripe: '#14161c', bar: true, ph: b.ph });
  for (const r of rsplash) { const f = r.life / r.max; ctx.strokeStyle = `rgba(225,238,255,${(0.28 * f).toFixed(2)})`; ctx.lineWidth = 0.15 * U; ctx.beginPath(); ctx.ellipse(r.x, r.y, (0.3 + 1.1 * (1 - f)) * U, (0.2 + 0.7 * (1 - f)) * U, 0, 0, TAU); ctx.stroke(); }
  if (state !== 'menu') {
    for (const e of enemies) if (!e.flying) drawEnemy(e, tm);
    if (state === 'play' || state === 'pause') drawPlayer();
  }
  for (const o of treesL) if (onScreen(o.x, o.y, 5 * U)) drawTree(o, tm);
  for (const e of enemies) if (e.flying) drawEnemy(e, tm);
  drawLights(tm);
  for (const z of zones) {
    const f = 1 - z.t / z.max, col = z.kind === 'slam' ? '255,170,60' : '255,60,60';
    ctx.fillStyle = `rgba(${col},${(0.08 + 0.18 * f).toFixed(2)})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(${col},.9)`; ctx.lineWidth = 0.5 * U; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * f, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
  }
  for (const s of shells) {
    ctx.fillStyle = 'rgba(255,200,60,.35)'; ctx.beginPath(); ctx.arc(s.x, s.y, 1.4 * U, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.arc(s.x, s.y, 0.7 * U, 0, TAU); ctx.fill();
  }
  for (const m of rockets) {
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a);
    ctx.fillStyle = 'rgba(255,160,60,.6)'; ctx.beginPath(); ctx.moveTo(-1.4 * U, 0); ctx.lineTo(-4 * U, 0.5 * U); ctx.lineTo(-4 * U, -0.5 * U); ctx.fill();
    ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.ellipse(0, 0, 1.6 * U, 0.55 * U, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e0402a'; ctx.beginPath(); ctx.arc(1.2 * U, 0, 0.35 * U, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const r of rings) { ctx.strokeStyle = `rgba(255,220,160,${r.life / r.max})`; ctx.lineWidth = 0.6 * U; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke(); }
  for (const p of particles) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.font = `bold ${3.2 * U}px sans-serif`; ctx.textAlign = 'center';
  for (const f of floaters) { ctx.fillStyle = `rgba(${f.rgb || '255,236,150'},${clamp(f.life, 0, 1)})`; ctx.fillText(f.text, f.x, f.y); }
  if (state === 'play') drawRadioBubbles();
  ctx.restore();
  if (state === 'play') for (const e of enemies) { // off-screen warning arrows
    if (onScreen(e.x, e.y, 0)) continue;
    const dx = (e.x - cam.x - W / 2) * zoom, dy = (e.y - cam.y - H / 2) * zoom;
    const k = Math.min((W / 2 - 4 * U) / Math.abs(dx || 1e-6), (H / 2 - 4 * U) / Math.abs(dy || 1e-6));
    ctx.save(); ctx.translate(W / 2 + dx * k, H / 2 + dy * k); ctx.rotate(Math.atan2(dy, dx));
    if (e.boss) ctx.scale(2, 2);
    ctx.fillStyle = e.boss ? 'rgba(255,60,200,.95)' : (e.type === 'interceptor' || e.type === 'swat' || e.type === 'gunbike' || e.type === 'heli' || e.type === 'truck' || e.type === 'apc') ? 'rgba(255,160,60,.85)' : 'rgba(255,80,70,.8)';
    ctx.beginPath(); ctx.moveTo(1.6 * U, 0); ctx.lineTo(-1 * U, 1.1 * U); ctx.lineTo(-1 * U, -1.1 * U); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  drawAtmosphere(tm);
  drawHUD(tm);
}

// ---------- day / night / weather overlays ----------
function drawAtmosphere(tm) {
  if (state === 'menu') return;
  const night = nightAmt(), tint = duskTint(), bx = sx(car.x), by = sy(car.y);
  if (tint > 0.01) { ctx.fillStyle = `rgba(255,120,40,${(tint * 0.2).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (isRain() && wAmt > 0.01) {
    const storm = wType === 'storm', n = storm ? 120 : 60;
    ctx.fillStyle = `rgba(10,25,45,${((storm ? 0.14 : 0.07) * wAmt).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(220,235,255,${((storm ? 0.22 : 0.15) * wAmt).toFixed(2)})`; ctx.lineWidth = (storm ? 0.16 : 0.12) * U; ctx.beginPath();
    const slant = storm ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const x = (((i * 97.3 + tm * (storm ? 60 : 25) * U) % (W + 60)) + W + 60) % (W + 60) - 30, y = (((i * 53.7 + tm * (storm ? 120 : 90) * U) % (H + 40)) + H + 40) % (H + 40) - 20;
      ctx.moveTo(x, y); ctx.lineTo(x - slant * U, y + 3.4 * U);
    }
    ctx.stroke();
  }
  for (const d of lens) { // water droplets on the camera
    const a = clamp(Math.min(d.life, d.max - d.life > 0 ? d.life : 0, 1), 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(190,215,245,.09)'; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 1.15, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(235,245,255,.35)'; ctx.lineWidth = Math.max(1, d.r * 0.12);
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.85, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.35, Math.max(1, d.r * 0.2), 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (lightning > 0.02) { ctx.fillStyle = `rgba(225,235,255,${(0.35 * lightning).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (wType === 'fog' && wAmt > 0.01) { // drifting haze
    for (let i = 0; i < 5; i++) {
      const x = (((i * 0.31 + tm * 0.012 * (1 + i * 0.3)) % 1.4) - 0.2) * W, y = (0.1 + 0.2 * i) * H, g2 = ctx.createRadialGradient(x, y, 0, x, y, W * 0.4);
      g2.addColorStop(0, `rgba(215,219,228,${(0.22 * wAmt).toFixed(3)})`); g2.addColorStop(1, 'rgba(215,219,228,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    }
    const g = ctx.createRadialGradient(bx, by, 14 * U, bx, by, 50 * U);
    g.addColorStop(0, 'rgba(210,214,222,0)'); g.addColorStop(1, `rgba(210,214,222,${(0.85 * wAmt).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (night > 0.01) drawNight(night, tm, bx, by);
  drawNitroFx(tm, bx, by);
}

// ---------- nitro: speed lines + vignette ----------
function drawNitroFx(tm, bx, by) {
  if (state !== 'play') return;
  const k = Math.max(car.dashT > 0 ? Math.min(1, car.dashT / 0.12) : 0, speedT > 0 ? 0.3 : 0);
  if (k <= 0.01) return;
  const R = Math.hypot(W, H) / 2, g = ctx.createRadialGradient(W / 2, H / 2, R * 0.35, W / 2, H / 2, R);
  g.addColorStop(0, 'rgba(80,170,255,0)'); g.addColorStop(1, `rgba(60,150,255,${(0.55 * k).toFixed(3)})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(230,245,255,${(0.5 * k).toFixed(3)})`;
  const n = 34, step = Math.floor(tm * 30);
  for (let i = 0; i < n; i++) {
    const h = Math.sin((i + 1) * 91.7 + step * 12.9898) * 43758.5453, r1 = h - Math.floor(h);
    const a = (i / n) * TAU + r1 * 0.3, d0 = R * (0.35 + 0.35 * r1), len = R * (0.15 + 0.25 * k) * (0.6 + r1);
    ctx.lineWidth = (0.15 + r1 * 0.25) * U;
    ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * d0, by + Math.sin(a) * d0); ctx.lineTo(bx + Math.cos(a) * (d0 + len), by + Math.sin(a) * (d0 + len)); ctx.stroke();
  }
  ctx.restore();
}

// ---------- HUD ----------
function drawHUD(tm) {
  ctx.textBaseline = 'alphabetic';
  if (state === 'menu') return;
  ctx.save(); ctx.translate(SAFE.l, SAFE.t);
  const shown = Math.floor(score), isBest = shown > 0 && shown >= save.best, best = Math.max(Math.floor(save.best), shown);
  const x0 = 2 * HU, y0 = 2 * HU, cw = 28 * HU, chh = 21.5 * HU, px = x0 + 2.2 * HU, iw = cw - 4.4 * HU;
  ctx.textAlign = 'left';
  // card
  const gr = ctx.createLinearGradient(0, y0, 0, y0 + chh); gr.addColorStop(0, 'rgba(24,34,66,.78)'); gr.addColorStop(1, 'rgba(8,12,28,.78)');
  ctx.fillStyle = gr; rrect(x0, y0, cw, chh, 2 * HU); ctx.fill();
  ctx.strokeStyle = isBest ? 'rgba(255,216,77,.9)' : 'rgba(138,180,255,.4)'; ctx.lineWidth = 0.25 * HU; ctx.stroke();
  // header: label + cash chip
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `bold ${1.6 * HU}px sans-serif`; ctx.fillText('SCORE', px, y0 + 3.4 * HU);
  { const ct = '● ' + runCoins; ctx.font = `bold ${2 * HU}px sans-serif`; const cwid = ctx.measureText(ct).width + 2.4 * HU;
    ctx.fillStyle = 'rgba(255,216,77,.16)'; rrect(x0 + cw - 2.2 * HU - cwid, y0 + 1.5 * HU, cwid, 2.8 * HU, 1.4 * HU); ctx.fill();
    ctx.fillStyle = '#ffd84d'; ctx.textAlign = 'right'; ctx.fillText(ct, x0 + cw - 3.4 * HU, y0 + 3.5 * HU); ctx.textAlign = 'left'; }
  // big score
  ctx.fillStyle = isBest ? '#ffd84d' : '#fff'; ctx.font = `800 ${6.4 * HU}px sans-serif`; ctx.fillText(shown, px, y0 + 10.4 * HU);
  // progress toward your best
  const prog = best > 0 ? clamp(shown / best, 0, 1) : 0;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(px, y0 + 12 * HU, iw, 1 * HU, 0.5 * HU); ctx.fill();
  if (prog > 0.01) { const pg = ctx.createLinearGradient(px, 0, px + iw, 0); pg.addColorStop(0, '#6aa6ff'); pg.addColorStop(1, isBest ? '#ffd84d' : '#8ab4ff'); ctx.fillStyle = pg; rrect(px, y0 + 12 * HU, iw * prog, 1 * HU, 0.5 * HU); ctx.fill(); }
  ctx.font = `bold ${1.5 * HU}px sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText(isBest ? '★ NEW BEST' : 'BEST ' + best, px, y0 + 15.2 * HU);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(px, y0 + 16.4 * HU, iw, 0.15 * HU);
  // health hearts + fuel gauge
  {
    const hy = y0 + 19.6 * HU, mh = maxHp();
    ctx.font = `${3 * HU}px sans-serif`; ctx.textAlign = 'left';
    for (let i = 0; i < mh; i++) {
      const full = i < car.hp, blink = car.inv > 0 && Math.floor(tm * 10) % 2 === 0 && i === car.hp;
      ctx.fillStyle = full ? (car.hp === 1 && Math.floor(tm * 4) % 2 ? '#ff9a8a' : '#ff4d5e') : blink ? '#fff' : 'rgba(255,255,255,.2)';
      ctx.fillText('♥', px + i * 3.2 * HU, hy);
    }
    const gx = px + mh * 3.2 * HU + 1.4 * HU, gw = x0 + cw - 2.2 * HU - gx, gh = 1.5 * HU, fr = clamp(car.fuel / 100, 0, 1);
    const low = fr < 0.25, pulse = low && Math.floor(tm * 5) % 2 === 0;
    ctx.font = `${2.3 * HU}px sans-serif`; ctx.fillStyle = pulse ? '#ff5a3c' : '#fff'; ctx.fillText('⛽', gx, hy - 0.1 * HU);
    const bx2 = gx + 3.2 * HU, bw2 = gw - 3.2 * HU;
    ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(bx2, hy - 1.6 * HU, bw2, gh, gh / 2); ctx.fill();
    ctx.fillStyle = pulse ? '#fff' : fr > 0.5 ? '#6cd96c' : fr > 0.25 ? '#ffd24d' : '#ff5a3c';
    if (fr > 0.01) { rrect(bx2, hy - 1.6 * HU, bw2 * fr, gh, gh / 2); ctx.fill(); }
  }
  // power-up chips with a draining bar
  let y = y0 + chh + 1.6 * HU; ctx.font = `bold ${1.9 * HU}px sans-serif`;
  const chip = (txt, col, frac) => {
    const w = 15 * HU, h = 3.6 * HU;
    ctx.fillStyle = 'rgba(10,14,30,.7)'; rrect(x0, y, w, h, 1.2 * HU); ctx.fill();
    ctx.fillStyle = col; ctx.globalAlpha = 0.35; rrect(x0, y, w * clamp(frac, 0.04, 1), h, 1.2 * HU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.fillText(txt, x0 + 1.4 * HU, y + 2.5 * HU);
    y += h + 0.9 * HU;
  };
  if (car.shield > 0) chip('ARMOR  ' + car.shield.toFixed(1) + 's', '#8ab4ff', car.shield / (6 + save.up.shield));
  if (speedT > 0) chip('TURBO  ' + speedT.toFixed(1) + 's', '#ffe14d', speedT / 8);
  if (magnetT > 0) chip('MAGNET  ' + magnetT.toFixed(1) + 's', '#ff7a7a', magnetT / 10);
  if (slowT > 0) chip('SLOW-MO  ' + slowT.toFixed(1) + 's', '#c9a0ff', slowT / 6);
  ctx.restore();
  if (boss && !boss.dead) {
    const narrow = W < 560; // portrait phone: tuck the bar under the top buttons so it doesn't cover them or the score card
    const bw = narrow ? W * 0.5 : Math.min(W * 0.6, 70 * HU), bx = narrow ? W - SAFE.r - bw - 2 * HU : (W - bw) / 2, by = (narrow ? 13 : 3) * HU + SAFE.t;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, by, bw, 2.2 * HU);
    ctx.fillStyle = '#e0407a'; ctx.fillRect(bx, by, bw * clamp(boss.hp / boss.maxHp, 0, 1), 2.2 * HU);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.2 * HU; ctx.strokeRect(bx, by, bw, 2.2 * HU);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `bold ${2 * HU}px sans-serif`; ctx.fillText(boss.type === 'tank' ? 'ARMORED TANK' : 'RIOT DOZER', bx + bw / 2, by + 5.2 * HU);
  }
  if (banner.t > 0) {
    ctx.textAlign = 'center'; ctx.font = `bold ${5.5 * HU}px sans-serif`;
    const bwid = ctx.measureText(banner.text).width; if (bwid > W * 0.9) ctx.font = `bold ${5.5 * HU * W * 0.9 / bwid}px sans-serif`; // shrink long banners to fit narrow screens
    ctx.fillStyle = `rgba(255,255,255,${clamp(banner.t, 0, 1).toFixed(2)})`; ctx.strokeStyle = `rgba(10,14,30,${clamp(banner.t, 0, 1).toFixed(2)})`; ctx.lineWidth = 0.6 * HU;
    ctx.strokeText(banner.text, W / 2, H * 0.28); ctx.fillText(banner.text, W / 2, H * 0.28);
  }
  if (state === 'play' || state === 'pause') drawButtons();
}

// ---------- night: a dark layer with holes cut for headlights, street lamps and police lights ----------
let nightCv = null, nctx = null;
function drawNight(night, tm, bx, by) {
  if (!nightCv) { nightCv = document.createElement('canvas'); nctx = nightCv.getContext('2d'); }
  if (nightCv.width !== Math.ceil(W) || nightCv.height !== Math.ceil(H)) { nightCv.width = Math.ceil(W); nightCv.height = Math.ceil(H); }
  const n = nctx;
  n.globalCompositeOperation = 'source-over'; n.clearRect(0, 0, W, H);
  n.fillStyle = `rgba(6,10,40,${(0.8 * night).toFixed(3)})`; n.fillRect(0, 0, W, H);
  n.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { r *= zoom; const g = n.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); n.fillStyle = g; n.beginPath(); n.arc(x, y, r, 0, TAU); n.fill(); };
  const lamps = [];
  for (const c of cells.values()) {
    const lx = sx(c.i * CELL + ROAD / 2 + 0.6 * U), ly = sy(c.j * CELL + ROAD / 2 + 0.6 * U);
    if (lx < -20 * U || lx > W + 20 * U || ly < -20 * U || ly > H + 20 * U) continue;
    lamps.push([lx, ly]); hole(lx, ly, 16 * U, 0.85);
  }
  if (state === 'play' || state === 'pause') {
    hole(bx, by, 12 * U, 0.85);
    n.save(); n.translate(bx, by); n.rotate(car.a); n.scale(zoom, zoom); // headlight cone
    const g = n.createLinearGradient(0, 0, 36 * U, 0); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    n.fillStyle = g; n.beginPath(); n.moveTo(0, -1 * U); n.lineTo(36 * U, -10 * U); n.lineTo(36 * U, 10 * U); n.lineTo(0, 1 * U); n.fill(); n.restore();
  }
  for (const e of enemies) if (e.type === 'heli' && !e.dead && e.spot) hole(sx(e.spot.x), sy(e.spot.y), 10 * U, 0.9);
  for (const e of enemies) if (!e.dead) hole(sx(e.x), sy(e.y), (e.boss ? 14 : 7) * U, 0.55); // police lights light up the road around them
  for (const o of traffic) hole(sx(o.x + Math.cos(o.a) * 4 * U), sy(o.y + Math.sin(o.a) * 4 * U), 7 * U, 0.55);
  ctx.drawImage(nightCv, 0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; // warm glow around lamps
  for (const [lx, ly] of lamps) { const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 9 * U * zoom); g.addColorStop(0, `rgba(255,205,120,${(0.32 * night).toFixed(3)})`); g.addColorStop(1, 'rgba(255,205,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 9 * U, 0, TAU); ctx.fill(); }
  for (const e of enemies) if (!e.dead) { const f = Math.floor(tm * 8) % 2, x = sx(e.x), y = sy(e.y), g = ctx.createRadialGradient(x, y, 0, x, y, 6 * U * zoom); g.addColorStop(0, f ? `rgba(255,40,40,${(0.35 * night).toFixed(3)})` : `rgba(60,110,255,${(0.35 * night).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 6 * U, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---------- police radio: speech bubbles above the vehicle that speaks ----------
function drawRadioBubbles() {
  ctx.font = `bold ${2 * HU}px sans-serif`; ctx.textAlign = 'center';
  const stack = new Map();
  for (const r of radioLog) {
    const a = clamp(Math.min(r.t, (5.5 - r.t) * 4, 1), 0, 1), w = ctx.measureText(r.text).width + 3 * HU, h = 3.2 * HU;
    const n = stack.get(r.e) || 0; stack.set(r.e, n + 1);
    const rad = r.e ? r.e.r : 2 * U;
    let x = clamp(r.x, cam.x + w / 2 + 2 * HU, cam.x + W - w / 2 - 2 * HU), y = clamp(r.y - rad - 3.5 * HU - n * (h + 0.6 * HU), cam.y + SAFE.t + 4 * HU, cam.y + H - SAFE.b - 4 * HU);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,14,30,.78)'; rrect(x - w / 2, y - h / 2, w, h, 1 * HU); ctx.fill();
    ctx.strokeStyle = 'rgba(138,180,255,.8)'; ctx.lineWidth = 0.2 * HU; ctx.stroke();
    if (Math.abs(r.x - x) < w / 2 && r.y > y) { ctx.fillStyle = 'rgba(8,14,30,.78)'; ctx.beginPath(); ctx.moveTo(r.x - 0.9 * HU, y + h / 2 - 0.05 * HU); ctx.lineTo(r.x + 0.9 * HU, y + h / 2 - 0.05 * HU); ctx.lineTo(r.x, y + h / 2 + 1.1 * HU); ctx.fill(); } // tail
    ctx.fillStyle = '#cfe8ff'; ctx.fillText(r.text, x, y + 0.7 * HU);
    ctx.globalAlpha = 1;
  }
}

// ---------- lighting: police-light bloom, wet-road reflections, headlight and brake glow (world space) ----------
function drawLights(tm) {
  if (state === 'menu') return;
  const night = nightAmt(), wet = isRain() ? wAmt : 0, k = 0.45 + 0.9 * night + 0.5 * wet;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const siren = (x, y, ph, big) => {
    const f = Math.floor(tm * 8 + ph) % 2, col = f ? '255,50,50' : '70,120,255';
    glow(x, y, (big ? 12 : 7.5) * U, col, 0.2 * k);
    if (wet > 0.1) { ctx.save(); ctx.translate(x, y + 5 * U); ctx.scale(0.45, 1); glow(0, 0, 7 * U, col, 0.16 * wet); ctx.restore(); } // reflection on the wet road
  };
  for (const e of enemies) if (!e.dead && !e.flying && e.type !== 'tank' && e.type !== 'dozer' && onScreen(e.x, e.y, 14 * U)) siren(e.x, e.y, e.ph || 0, e.boss);
  for (const e of enemies) if (!e.dead && e.boss && onScreen(e.x, e.y, 16 * U)) siren(e.x, e.y, 0, true);
  for (const b of blocks) if (onScreen(b.x, b.y, 14 * U)) siren(b.x, b.y, b.ph, false);
  for (const e of enemies) if (e.type === 'heli' && !e.dead && e.spot) { // helicopter searchlight
    const sp = e.spot, lit = clamp((e.lit || 0) / 2.2, 0, 1), col = lit > 0.05 && Math.floor(tm * (4 + lit * 8)) % 2 ? '255,90,80' : '255,250,225';
    const ang = Math.atan2(sp.y - e.y, sp.x - e.x), len = Math.hypot(sp.x - e.x, sp.y - e.y), nx = -Math.sin(ang), ny = Math.cos(ang);
    const bg = ctx.createLinearGradient(e.x, e.y, sp.x, sp.y); bg.addColorStop(0, `rgba(${col},0.02)`); bg.addColorStop(1, `rgba(${col},${(0.2 + 0.3 * night).toFixed(3)})`);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(e.x + nx * 0.5 * U, e.y + ny * 0.5 * U); ctx.lineTo(sp.x + nx * 7 * U, sp.y + ny * 7 * U); ctx.lineTo(sp.x - nx * 7 * U, sp.y - ny * 7 * U); ctx.lineTo(e.x - nx * 0.5 * U, e.y - ny * 0.5 * U); ctx.fill();
    glow(sp.x, sp.y, 8.5 * U, col, 0.4 + 0.2 * night);
    if (lit > 0.02) { ctx.strokeStyle = `rgba(255,${Math.round(220 - 140 * lit)},80,.9)`; ctx.lineWidth = 0.6 * U; ctx.beginPath(); ctx.arc(sp.x, sp.y, 7.4 * U, -Math.PI / 2, -Math.PI / 2 + TAU * lit); ctx.stroke(); }
  }
  if (state === 'play' || state === 'pause') {
    const ca = Math.cos(car.a), sa = Math.sin(car.a), V = CARS[save.car];
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.a); // headlight beam
    const g = ctx.createLinearGradient(V.len * U / 2, 0, 34 * U, 0); g.addColorStop(0, `rgba(255,244,200,${(0.22 * (0.5 + night + wet * 0.6)).toFixed(3)})`); g.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(V.len * U / 2, -V.wid * U * 0.35); ctx.lineTo(34 * U, -11 * U); ctx.lineTo(34 * U, 11 * U); ctx.lineTo(V.len * U / 2, V.wid * U * 0.35); ctx.fill();
    ctx.restore();
    glow(car.x - ca * V.len * U * 0.5, car.y - sa * V.len * U * 0.5, (car.dashT > 0 ? 6 : 3.5) * U, car.dashT > 0 ? '90,170,255' : '255,50,40', (car.dashT > 0 ? 0.4 : 0.22) * (0.6 + night)); // tail / nitro glow
  }
  ctx.restore();
}
