// ---------- DOM menus (menu, shop, settings, readme, pause, game over) ----------
const uiEl = document.getElementById('ui');
const toastEl = document.getElementById('toasts');
let panel = null, backTo = 'menu', shopTab = 'car', prevId = null, prevAng = 0, prevRaf = 0;

function toast(text) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; toastEl.appendChild(d);
  setTimeout(() => d.remove(), 3600);
}
const fmt = n => Math.floor(n).toLocaleString();

const VIEWS = {
  menu() {
    return `<h1>POLICE<br>ESCAPE</h1>
      <div class="pills"><span>\u2605 Best <b>${fmt(save.best)}</b></span><span class="coin">\u25CF ${fmt(save.coins)}</span></div>
      <button class="btn play" data-act="play">PLAY</button>`;
  },
  controls() {
    const row = (a, k, t) => `<tr><td>${a}</td><td>${k}</td><td>${t}</td></tr>`;
    return `<h2>CONTROLS</h2>
      <table class="ctl"><tr><th></th><th>Keyboard / mouse</th><th>Touch</th></tr>
      ${row('Steer', '\u2190 \u2192 or A D, or drag', 'Joystick (left)')}
      ${row('Boost', 'Space or Shift', 'BOOST button')}
      ${row('Pause', 'P or Esc', 'Pause button')}
      ${row('Full screen', 'F', 'Top button')}
      ${row('Sound on/off', 'M', 'Top button')}
      </table>
      <button class="btn alt" data-act="back">Back</button>`;
  },
  pause() {
    return `<h2>PAUSED</h2>
      <button class="btn" data-act="resume">Resume</button>
      <button class="btn alt" data-act="settings">Settings</button>
      <button class="btn alt" data-act="quit">Quit to menu</button>`;
  },
  over() {
    const r = lastRun || { score: 0, kills: 0, coins: 0, time: 0 };
    return `<h2>BUSTED!</h2>
      <p class="big">${fmt(r.score)}</p>
      ${r.newBest ? '<p class="gold">★ New best! ★</p>' : ''}
      <div class="pills"><span>${Math.floor(r.time)}s</span><span class="coin">+${r.coins} \u25CF</span></div>
      <button class="btn play" data-act="retry">RETRY</button>
      <button class="btn alt" data-act="quit">Menu</button>`;
  },
  shop() {
    const bar = (v, lo, hi) => `<i style="--v:${Math.round(clamp((v - lo) / (hi - lo), 0.06, 1) * 100)}%"></i>`;
    let h = `<div class="shophead"><h2>GARAGE</h2><span class="coinpill">● ${fmt(save.coins)}</span></div>
      ${shopTab === 'up' ? '' : '<canvas id="gprev" class="gprev" width="640" height="300"></canvas>'}
      <div class="tabs">${[['car', 'Cars'], ['bike', 'Bikes'], ['up', 'Upgrades']].map(([k, n]) => `<button class="tab ${shopTab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${n}</button>`).join('')}</div>`;
    if (shopTab === 'up') {
      h += '<div class="ulist">';
      for (const k in UPGRADES) {
        const lv = save.up[k], u = UPGRADES[k];
        h += `<div class="ucard"><div><b>${u.name}</b><small>${u.desc}</small><div class="seg">${Array.from({ length: UP_MAX }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>` +
          (lv >= UP_MAX ? '<span class="tag">MAX</span>' : `<button class="btn sm ${save.coins < UP_COST[lv] ? 'off' : ''}" data-act="up" data-arg="${k}">● ${UP_COST[lv]}</button>`) + '</div>';
      }
      h += '</div>';
    } else {
      h += '<div class="vgrid">';
      for (const id in CARS) {
        const v = CARS[id]; if (v.kind !== shopTab) continue;
        const owned = save.owned[id], sel = save.car === id, bike = v.kind === 'bike';
        h += `<div class="vcard ${sel ? 'sel' : ''} ${prevId === id ? 'pv' : ''}" data-act="prev" data-arg="${id}">
          <b>${v.name}</b><small>${v.desc}</small>
          <div class="stats"><span>SPD</span>${bar(v.speed, 24, 50)}<span>HND</span>${bar(v.turn, 2, 4.4)}<span>NOS</span>${bar(4 - v.dashCd, 0.3, 2.2)}</div>
          ${sel ? '<span class="tag">Selected</span>' : owned ? `<button class="btn sm" data-act="car" data-arg="${id}">Select</button>`
            : `<button class="btn sm ${save.coins < v.cost ? 'off' : ''}" data-act="car" data-arg="${id}">● ${v.cost}</button>`}</div>`;
      }
      h += '</div>';
    }
    return h + '<button class="btn alt" data-act="back">Back</button>';
  },
  readme() {
    return '<h2>README</h2><div id="md" class="md">Loading...</div><button class="btn alt" data-act="back">Back</button>';
  },
  settings() {
    const s = save.settings, tg = (k, n) => `<div class="row"><b>${n}</b><button class="btn sm ${s[k] ? '' : 'alt'}" data-act="toggle" data-arg="${k}">${s[k] ? 'ON' : 'OFF'}</button></div>`;
    return '<h2>SETTINGS</h2>' + tg('sound', 'Sound effects') + tg('music', 'Music') + '<button class="btn alt" data-act="back">Back</button>';
  },
};

// tiny markdown renderer for README.md (headings, lists, tables, code, bold, inline code)
let readmeHtml = null;
function mdToHtml(md) {
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = t => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  const lines = md.replace(/\r/g, '').split('\n'); let out = '', i = 0, list = false;
  const closeList = () => { if (list) { out += '</ul>'; list = false; } };
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) { closeList(); let code = ''; i++; while (i < lines.length && !lines[i].startsWith('```')) code += lines[i++] + '\n'; i++; out += '<pre>' + esc(code) + '</pre>'; continue; }
    if (/^\|/.test(l) && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1] || '')) {
      closeList(); const cells = r => r.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
      out += '<div class="tbl"><table><tr>' + cells(l).map(c => '<th>' + inline(c) + '</th>').join('') + '</tr>'; i += 2;
      while (i < lines.length && /^\|/.test(lines[i])) out += '<tr>' + cells(lines[i++]).map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
      out += '</table></div>'; continue;
    }
    const h = /^(#{1,3})\s+(.*)/.exec(l);
    if (h) { closeList(); out += `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`; }
    else if (/^\s*-\s+/.test(l)) { if (!list) { out += '<ul>'; list = true; } out += `<li class="${/^\s{2,}/.test(l) ? 'sub' : ''}">${inline(l.replace(/^\s*-\s+/, ''))}</li>`; }
    else if (l.trim() === '') closeList();
    else { closeList(); out += '<p>' + inline(l) + '</p>'; }
    i++;
  }
  closeList(); return out;
}
function loadReadme() {
  const put = html => { const el = document.getElementById('md'); if (el) el.innerHTML = html; };
  if (readmeHtml) return put(readmeHtml);
  fetch('README.md').then(r => { if (!r.ok) throw 0; return r.text(); })
    .then(t => { readmeHtml = mdToHtml(t); put(readmeHtml); })
    .catch(() => put('<p>Could not load the README.</p>'));
}
function showPanel(name) {
  panel = name;
  uiEl.innerHTML = name ? `<div class="panel ${name === 'readme' ? 'wide' : name === 'shop' ? 'shopp' : ''}">${VIEWS[name]()}</div>` : '';
  if (name === 'readme') loadReadme();
  if (name === 'shop') { if (!prevId || !CARS[prevId] || CARS[prevId].kind !== shopTab) prevId = CARS[save.car].kind === shopTab ? save.car : Object.keys(CARS).find(k => CARS[k].kind === shopTab); if (!prevRaf) prevRaf = requestAnimationFrame(garageTick); }
}
function openSub(name) { if (['menu', 'pause', 'over'].includes(panel)) backTo = panel; showPanel(name); }

function act(a, arg) {
  Sound.sfx('ui');
  switch (a) {
    case 'play': start(false); break;
    case 'retry': start(false); break;
    case 'resume': resumeGame(); break;
    case 'quit': state = 'menu'; Sound.engine(0); Sound.siren(0); Sound.music(true); showPanel('menu'); break;
    case 'shop': case 'settings': case 'readme': case 'controls': openSub(a); break;
    case 'tab': shopTab = arg; prevId = null; showPanel('shop'); break;
    case 'prev': prevId = arg; showPanel('shop'); break;
    case 'back': showPanel(backTo || 'menu'); break;
    case 'car': {
      const b = CARS[arg]; shopTab = b.kind; prevId = arg;
      if (save.owned[arg]) save.car = arg;
      else if (save.coins >= b.cost) { save.coins -= b.cost; save.owned[arg] = true; save.car = arg; toast('Unlocked ' + b.name + '!'); }
      persist(); showPanel('shop'); break;
    }
    case 'up': {
      const lv = save.up[arg];
      if (lv < UP_MAX && save.coins >= UP_COST[lv]) { save.coins -= UP_COST[lv]; save.up[arg]++; persist(); }
      showPanel('shop'); break;
    }
    case 'toggle':
      save.settings[arg] = !save.settings[arg]; persist();
      if (arg === 'music') Sound.music(true);
      if (window.syncTopBtns) syncTopBtns();
      showPanel('settings'); break;
  }
}
uiEl.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.classList.contains('off')) { Sound.init(); act(b.dataset.act, b.dataset.arg); } });

// ---------- garage: big spinning preview, drawn with the game's own vehicle sprites ----------
function garageTick(now) {
  prevRaf = 0;
  const c = panel === 'shop' && document.getElementById('gprev');
  if (!c || !prevId || !CARS[prevId]) return;
  prevAng = now / 1000 * 0.9;
  const v = CARS[prevId], g = c.getContext('2d'), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.5); bg.addColorStop(0, '#3a4356'); bg.addColorStop(1, '#171b26');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(138,180,255,.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, h / 2, 150, 110, 0, 0, TAU); g.stroke();
  const sCtx = ctx, sU = U, sT = tmNow;
  ctx = g; U = 30; tmNow = now / 1000;
  try {
    ctx.save(); ctx.translate(w / 2, h / 2);
    if (v.kind === 'bike') drawBike(0, 0, prevAng, v.len * U, v.wid * U, v.col);
    else carSprite(0, 0, prevAng, v.len * U, v.wid * U, v.col, { stripe: v.stripe || null, roof: v.roof || null });
    ctx.restore();
  } finally { ctx = sCtx; U = sU; tmNow = sT; }
  prevRaf = requestAnimationFrame(garageTick);
}
