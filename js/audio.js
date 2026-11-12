// ---------- procedural audio (Web Audio, no files) ----------
const Sound = (() => {
  let ac = null, master, sfxG, musG, noise, eng, engG, sir, sirG, sirLfo, timer = null, nextT = 0, step = 0, mood = 'calm', musicOn = false;
  const SC = [0, 3, 5, 7, 10];

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
      sfxG = ac.createGain(); sfxG.connect(master);
      musG = ac.createGain(); musG.gain.value = 0.5; musG.connect(master);
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      eng = ac.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 50;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
      engG = ac.createGain(); engG.gain.value = 0;
      eng.connect(f); f.connect(engG); engG.connect(sfxG); eng.start();
      sir = ac.createOscillator(); sir.type = 'triangle'; sir.frequency.value = 800;
      sirLfo = ac.createOscillator(); sirLfo.frequency.value = 0.9; const lg = ac.createGain(); lg.gain.value = 260;
      sirLfo.connect(lg); lg.connect(sir.frequency); sirG = ac.createGain(); sirG.gain.value = 0;
      sir.connect(sirG); sirG.connect(sfxG); sir.start(); sirLfo.start();
    } catch (e) { ac = null; }
    if (ac) music(true); // music runs on every screen once audio is unlocked
  }
  function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
    const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(sfxG); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function burst(dur, f0, f1, type = 'lowpass', vol = 0.4) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), t0 = ac.currentTime;
    s.buffer = noise; fl.type = type; fl.frequency.setValueAtTime(f0, t0); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(sfxG); s.start(t0); s.stop(t0 + dur + 0.02);
  }
  const S = {
    explode() { burst(0.5, 1800, 120, 'lowpass', 0.5); tone(120, 40, 0.4, 'sine', 0.4); },
    big()     { burst(1.0, 2200, 80, 'lowpass', 0.7); tone(90, 30, 0.8, 'sine', 0.5); },
    splash()  { burst(0.18, 3500, 1500, 'highpass', 0.12); },
    coin()    { tone(988, 988, 0.07, 'square', 0.06); tone(1319, 1319, 0.12, 'square', 0.06, 0.07); },
    bill()    { tone(784, 784, 0.08, 'triangle', 0.12); tone(1047, 1047, 0.08, 'triangle', 0.12, 0.07); tone(1568, 1568, 0.22, 'sine', 0.14, 0.14); tone(3136, 3136, 0.18, 'sine', 0.04, 0.14); burst(0.05, 6000, 6000, 'highpass', 0.06); },
    power()   { [523, 659, 784].forEach((f, i) => tone(f, f, 0.1, 'triangle', 0.15, i * 0.07)); },
    chest()   { [392, 523, 659, 784].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.15, i * 0.06)); },
    dash()    { burst(0.3, 500, 2500, 'bandpass', 0.3); },
    shoot()   { tone(700, 120, 0.25, 'sawtooth', 0.1); },
    thunder() { burst(2.2, 700, 40, 'lowpass', 0.9); tone(60, 28, 1.6, 'sawtooth', 0.18); burst(1.2, 300, 40, 'lowpass', 0.5); },
    warn()    { tone(880, 880, 0.07, 'square', 0.05); },
    roar()    { tone(110, 45, 0.9, 'sawtooth', 0.22); burst(0.8, 400, 60, 'lowpass', 0.3); },
    shield()  { tone(300, 800, 0.2, 'triangle', 0.2); },
    die()     { burst(0.6, 2500, 80, 'lowpass', 0.7); tone(220, 40, 0.6, 'sawtooth', 0.25); },
    radio()   { burst(0.07, 3500, 3500, 'bandpass', 0.14); tone(1700, 1700, 0.05, 'square', 0.035); tone(1200, 1200, 0.04, 'square', 0.03, 0.09); burst(0.05, 3000, 3000, 'bandpass', 0.1); },
    ui()      { tone(600, 800, 0.06, 'square', 0.05); },
  };
  function sfx(n) { if (ac && save.settings.sound && S[n]) { try { S[n](); } catch (e) {} } }

  function osc(f, t0, d, type, v) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(musG); o.start(t0); o.stop(t0 + d + 0.05);
  }
  // drums for the music bus
  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(musG); o.start(t); o.stop(t + 0.22);
  }
  function nz(t, dur, ftype, freq, v) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; fl.type = ftype; fl.frequency.value = freq;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(musG); s.start(t); s.stop(t + dur + 0.02);
  }
  // A-minor chase: Am - Am - F - G, 16 steps per bar, driving 8th-note bass, arp lead, siren-like stabs
  const ROOTS = [57, 57, 53, 55];
  const ARP = [0, 7, 12, 7, 0, 7, 15, 7, 0, 7, 12, 19, 15, 12, 7, 12];
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);
  function sched() {
    if (!ac || !musicOn) return;
    const boss = mood === 'boss', bpm = boss ? 168 : 148, sp = 60 / bpm / 4;
    while (nextT < ac.currentTime + 0.3) {
      const t = nextT, st = step % 16, bar = (step >> 4) % 4, root = ROOTS[bar] - (boss ? 12 : 0);
      if (st % 4 === 0 || (boss && st % 16 === 10)) kick(t);
      if (st === 4 || st === 12) { nz(t, 0.16, 'highpass', 1500, 0.28); osc(190, t, 0.08, 'triangle', 0.12); }
      if (st % 2 === 0) nz(t, 0.04, 'highpass', 7000, st % 4 === 2 ? 0.14 : 0.08);
      else if (boss || bar === 3) nz(t, 0.025, 'highpass', 8000, 0.05);
      if (st % 2 === 0 || st === 15) osc(mf(root - 12), t, sp * 1.7, 'sawtooth', boss ? 0.11 : 0.09); // bass
      const lead = boss || (step >> 6) % 2 === 1; // lead enters on every second 4-bar phrase
      if (lead) osc(mf(root + 12 + ARP[st]), t, sp * 0.9, 'square', 0.035);
      if (st === 0 || st === 6 || st === 10) { osc(mf(root + 12), t, sp * 2, 'sawtooth', 0.035); osc(mf(root + 19), t, sp * 2, 'sawtooth', 0.03); } // stabs
      if (bar === 3 && st >= 12) nz(t, 0.05, 'highpass', 3000, 0.1); // fill into the loop
      nextT += sp; step++;
    }
  }
  function music(on) {
    musicOn = on && save.settings.music;
    if (!ac) return;
    if (musicOn && !timer) { nextT = ac.currentTime + 0.05; timer = setInterval(sched, 100); }
    if (!musicOn && timer) { clearInterval(timer); timer = null; }
  }
  function engine(v) {
    if (!ac) return;
    engG.gain.setTargetAtTime(save.settings.sound && v > 0 ? 0.035 : 0, ac.currentTime, 0.1);
    eng.frequency.setTargetAtTime(45 + v * 0.8, ac.currentTime, 0.1);
  }
  function siren(v) {
    if (!ac) return;
    sirG.gain.setTargetAtTime(save.settings.sound && v > 0.02 ? 0.01 + 0.05 * v : 0, ac.currentTime, 0.15);
  }
  return { init, sfx, music, engine, siren, setMood: m => { mood = m; } };
})();
