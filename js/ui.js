// ---------- DOM menus (menu, shop, settings, readme, pause, game over) ----------
const uiEl = document.getElementById('ui');
const toastEl = document.getElementById('toasts');
let panel = null, backTo = 'menu';

function toast(text) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; toastEl.appendChild(d);
  setTimeout(() => d.remove(), 3600);
}
const fmt = n => Math.floor(n).toLocaleString();

const VIEWS = {
  menu() {
    return `<h1>POLICE ESCAPE</h1>
      <p class="sub">Endless city · Best <b>${fmt(save.best)}</b> · <span class="coin">● ${fmt(save.coins)}</span></p>
      <button class="btn" data-act="play">PLAY</button>
      <div class="grid2">
        <button class="btn alt" data-act="shop">Shop</button>
        <button class="btn alt" data-act="settings">Settings</button>
      </div>
      <button class="btn alt" data-act="readme">How to play (README)</button>
      <p class="tip">${TOUCH ? 'Hold &amp; drag to steer · tap NITRO to dash' : 'Hold &amp; drag (or ← → / A D) to steer · Space = nitro · P = pause'}<br>Lure cops into buildings, parked cars and each other.</p>`;
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
      <p class="sub">Time ${Math.floor(r.time)}s · <span class="coin">+${r.coins} coins</span></p>
      <button class="btn" data-act="retry">Retry</button>
      <div class="grid2">
        <button class="btn alt" data-act="shop">Shop</button>
        <button class="btn alt" data-act="quit">Menu</button>
      </div>`;
  },
  shop() {
    let h = `<h2>SHOP</h2><p class="sub coin">● ${fmt(save.coins)}</p>`;
    for (const kind of ['car', 'bike']) {
      h += `<h3>${kind === 'car' ? 'Cars' : 'Bikes'}</h3><div class="sgrid">`;
      for (const id in CARS) {
        const b = CARS[id]; if (b.kind !== kind) continue;
        const owned = save.owned[id], sel = save.car === id;
        h += `<div class="row"><div><b>${b.name}</b><small>${b.desc}</small></div>` +
          (sel ? '<span class="tag">Selected</span>' : owned ? `<button class="btn sm" data-act="car" data-arg="${id}">Select</button>`
            : `<button class="btn sm ${save.coins < b.cost ? 'off' : ''}" data-act="car" data-arg="${id}">● ${b.cost}</button>`) + '</div>';
      }
      if (kind === 'car') h += '</div>';
    }
    h += '</div><h3>Upgrades</h3><div class="sgrid">';
    for (const k in UPGRADES) {
      const lv = save.up[k], u = UPGRADES[k];
      h += `<div class="row"><div><b>${u.name}</b><small>${u.desc}</small><span class="pips">${'●'.repeat(lv)}${'○'.repeat(UP_MAX - lv)}</span></div>` +
        (lv >= UP_MAX ? '<span class="tag">MAX</span>' : `<button class="btn sm ${save.coins < UP_COST[lv] ? 'off' : ''}" data-act="up" data-arg="${k}">● ${UP_COST[lv]}</button>`) + '</div>';
    }
    return h + '</div><button class="btn alt" data-act="back">Back</button>';
  },
  readme() {
    return '<h2>README</h2><div id="md" class="md">Loading...</div><button class="btn alt" data-act="back">Back</button>';
  },
  settings() {
    const s = save.settings, tg = (k, n) => `<div class="row"><b>${n}</b><button class="btn sm ${s[k] ? '' : 'alt'}" data-act="toggle" data-arg="${k}">${s[k] ? 'ON' : 'OFF'}</button></div>`;
    return '<h2>SETTINGS</h2>' + tg('sound', 'Sound effects') + tg('music', 'Music') + tg('haptics', 'Vibration') + '<button class="btn alt" data-act="back">Back</button>';
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
  uiEl.innerHTML = name ? `<div class="panel ${name === 'readme' ? 'wide' : ''}">${VIEWS[name]()}</div>` : '';
  if (name === 'readme') loadReadme();
}
function openSub(name) { if (['menu', 'pause', 'over'].includes(panel)) backTo = panel; showPanel(name); }

function act(a, arg) {
  Sound.sfx('ui');
  switch (a) {
    case 'play': start(false); break;
    case 'retry': start(false); break;
    case 'resume': resumeGame(); break;
    case 'quit': state = 'menu'; Sound.engine(0); Sound.siren(0); Sound.music(true); showPanel('menu'); break;
    case 'shop': case 'settings': case 'readme': openSub(a); break;
    case 'back': showPanel(backTo || 'menu'); break;
    case 'car': {
      const b = CARS[arg];
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
      if (arg === 'music') Sound.music(state !== 'pause');
      showPanel('settings'); break;
  }
}
uiEl.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.classList.contains('off')) { Sound.init(); act(b.dataset.act, b.dataset.arg); } });
