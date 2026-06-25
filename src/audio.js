// ---------------------------------------------------------------------------
// Sound engine — all sounds synthesized via Web Audio API, no files needed
// ---------------------------------------------------------------------------
export function createSoundEngine() {
  let ctx = null;
  let ufoOsc = null, ufoGain = null;
  let marchStep = 0;
  const MARCH_FREQS = [160, 130, 100, 80];

  // ---- Music state ----
  let musicMasterGain = null;   // master gain for all music nodes
  let musicNodes = [];          // persistent oscillators/gains to stop later
  let arpeggioTimer = null;
  let arpeggioIdx = 0;
  // Am pentatonic up+down: A3 C4 D4 E4 G4 A4 G4 E4 D4 C4
  const ARP_NOTES = [220, 261.6, 293.7, 329.6, 392, 440, 392, 329.6, 293.7, 261.6];

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function resume() {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
  }

  // Generic envelope helper
  function playTone({ freq = 440, type = 'square', startFreq, endFreq,
    duration = 0.1, volume = 0.3, attack = 0.005, decay = 0, sustain = 1,
    release = 0.05, noise = false } = {}) {
    const c = getCtx();
    const now = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(volume, now + attack);
    if (decay > 0) g.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    g.gain.setValueAtTime(volume * sustain, now + duration - release);
    g.gain.linearRampToValueAtTime(0, now + duration);
    g.connect(c.destination);
    if (noise) {
      const bufLen = c.sampleRate * duration;
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(g);
      src.start(now);
    } else {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq ?? freq, now);
      if (endFreq !== undefined) osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
      osc.connect(g);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    }
  }

  // ---- SFX (volumes halved so music can breathe) ----
  function playShoot() {
    resume();
    playTone({ startFreq: 900, endFreq: 400, type: 'square', duration: 0.1, volume: 0.12 });
  }

  function playAlienKilled() {
    resume();
    playTone({ noise: true, duration: 0.18, volume: 0.18 });
    playTone({ startFreq: 600, endFreq: 80, type: 'sawtooth', duration: 0.2, volume: 0.09 });
  }

  function playPlayerHit() {
    resume();
    playTone({ noise: true, duration: 0.5, volume: 0.22 });
    playTone({ startFreq: 200, endFreq: 40, type: 'sawtooth', duration: 0.5, volume: 0.13 });
  }

  function playUFOKilled() {
    resume();
    playTone({ noise: true, duration: 0.3, volume: 0.2 });
    [400, 300, 180].forEach((f, i) => {
      const c2 = getCtx();
      const g = c2.createGain();
      g.gain.setValueAtTime(0.11, c2.currentTime + i * 0.07);
      g.gain.linearRampToValueAtTime(0, c2.currentTime + i * 0.07 + 0.06);
      g.connect(c2.destination);
      const osc = c2.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, c2.currentTime + i * 0.07);
      osc.connect(g);
      osc.start(c2.currentTime + i * 0.07);
      osc.stop(c2.currentTime + i * 0.07 + 0.07);
    });
  }

  function playMarch() {
    resume();
    const freq = MARCH_FREQS[marchStep % 4];
    marchStep++;
    playTone({ freq, type: 'square', duration: 0.06, volume: 0.09 });
  }

  function startUFO() {
    resume();
    const c2 = getCtx();
    if (ufoOsc) return;
    ufoGain = c2.createGain();
    ufoGain.gain.setValueAtTime(0.07, c2.currentTime);
    ufoGain.connect(c2.destination);
    ufoOsc = c2.createOscillator();
    ufoOsc.type = 'sawtooth';
    ufoOsc.frequency.setValueAtTime(110, c2.currentTime);
    const lfo = c2.createOscillator();
    lfo.frequency.setValueAtTime(8, c2.currentTime);
    const lfoGain = c2.createGain();
    lfoGain.gain.setValueAtTime(40, c2.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(ufoOsc.frequency);
    lfo.start();
    ufoOsc.connect(ufoGain);
    ufoOsc.start();
    ufoOsc._lfo = lfo;
  }

  function stopUFO() {
    if (ufoOsc) {
      // eslint-disable-next-line no-unused-vars
      try { if (ufoOsc._lfo) ufoOsc._lfo.stop(); ufoOsc.stop(); } catch (_) {}
      ufoOsc = null; ufoGain = null;
    }
  }

  function playGameOver() {
    resume();
    [[300, 0], [250, 0.3], [200, 0.6], [150, 0.9], [100, 1.2]].forEach(([f, t]) => {
      const c2 = getCtx();
      const g = c2.createGain();
      g.gain.setValueAtTime(0.15, c2.currentTime + t);
      g.gain.linearRampToValueAtTime(0, c2.currentTime + t + 0.25);
      g.connect(c2.destination);
      const osc = c2.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, c2.currentTime + t);
      osc.connect(g);
      osc.start(c2.currentTime + t);
      osc.stop(c2.currentTime + t + 0.26);
    });
  }

  function playWin() {
    resume();
    [[262, 0], [330, 0.15], [392, 0.3], [523, 0.45], [659, 0.65], [784, 0.85]].forEach(([f, t]) => {
      const c2 = getCtx();
      const g = c2.createGain();
      g.gain.setValueAtTime(0.13, c2.currentTime + t);
      g.gain.linearRampToValueAtTime(0, c2.currentTime + t + 0.18);
      g.connect(c2.destination);
      const osc = c2.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, c2.currentTime + t);
      osc.connect(g);
      osc.start(c2.currentTime + t);
      osc.stop(c2.currentTime + t + 0.19);
    });
  }

  // ---- Space music ----
  function startMusic() {
    if (musicMasterGain) return;
    resume();
    const c = getCtx();

    // Master gain — fades in over 4 s
    musicMasterGain = c.createGain();
    musicMasterGain.gain.setValueAtTime(0, c.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.18, c.currentTime + 4);
    musicMasterGain.connect(c.destination);

    // Delay/echo for arpeggio (feeds back into itself)
    const delay = c.createDelay(1.5);
    delay.delayTime.setValueAtTime(0.38, c.currentTime);
    const fbGain = c.createGain();
    fbGain.gain.setValueAtTime(0.42, c.currentTime);
    delay.connect(fbGain);
    fbGain.connect(delay);
    const delayOut = c.createGain();
    delayOut.gain.setValueAtTime(0.28, c.currentTime);
    delay.connect(delayOut);
    delayOut.connect(musicMasterGain);

    // Deep bass drone (two slightly detuned sines for warmth)
    [55, 55.4].forEach(f => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, c.currentTime);
      const g = c.createGain();
      g.gain.setValueAtTime(0.55, c.currentTime);
      osc.connect(g);
      g.connect(musicMasterGain);
      osc.start();
      musicNodes.push(osc, g);
    });

    // Slow bass tremolo LFO
    const bassLFO = c.createOscillator();
    bassLFO.frequency.setValueAtTime(0.07, c.currentTime);
    const bassLFOGain = c.createGain();
    bassLFOGain.gain.setValueAtTime(0.18, c.currentTime);
    bassLFO.connect(bassLFOGain);
    bassLFO.start();
    musicNodes.push(bassLFO, bassLFOGain);

    // Ambient pad — Am chord (A2 C3 E3 G3) slightly detuned pairs
    [110, 110.4, 130.8, 131.1, 164.8, 165.2, 196, 196.5].forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, c.currentTime);
      // Slow pitch drift via LFO
      const lfo = c.createOscillator();
      lfo.frequency.setValueAtTime(0.05 + i * 0.01, c.currentTime);
      const lfoG = c.createGain();
      lfoG.gain.setValueAtTime(0.3, c.currentTime);
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      lfo.start();
      const g = c.createGain();
      g.gain.setValueAtTime(0.09, c.currentTime);
      osc.connect(g);
      g.connect(musicMasterGain);
      osc.start();
      musicNodes.push(osc, g, lfo, lfoG);
    });

    // High shimmer — very quiet upper harmonics
    [880, 1100, 1320].forEach(f => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, c.currentTime);
      const g = c.createGain();
      g.gain.setValueAtTime(0.018, c.currentTime);
      osc.connect(g);
      g.connect(musicMasterGain);
      osc.start();
      musicNodes.push(osc, g);
    });

    // Arpeggio — scheduled melodic notes fed through the delay
    function scheduleArp() {
      if (!musicMasterGain) return;
      const c2 = getCtx();
      const freq = ARP_NOTES[arpeggioIdx % ARP_NOTES.length];
      arpeggioIdx++;
      const osc = c2.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, c2.currentTime);
      const g = c2.createGain();
      g.gain.setValueAtTime(0, c2.currentTime);
      g.gain.linearRampToValueAtTime(0.28, c2.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.9);
      osc.connect(g);
      g.connect(delay);         // wet (echoed)
      g.connect(musicMasterGain); // dry
      osc.start(c2.currentTime);
      osc.stop(c2.currentTime + 1.0);
    }
    scheduleArp();
    arpeggioTimer = setInterval(scheduleArp, 620);

    musicNodes.push(delay, fbGain, delayOut);
  }

  function stopMusic() {
    if (arpeggioTimer) { clearInterval(arpeggioTimer); arpeggioTimer = null; }
    if (musicMasterGain) {
      const c = getCtx();
      musicMasterGain.gain.cancelScheduledValues(c.currentTime);
      musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, c.currentTime);
      musicMasterGain.gain.linearRampToValueAtTime(0, c.currentTime + 1.2);
      const nodesToStop = [...musicNodes];
      musicNodes = [];
      const mg = musicMasterGain;
      musicMasterGain = null;
      setTimeout(() => {
        for (const n of nodesToStop) {
          // eslint-disable-next-line no-unused-vars
          try { if (n.stop) n.stop(); } catch (_) {}
          // eslint-disable-next-line no-unused-vars
          try { n.disconnect(); } catch (_) {}
        }
        // eslint-disable-next-line no-unused-vars
        try { mg.disconnect(); } catch (_) {}
      }, 1400);
    }
  }

  // ---- Mute (everything) ----
  let muted = false;
  function setMuted(val) {
    muted = val;
    if (val) {
      stopUFO();
      if (musicMasterGain) {
        const c = getCtx();
        musicMasterGain.gain.cancelScheduledValues(c.currentTime);
        musicMasterGain.gain.setValueAtTime(0, c.currentTime);
      }
    } else {
      if (musicMasterGain) {
        const c = getCtx();
        musicMasterGain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.3);
      }
    }
  }
  function isMuted() { return muted; }

  // ---- SFX-only mute (S key) ----
  let sfxMuted = false;
  function setSfxMuted(val) {
    sfxMuted = val;
    if (val) stopUFO();
  }
  function isSfxMuted() { return sfxMuted; }

  const guard    = fn => (...args) => { if (!muted && !sfxMuted) fn(...args); };
  const guardMusic = fn => (...args) => { if (!muted) fn(...args); };

  return {
    playShoot: guard(playShoot),
    playAlienKilled: guard(playAlienKilled),
    playPlayerHit: guard(playPlayerHit),
    playUFOKilled: guard(playUFOKilled),
    playMarch: guard(playMarch),
    startUFO: guard(startUFO),
    stopUFO,
    playGameOver: guard(playGameOver),
    playWin: guard(playWin),
    startMusic: guardMusic(startMusic),
    stopMusic,
    setMuted,
    isMuted,
    setSfxMuted,
    isSfxMuted,
  };
}
