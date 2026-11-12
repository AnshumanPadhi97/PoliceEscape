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
  const col = { hatch: '#e8b020', muscle: '#d02a2a', coupe: '#1faa88', scooter: '#e8e0d0', sportbike: '#d02a8a', dirtbike: '#e8701a' }[save.car] || '#e8b020';
  const isBike = CARS[save.car].kind === 'bike';
  const L = isBike ? 3.4 * U : save.car === 'muscle' ? 5.2 * U : 4.6 * U, Wd = isBike ? 1.1 * U : save.car === 'muscle' ? 2.5 * U : 2.2 * U;
  if (C.dashT > 0) { // nitro flames
    ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(C.a);
    ctx.fillStyle = 'rgba(80,170,255,.85)'; ctx.beginPath(); ctx.moveTo(-L / 2, -0.8 * U); ctx.lineTo(-L / 2 - rnd(4, 7) * U, 0); ctx.lineTo(-L / 2, 0.8 * U); ctx.fill(); ctx.restore();
  }
  if (isBike) drawBike(C.x, C.y, C.a, L, Wd, col);
  else carSprite(C.x, C.y, C.a, L, Wd, col, { stripe: save.car === 'muscle' ? '#fff' : null, roof: save.car === 'coupe' ? '#0d6a55' : null });
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
  const i0 = Math.floor(cam.x / CELL) - 1, i1 = Math.floor((cam.x + W) / CELL) + 1, j0 = Math.floor(cam.y / CELL) - 1, j1 = Math.floor((cam.y + H) / CELL) + 1;
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
  return { dash: { x: W - SAFE.r - 10 * HU, y: H - SAFE.b - 10 * HU, r: 7 * HU }, pause: { x: W - SAFE.r - 6 * HU, y: SAFE.t + 6 * HU, r: 4.2 * HU } };
}
function drawButtons() {
  const b = btns(), C = CARS[save.car];
  const cdMax = C.dashCd * (1 - 0.12 * save.up.dash), ready = car.dashCd <= 0;
  ctx.fillStyle = ready ? 'rgba(138,180,255,.35)' : 'rgba(10,14,30,.4)'; ctx.beginPath(); ctx.arc(b.dash.x, b.dash.y, b.dash.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = ready ? '#8ab4ff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.5 * HU;
  ctx.beginPath(); ctx.arc(b.dash.x, b.dash.y, b.dash.r, -Math.PI / 2, -Math.PI / 2 + TAU * (ready ? 1 : 1 - car.dashCd / cdMax)); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `bold ${2.5 * HU}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('NITRO', b.dash.x, b.dash.y + 0.9 * HU);
  ctx.fillStyle = 'rgba(10,14,30,.4)'; ctx.beginPath(); ctx.arc(b.pause.x, b.pause.y, b.pause.r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(b.pause.x - 1.2 * HU, b.pause.y - 1.3 * HU, 0.8 * HU, 2.6 * HU); ctx.fillRect(b.pause.x + 0.4 * HU, b.pause.y - 1.3 * HU, 0.8 * HU, 2.6 * HU);
}

// ---------- main draw ----------
function draw() {
  const tm = performance.now() / 1000; tmNow = tm;
  ctx.save();
  if (shake > 0.5) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
  ctx.fillStyle = '#3b3f47'; ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  drawCity(tm);
  for (const o of oilL) if (onScreen(o.x, o.y, o.r)) drawOil(o, tm);
  for (const s of spikesL) if (onScreen(s.x, s.y, 8 * U)) drawStrip(s, false);
  for (const s of hspikes) if (onScreen(s.x, s.y, 8 * U)) drawStrip(s, true);
  for (const o of conesL) if (onScreen(o.x, o.y, 2 * U)) drawCone(o);
  for (const m of barrelsL) if (!m.dead && onScreen(m.x, m.y, 5 * U)) drawBarrel(m, tm);
  for (const k of coinsL) if (!k.dead && onScreen(k.x, k.y, 3 * U)) drawCash(k, tm);
  for (const k of dcoins) if (onScreen(k.x, k.y, 3 * U)) drawCash(k, tm);
  for (const p of powerups) drawPowerup(p, tm);
  for (const p of foam) { ctx.fillStyle = `rgba(230,230,230,${(0.5 * p.life / p.max).toFixed(2)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1.6 - p.life / p.max), 0, TAU); ctx.fill(); }
  for (const o of parkedL) if (onScreen(o.x, o.y, 5 * U)) drawParked(o);
  for (const p of pedsL) if (onScreen(p.x, p.y, 2 * U)) drawPed(p, tm);
  for (const o of traffic) if (onScreen(o.x, o.y, 10 * U)) drawTraffic(o, tm);
  if (state !== 'menu') {
    for (const e of enemies) if (!e.flying) drawEnemy(e, tm);
    if (state === 'play' || state === 'pause') drawPlayer();
  }
  for (const o of treesL) if (onScreen(o.x, o.y, 5 * U)) drawTree(o, tm);
  for (const e of enemies) if (e.flying) drawEnemy(e, tm);
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
  for (const f of floaters) { ctx.fillStyle = `rgba(255,236,150,${clamp(f.life, 0, 1)})`; ctx.fillText(f.text, f.x, f.y); }
  ctx.restore();
  if (state === 'play') for (const e of enemies) { // off-screen warning arrows
    if (onScreen(e.x, e.y, 0)) continue;
    const dx = e.x - cam.x - W / 2, dy = e.y - cam.y - H / 2;
    const k = Math.min((W / 2 - 4 * U) / Math.abs(dx || 1e-6), (H / 2 - 4 * U) / Math.abs(dy || 1e-6));
    ctx.save(); ctx.translate(W / 2 + dx * k, H / 2 + dy * k); ctx.rotate(Math.atan2(dy, dx));
    if (e.boss) ctx.scale(2, 2);
    ctx.fillStyle = e.boss ? 'rgba(255,60,200,.95)' : (e.type === 'interceptor' || e.type === 'swat' || e.type === 'gunbike' || e.type === 'heli') ? 'rgba(255,160,60,.85)' : 'rgba(255,80,70,.8)';
    ctx.beginPath(); ctx.moveTo(1.6 * U, 0); ctx.lineTo(-1 * U, 1.1 * U); ctx.lineTo(-1 * U, -1.1 * U); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  drawAtmosphere(tm);
  drawHUD(tm);
}

// ---------- day / night / weather overlays ----------
function drawAtmosphere(tm) {
  if (state === 'menu') return;
  const night = nightAmt(), tint = duskTint(), bx = car.x - cam.x, by = car.y - cam.y;
  if (tint > 0.01) { ctx.fillStyle = `rgba(255,120,40,${(tint * 0.2).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (wType === 'rain' && wAmt > 0.01) {
    ctx.fillStyle = `rgba(10,25,45,${(0.22 * wAmt).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(220,235,255,${(0.35 * wAmt).toFixed(2)})`; ctx.lineWidth = 0.18 * U; ctx.beginPath();
    for (let i = 0; i < 110; i++) {
      const x = (((i * 97.3 + tm * 25 * U) % (W + 60)) + W + 60) % (W + 60) - 30, y = (((i * 53.7 + tm * 90 * U) % (H + 40)) + H + 40) % (H + 40) - 20;
      ctx.moveTo(x, y); ctx.lineTo(x - 1.2 * U, y + 3.2 * U);
    }
    ctx.stroke();
  }
  if (wType === 'fog' && wAmt > 0.01) {
    const g = ctx.createRadialGradient(bx, by, 14 * U, bx, by, 50 * U);
    g.addColorStop(0, 'rgba(210,214,222,0)'); g.addColorStop(1, `rgba(210,214,222,${(0.85 * wAmt).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (night > 0.01) drawNight(night, tm, bx, by);
}

// ---------- HUD ----------
function drawHUD(tm) {
  ctx.textBaseline = 'alphabetic';
  if (state === 'menu') return;
  ctx.save(); ctx.translate(SAFE.l, SAFE.t);
  const shown = Math.floor(score), best = Math.max(Math.floor(save.best), shown);
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `bold ${3 * HU}px sans-serif`;
  ctx.fillText('SCORE  ' + shown, 3 * HU, 6 * HU);
  ctx.font = `bold ${2.6 * HU}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('BEST  ' + best, 3 * HU, 10 * HU);
  ctx.fillStyle = '#fff'; ctx.fillText('TIME  ' + Math.floor(t), 3 * HU, 13.5 * HU);
  ctx.fillStyle = '#ffd84d'; ctx.fillText('CASH  ' + runCoins, 3 * HU, 17 * HU);
  let y = 20.5 * HU; ctx.font = `bold ${2.5 * HU}px sans-serif`;
  const line = (txt, col) => { ctx.fillStyle = col; ctx.fillText(txt, 3 * HU, y); y += 3.2 * HU; };
  if (car.shield > 0) line('ARMOR ' + car.shield.toFixed(1) + 's', '#8ab4ff');
  if (speedT > 0) line('TURBO ' + speedT.toFixed(1) + 's', '#ffe14d');
  if (magnetT > 0) line('MAGNET ' + magnetT.toFixed(1) + 's', '#ff7a7a');
  if (slowT > 0) line('SLOW-MO ' + slowT.toFixed(1) + 's', '#c9a0ff');
  ctx.restore();
  if (boss && !boss.dead) {
    const bw = Math.min(W * 0.6, 70 * HU), bx = (W - bw) / 2, by = 3 * HU + SAFE.t;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, by, bw, 2.2 * HU);
    ctx.fillStyle = '#e0407a'; ctx.fillRect(bx, by, bw * clamp(boss.hp / boss.maxHp, 0, 1), 2.2 * HU);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.2 * HU; ctx.strokeRect(bx, by, bw, 2.2 * HU);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `bold ${2 * HU}px sans-serif`; ctx.fillText(boss.type === 'tank' ? 'ARMORED TANK' : 'RIOT DOZER', W / 2, by + 5.2 * HU);
  }
  if (banner.t > 0) {
    ctx.textAlign = 'center'; ctx.font = `bold ${5.5 * HU}px sans-serif`;
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
  const hole = (x, y, r, a) => { const g = n.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); n.fillStyle = g; n.beginPath(); n.arc(x, y, r, 0, TAU); n.fill(); };
  const lamps = [];
  for (const c of cells.values()) {
    const lx = c.i * CELL + ROAD / 2 + 0.6 * U - cam.x, ly = c.j * CELL + ROAD / 2 + 0.6 * U - cam.y;
    if (lx < -20 * U || lx > W + 20 * U || ly < -20 * U || ly > H + 20 * U) continue;
    lamps.push([lx, ly]); hole(lx, ly, 16 * U, 0.85);
  }
  if (state === 'play' || state === 'pause') {
    hole(bx, by, 12 * U, 0.85);
    n.save(); n.translate(bx, by); n.rotate(car.a); // headlight cone
    const g = n.createLinearGradient(0, 0, 36 * U, 0); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    n.fillStyle = g; n.beginPath(); n.moveTo(0, -1 * U); n.lineTo(36 * U, -10 * U); n.lineTo(36 * U, 10 * U); n.lineTo(0, 1 * U); n.fill(); n.restore();
  }
  for (const e of enemies) if (!e.dead) hole(e.x - cam.x, e.y - cam.y, (e.boss ? 14 : 7) * U, 0.55); // police lights light up the road around them
  for (const o of traffic) hole(o.x - cam.x + Math.cos(o.a) * 4 * U, o.y - cam.y + Math.sin(o.a) * 4 * U, 7 * U, 0.55);
  ctx.drawImage(nightCv, 0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; // warm glow around lamps
  for (const [lx, ly] of lamps) { const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 9 * U); g.addColorStop(0, `rgba(255,205,120,${(0.32 * night).toFixed(3)})`); g.addColorStop(1, 'rgba(255,205,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 9 * U, 0, TAU); ctx.fill(); }
  for (const e of enemies) if (!e.dead) { const f = Math.floor(tm * 8) % 2, x = e.x - cam.x, y = e.y - cam.y, g = ctx.createRadialGradient(x, y, 0, x, y, 6 * U); g.addColorStop(0, f ? `rgba(255,40,40,${(0.35 * night).toFixed(3)})` : `rgba(60,110,255,${(0.35 * night).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 6 * U, 0, TAU); ctx.fill(); }
  ctx.restore();
}
