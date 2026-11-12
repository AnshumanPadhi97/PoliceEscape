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
    power()   { [523, 659, 784].forEach((f, i) => tone(f, f, 0.1, 'triangle', 0.15, i * 0.07)); },
    chest()   { [392, 523, 659, 784].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.15, i * 0.06)); },
    dash()    { burst(0.3, 500, 2500, 'bandpass', 0.3); },
    shoot()   { tone(700, 120, 0.25, 'sawtooth', 0.1); },
    thunder() { burst(1.6, 500, 50, 'lowpass', 0.8); },
    warn()    { tone(880, 880, 0.07, 'square', 0.05); },
    roar()    { tone(110, 45, 0.9, 'sawtooth', 0.22); burst(0.8, 400, 60, 'lowpass', 0.3); },
    shield()  { tone(300, 800, 0.2, 'triangle', 0.2); },
    die()     { burst(1.2, 2500, 60, 'lowpass', 0.8); tone(200, 30, 1, 'sawtooth', 0.3); },
    ui()      { tone(600, 800, 0.06, 'square', 0.05); },
  };
  function sfx(n) { if (ac && save.settings.sound && S[n]) { try { S[n](); } catch (e) {} } }

  function osc(f, t0, d, type, v) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(musG); o.start(t0); o.stop(t0 + d + 0.05);
  }
  function sched() {
    if (!ac || !musicOn) return;
    const boss = mood === 'boss', sp = 60 / (boss ? 140 : 96) / 2, base = boss ? 55 : 110;
    while (nextT < ac.currentTime + 0.3) {
      if (step % 4 === 0) osc(base * Math.pow(2, [0, 0, 5, 3][(step >> 2) % 4] / 12), nextT, sp * 3, boss ? 'sawtooth' : 'triangle', boss ? 0.09 : 0.12);
      if (Math.random() < 0.65) osc(base * 4 * Math.pow(2, (SC[(Math.random() * 5) | 0] + (Math.random() < 0.3 ? 12 : 0)) / 12), nextT, sp * 0.9, 'triangle', 0.05);
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
