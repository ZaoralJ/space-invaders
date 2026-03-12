import { useEffect, useRef, useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Sound engine — all sounds synthesized via Web Audio API, no files needed
// ---------------------------------------------------------------------------
function createSoundEngine() {
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
          try { if (n.stop) n.stop(); } catch (_) {}
          try { n.disconnect(); } catch (_) {}
        }
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

const CANVAS_W = 800;
const CANVAS_H = 600;
const PLAYER_W = 48;
const PLAYER_H = 24;
const PLAYER_SPEED = 5;
const PLAYER_Y = CANVAS_H - 60;
const BULLET_SPEED = 10;
const ALIEN_BULLET_SPEED = 2.5;
const ALIEN_COLS = 11;
const ALIEN_ROWS = 5;
const ALIEN_W = 36;
const ALIEN_H = 24;
const ALIEN_PAD_X = 16;
const ALIEN_PAD_Y = 16;
const ALIEN_DROP = 20;
const BARRIER_COUNT = 4;
const BARRIER_W = 64;
const BARRIER_H = 36;
const BARRIER_Y = CANVAS_H - 130;

// Alien types: 0=squid(top), 1=crab(mid), 2=octopus(bottom)
const ALIEN_SCORES = [30, 20, 10];
const ALIEN_COLORS = ['#ff4edd', '#44d4ff', '#66ff66'];

// UFO
const UFO_Y = 50;
const UFO_W = 48;
const UFO_SPEED = 2.5;
const UFO_INTERVAL_MIN = 15000;
const UFO_INTERVAL_MAX = 25000;

function makeBarriers() {
  return Array.from({ length: BARRIER_COUNT }, (_, i) => {
    const bx = 100 + i * ((CANVAS_W - 200) / (BARRIER_COUNT - 1));
    // Each barrier is a grid of pixels (8x6 blocks of 8px)
    const cols = 8, rows = 6, bw = 8;
    const cells = Array.from({ length: rows }, () => Array(cols).fill(true));
    // Notch the bottom-center for player to stand under
    cells[4][3] = false; cells[4][4] = false;
    cells[5][2] = false; cells[5][3] = false; cells[5][4] = false; cells[5][5] = false;
    return { x: bx - (cols * bw) / 2, y: BARRIER_Y, cols, rows, bw, cells };
  });
}

function spawnAliens(level) {
  const aliens = [];
  // Each level, the starting Y is a little lower (more threatening)
  const startY = 80 + Math.min(level - 1, 5) * 8;
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      const type = r === 0 ? 0 : r <= 2 ? 1 : 2;
      aliens.push({
        col: c, row: r, type,
        x: 60 + c * (ALIEN_W + ALIEN_PAD_X),
        y: startY + r * (ALIEN_H + ALIEN_PAD_Y),
        alive: true, frame: 0,
      });
    }
  }
  return aliens;
}

function initialState() {
  return {
    playerX: CANVAS_W / 2 - PLAYER_W / 2,
    playerBullets: [],
    alienBullets: [],
    aliens: spawnAliens(1),
    barriers: makeBarriers(),
    alienDir: 1,
    alienMoveAccum: 0,
    score: 0,
    hiScore: 0,
    lives: 3,
    level: 1,
    phase: 'start', // start | playing | dead | levelup | gameover | win
    deadTimer: 0,
    levelupTimer: 0,
    ufo: null,
    ufoNextIn: UFO_INTERVAL_MIN + Math.random() * (UFO_INTERVAL_MAX - UFO_INTERVAL_MIN),
    ufoScore: null,
    ufoScoreTimer: 0,
    frame: 0,
    alienFrame: 0,
    alienFrameTimer: 0,
    shootCooldown: 0,
    flashTimer: 0,
  };
}

function drawPlayer(ctx, x, alive, flashTimer) {
  if (!alive) return;
  const alpha = flashTimer > 0 && Math.floor(flashTimer / 5) % 2 === 0 ? 0.3 : 1;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#33ff66';
  // Body
  ctx.fillRect(x + 14, PLAYER_Y + 10, 20, 14);
  // Cockpit
  ctx.fillRect(x + 20, PLAYER_Y + 4, 8, 10);
  // Wings
  ctx.fillRect(x, PLAYER_Y + 16, 48, 8);
  // Gun
  ctx.fillRect(x + 22, PLAYER_Y, 4, 6);
  ctx.globalAlpha = 1;
}

function drawAlien(ctx, alien, frame) {
  if (!alien.alive) return;
  const { x, y, type } = alien;
  const f = frame % 2;
  ctx.fillStyle = ALIEN_COLORS[type];

  if (type === 0) {
    // Squid
    if (f === 0) {
      ctx.fillRect(x + 12, y, 12, 4);
      ctx.fillRect(x + 8, y + 4, 20, 4);
      ctx.fillRect(x + 4, y + 8, 28, 8);
      ctx.fillRect(x + 4, y + 16, 4, 4); ctx.fillRect(x + 14, y + 16, 8, 4); ctx.fillRect(x + 28, y + 16, 4, 4);
      ctx.fillRect(x, y + 20, 4, 4); ctx.fillRect(x + 32, y + 20, 4, 4);
    } else {
      ctx.fillRect(x + 12, y, 12, 4);
      ctx.fillRect(x + 8, y + 4, 20, 4);
      ctx.fillRect(x + 4, y + 8, 28, 8);
      ctx.fillRect(x + 8, y + 16, 4, 4); ctx.fillRect(x + 24, y + 16, 4, 4);
      ctx.fillRect(x + 4, y + 20, 4, 4); ctx.fillRect(x + 28, y + 20, 4, 4);
    }
  } else if (type === 1) {
    // Crab
    if (f === 0) {
      ctx.fillRect(x + 4, y, 4, 4); ctx.fillRect(x + 28, y, 4, 4);
      ctx.fillRect(x + 4, y + 4, 28, 4);
      ctx.fillRect(x, y + 8, 36, 8);
      ctx.fillRect(x + 8, y + 16, 20, 4);
      ctx.fillRect(x + 4, y + 20, 4, 4); ctx.fillRect(x + 28, y + 20, 4, 4);
      ctx.fillRect(x, y + 20, 4, 4); ctx.fillRect(x + 32, y + 20, 4, 4);
    } else {
      ctx.fillRect(x + 4, y, 4, 4); ctx.fillRect(x + 28, y, 4, 4);
      ctx.fillRect(x + 4, y + 4, 28, 4);
      ctx.fillRect(x, y + 8, 36, 8);
      ctx.fillRect(x + 8, y + 16, 20, 4);
      ctx.fillRect(x + 8, y + 20, 4, 4); ctx.fillRect(x + 24, y + 20, 4, 4);
      ctx.fillRect(x + 4, y + 20, 4, 4); ctx.fillRect(x + 28, y + 20, 4, 4);
    }
  } else {
    // Octopus
    if (f === 0) {
      ctx.fillRect(x + 8, y, 20, 4);
      ctx.fillRect(x + 4, y + 4, 28, 4);
      ctx.fillRect(x, y + 8, 36, 8);
      ctx.fillRect(x + 8, y + 16, 20, 4);
      ctx.fillRect(x + 4, y + 20, 4, 4); ctx.fillRect(x + 12, y + 20, 4, 4);
      ctx.fillRect(x + 20, y + 20, 4, 4); ctx.fillRect(x + 28, y + 20, 4, 4);
    } else {
      ctx.fillRect(x + 8, y, 20, 4);
      ctx.fillRect(x + 4, y + 4, 28, 4);
      ctx.fillRect(x, y + 8, 36, 8);
      ctx.fillRect(x + 8, y + 16, 20, 4);
      ctx.fillRect(x, y + 20, 8, 4); ctx.fillRect(x + 12, y + 20, 4, 4);
      ctx.fillRect(x + 20, y + 20, 4, 4); ctx.fillRect(x + 28, y + 20, 8, 4);
    }
  }
}

function drawUFO(ctx, ufo) {
  if (!ufo) return;
  const { x } = ufo;
  const y = UFO_Y;
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(x + 12, y, 24, 4);
  ctx.fillRect(x + 6, y + 4, 36, 8);
  ctx.fillRect(x, y + 12, 48, 8);
  ctx.fillRect(x + 6, y + 20, 6, 4); ctx.fillRect(x + 18, y + 20, 6, 4);
  ctx.fillRect(x + 30, y + 20, 6, 4); ctx.fillRect(x + 36, y + 20, 6, 4);
}

function drawBarrier(ctx, barrier) {
  const { x, y, cols, rows, bw, cells } = barrier;
  ctx.fillStyle = '#33cc44';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cells[r][c]) {
        ctx.fillRect(x + c * bw, y + r * bw, bw, bw);
      }
    }
  }
}

function drawBullet(ctx, b, isPlayer) {
  ctx.fillStyle = isPlayer ? '#ffffff' : '#ff8800';
  if (isPlayer) {
    ctx.fillRect(b.x - 1, b.y, 3, 12);
  } else {
    // Zigzag alien bullet
    const seg = Math.floor(b.y / 4) % 2;
    ctx.fillRect(b.x + (seg ? 2 : -2), b.y, 3, 4);
    ctx.fillRect(b.x + (seg ? -2 : 2), b.y + 4, 3, 4);
    ctx.fillRect(b.x + (seg ? 2 : -2), b.y + 8, 3, 4);
  }
}

function drawExplosion(ctx, x, y, timer) {
  ctx.fillStyle = `rgba(255, 200, 0, ${timer / 30})`;
  ctx.fillRect(x - 10, y - 10, 20, 20);
  ctx.fillStyle = `rgba(255, 100, 0, ${timer / 30})`;
  ctx.fillRect(x - 6, y - 14, 12, 8);
  ctx.fillRect(x - 14, y - 6, 8, 12);
  ctx.fillRect(x + 6, y - 6, 8, 12);
  ctx.fillRect(x - 6, y + 6, 12, 8);
}

function collidesWithBarrier(barrier, bx, by, bw2, bh) {
  const { x, y, cols, rows, bw, cells } = barrier;
  if (bx + bw2 < x || bx > x + cols * bw || by + bh < y || by > y + rows * bw) return false;
  let hit = false;
  for (let r = 0; r < rows && !hit; r++) {
    for (let c = 0; c < cols && !hit; c++) {
      if (!cells[r][c]) continue;
      const cx = x + c * bw, cy = y + r * bw;
      if (bx < cx + bw && bx + bw2 > cx && by < cy + bw && by + bh > cy) {
        cells[r][c] = false;
        hit = true;
      }
    }
  }
  return hit;
}

// ---------------------------------------------------------------------------
// Auto-play AI — returns synthetic key state for the current frame
// ---------------------------------------------------------------------------
function computeAutoInputs(s) {
  const alive = s.aliens.filter(a => a.alive);
  const playerCX = s.playerX + PLAYER_W / 2;

  // 1. Dodge: find bullets that will hit the player column in the next ~80px
  const dangerous = s.alienBullets.filter(b =>
    Math.abs(b.x - playerCX) < PLAYER_W + 8 && b.y > PLAYER_Y - 160
  );
  if (dangerous.length > 0) {
    // Evade toward the side with more space
    const threat = dangerous.reduce((a, b) => b.y > a.y ? b : a);
    const evadeRight = threat.x < playerCX && s.playerX + PLAYER_W < CANVAS_W - 10;
    const evadeLeft  = threat.x >= playerCX && s.playerX > 10;
    // Also shoot while evading if already aimed at something
    const shoot = s.alienBullets.length > 0;
    return { ArrowLeft: evadeLeft, ArrowRight: evadeRight, Space: shoot };
  }

  // 2. Pick target: highest-scoring alien in the bottom-most occupied row
  if (alive.length === 0) return { ArrowLeft: false, ArrowRight: false, Space: false };
  const maxY = Math.max(...alive.map(a => a.y));
  const bottomRow = alive.filter(a => a.y >= maxY - 4);
  // Among bottom row prefer high-value (squid=30pts) first, else closest
  const target = bottomRow.reduce((best, a) => {
    if (ALIEN_SCORES[a.type] > ALIEN_SCORES[best.type]) return a;
    if (ALIEN_SCORES[a.type] === ALIEN_SCORES[best.type]) {
      return Math.abs((a.x + ALIEN_W / 2) - playerCX) <
             Math.abs((best.x + ALIEN_W / 2) - playerCX) ? a : best;
    }
    return best;
  });

  const targetCX = target.x + ALIEN_W / 2;
  const diff = targetCX - playerCX;
  const tolerance = 4;
  const aligned = Math.abs(diff) <= ALIEN_W * 0.8;

  return {
    ArrowLeft:  diff < -tolerance,
    ArrowRight: diff >  tolerance,
    Space: aligned,
  };
}

export default function SpaceInvaders() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const keysRef = useRef({});
  const rafRef = useRef(null);
  const explosionsRef = useRef([]);
  const soundRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const godModeRef = useRef(false);
  const autoPlayRef = useRef(false);
  const cheatBufferRef = useRef('');

  // Lazily create sound engine on first user interaction
  function getSound() {
    if (!soundRef.current) soundRef.current = createSoundEngine();
    return soundRef.current;
  }

  const toggleMute = useCallback(() => {
    const snd = getSound();
    const next = !snd.isMuted();
    snd.setMuted(next);
    setMuted(next);
  }, []);

  const reset = useCallback((keepHiScore = false) => {
    const prev = stateRef.current;
    stateRef.current = {
      ...initialState(),
      hiScore: keepHiScore ? Math.max(prev.hiScore, prev.score) : 0,
    };
    explosionsRef.current = [];
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
      }
      // Boot AudioContext on first keydown (browser autoplay policy)
      getSound();
      // A key — toggle auto-play
      if (e.code === 'KeyA') {
        autoPlayRef.current = !autoPlayRef.current;
        setAutoPlay(autoPlayRef.current);
      }
      // S key — toggle SFX mute
      if (e.code === 'KeyS') {
        const snd = getSound();
        const next = !snd.isSfxMuted();
        snd.setSfxMuted(next);
        setSfxMuted(next);
      }
      // IDDQD cheat code detection
      if (e.key.length === 1) {
        cheatBufferRef.current = (cheatBufferRef.current + e.key.toLowerCase()).slice(-5);
        if (cheatBufferRef.current === 'iddqd') {
          godModeRef.current = !godModeRef.current;
          setGodMode(godModeRef.current);
          cheatBufferRef.current = '';
        }
      }
    };
    const onKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      soundRef.current?.stopUFO();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const s = stateRef.current;
      const keys = keysRef.current;
      const exps = explosionsRef.current;

      const snd = soundRef.current;

      // Merge AI inputs when auto-play is on
      const ai = autoPlayRef.current ? computeAutoInputs(s) : null;
      const input = key => ai ? ai[key] : keys[key];

      // --- UPDATE ---
      if (s.phase === 'start') {
        if (keys['Space'] || keys['Enter'] || autoPlayRef.current) {
          s.phase = 'playing';
          snd?.startMusic();
        }
      } else if (s.phase === 'playing') {
        s.frame++;

        // Player movement
        if (input('ArrowLeft'))  s.playerX = Math.max(0, s.playerX - PLAYER_SPEED);
        if (input('ArrowRight')) s.playerX = Math.min(CANVAS_W - PLAYER_W, s.playerX + PLAYER_SPEED);

        // Shooting
        if (s.shootCooldown > 0) s.shootCooldown--;
        if (input('Space') && s.shootCooldown === 0 && s.playerBullets.length < 2) {
          s.playerBullets.push({ x: s.playerX + PLAYER_W / 2, y: PLAYER_Y });
          s.shootCooldown = 20;
          snd?.playShoot();
        }

        // Move player bullets
        s.playerBullets = s.playerBullets.filter(b => {
          b.y -= BULLET_SPEED;
          if (b.y < 0) return false;
          // Hit barrier
          for (const bar of s.barriers) {
            if (collidesWithBarrier(bar, b.x - 1, b.y, 3, 12)) return false;
          }
          // Hit alien
          for (const alien of s.aliens) {
            if (!alien.alive) continue;
            if (b.x > alien.x && b.x < alien.x + ALIEN_W && b.y > alien.y && b.y < alien.y + ALIEN_H) {
              alien.alive = false;
              s.score += ALIEN_SCORES[alien.type];
              exps.push({ x: alien.x + ALIEN_W / 2, y: alien.y + ALIEN_H / 2, timer: 30 });
              snd?.playAlienKilled();
              return false;
            }
          }
          // Hit UFO
          if (s.ufo) {
            if (b.x > s.ufo.x && b.x < s.ufo.x + UFO_W && b.y > UFO_Y && b.y < UFO_Y + 24) {
              const pts = [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)];
              s.score += pts;
              s.ufoScore = pts;
              s.ufoScoreTimer = 80;
              exps.push({ x: s.ufo.x + UFO_W / 2, y: UFO_Y + 12, timer: 30 });
              snd?.stopUFO();
              snd?.playUFOKilled();
              s.ufo = null;
              return false;
            }
          }
          return true;
        });

        // Alien movement — speed scales with level + kills remaining
        s.alienFrameTimer++;
        const aliveCount = s.aliens.filter(a => a.alive).length;
        const levelMult = 1 + (s.level - 1) * 0.18;  // 1.0 → 2.62 across 10 levels
        const killMult  = 1 + (ALIEN_COLS * ALIEN_ROWS - aliveCount) / (ALIEN_COLS * ALIEN_ROWS) * 2;
        const moveInterval = Math.max(3, Math.floor(50 / (levelMult * killMult)));
        if (s.alienFrameTimer >= moveInterval) {
          s.alienFrameTimer = 0;
          s.alienFrame++;
          snd?.playMarch();

          // Check edges
          const alive = s.aliens.filter(a => a.alive);
          if (alive.length === 0) {
            if (s.level >= 10) {
              s.phase = 'win';
              snd?.stopMusic();
              snd?.playWin();
            } else {
              s.phase = 'levelup';
              s.levelupTimer = 180; // ~3 s
              snd?.playWin();
            }
          } else {
            const minX = Math.min(...alive.map(a => a.x));
            const maxX = Math.max(...alive.map(a => a.x + ALIEN_W));
            let drop = false;
            if ((s.alienDir === 1 && maxX >= CANVAS_W - 10) ||
                (s.alienDir === -1 && minX <= 10)) {
              s.alienDir *= -1;
              drop = true;
            }
            for (const a of s.aliens) {
              if (!a.alive) continue;
              a.x += s.alienDir * (ALIEN_W * 0.4);
              if (drop) a.y += ALIEN_DROP;
              a.frame = s.alienFrame;
            }

            // Check if aliens reached player
            const lowest = Math.max(...alive.map(a => a.y + ALIEN_H));
            if (lowest >= PLAYER_Y) {
              s.lives = 0;
              s.phase = 'gameover';
              snd?.stopMusic();
              snd?.playGameOver();
            }
          }
        }

        // Alien shooting — rate increases each level (45 → 18 frames)
        const shootInterval = Math.max(30, 75 - (s.level - 1) * 5);
        if (s.frame % shootInterval === 0) {
          const alive = s.aliens.filter(a => a.alive);
          if (alive.length > 0) {
            // Pick bottom-most alien in random column
            const cols = [...new Set(alive.map(a => a.col))];
            const col = cols[Math.floor(Math.random() * cols.length)];
            const colAliens = alive.filter(a => a.col === col);
            const shooter = colAliens.reduce((prev, cur) => (cur.y > prev.y ? cur : prev));
            s.alienBullets.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H });
          }
        }

        // Move alien bullets
        s.alienBullets = s.alienBullets.filter(b => {
          b.y += ALIEN_BULLET_SPEED;
          if (b.y > CANVAS_H) return false;
          // Hit barrier
          for (const bar of s.barriers) {
            if (collidesWithBarrier(bar, b.x - 1, b.y, 3, 12)) return false;
          }
          // Hit player
          if (!godModeRef.current && s.flashTimer <= 0 &&
              b.x > s.playerX && b.x < s.playerX + PLAYER_W &&
              b.y > PLAYER_Y && b.y < PLAYER_Y + PLAYER_H) {
            s.lives--;
            exps.push({ x: s.playerX + PLAYER_W / 2, y: PLAYER_Y + PLAYER_H / 2, timer: 30 });
            snd?.playPlayerHit();
            if (s.lives <= 0) {
              s.phase = 'gameover';
              snd?.stopMusic();
              snd?.playGameOver();
            } else {
              s.phase = 'dead';
              s.deadTimer = 120;
            }
            return false;
          }
          return true;
        });

        // UFO
        if (s.ufoNextIn > 0) {
          s.ufoNextIn -= 16;
        } else if (!s.ufo) {
          s.ufo = { x: -UFO_W, dir: 1 };
          snd?.startUFO();
        }
        if (s.ufo) {
          s.ufo.x += UFO_SPEED * s.ufo.dir;
          if (s.ufo.x > CANVAS_W + UFO_W) {
            snd?.stopUFO();
            s.ufo = null;
            s.ufoNextIn = UFO_INTERVAL_MIN + Math.random() * (UFO_INTERVAL_MAX - UFO_INTERVAL_MIN);
          }
        }
        if (s.ufoScoreTimer > 0) s.ufoScoreTimer--;

        // Flash timer
        if (s.flashTimer > 0) s.flashTimer--;

      } else if (s.phase === 'dead') {
        s.deadTimer--;
        if (s.deadTimer <= 0) {
          s.phase = 'playing';
          s.playerX = CANVAS_W / 2 - PLAYER_W / 2;
          s.flashTimer = 120;
          s.alienBullets = [];
        }
      } else if (s.phase === 'levelup') {
        s.levelupTimer--;
        if (s.levelupTimer <= 0) {
          s.level++;
          s.aliens = spawnAliens(s.level);
          s.alienDir = 1;
          s.alienFrame = 0;
          s.alienFrameTimer = 0;
          s.playerBullets = [];
          s.alienBullets = [];
          snd?.stopUFO();
          s.ufo = null;
          s.ufoNextIn = UFO_INTERVAL_MIN + Math.random() * (UFO_INTERVAL_MAX - UFO_INTERVAL_MIN);
          s.phase = 'playing';
        }
      } else if (s.phase === 'gameover' || s.phase === 'win') {
        if (keys['Space'] || keys['Enter'] || autoPlayRef.current) {
          s.hiScore = Math.max(s.hiScore, s.score);
          snd?.stopMusic();
          reset(true);
          stateRef.current.hiScore = s.hiScore;
          stateRef.current.phase = 'start';
        }
      }

      // Explosions
      explosionsRef.current = exps.filter(e => {
        e.timer--;
        return e.timer > 0;
      });

      // --- DRAW ---
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      // Static stars using seeded positions
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137.508 + 42) % 1) * CANVAS_W;
        const sy = ((i * 97.13 + 17) % 1) * CANVAS_H;
        // Deterministic pseudo-random
        const px = Math.abs(Math.sin(i * 7.3)) * CANVAS_W;
        const py = Math.abs(Math.sin(i * 13.7)) * CANVAS_H;
        ctx.fillRect(px | 0, py | 0, 1, 1);
      }

      // HUD
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('SCORE', 20, 28);
      ctx.fillStyle = '#ffff00';
      ctx.fillText(String(s.score).padStart(5, '0'), 20, 48);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HI-SCORE', CANVAS_W / 2 - 52, 28);
      ctx.fillStyle = '#ffff00';
      ctx.fillText(String(s.hiScore).padStart(5, '0'), CANVAS_W / 2 - 28, 48);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('LEVEL', CANVAS_W / 2 - 24, CANVAS_H - 20);
      ctx.fillStyle = '#44d4ff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${s.level}/10`, CANVAS_W / 2 - 18, CANVAS_H - 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('LIVES', CANVAS_W - 120, 28);
      for (let i = 0; i < s.lives; i++) {
        ctx.fillStyle = '#33ff66';
        ctx.fillRect(CANVAS_W - 110 + i * 28, 36, 20, 10);
        ctx.fillRect(CANVAS_W - 106 + i * 28, 32, 12, 6);
        ctx.fillRect(CANVAS_W - 108 + i * 28, 30, 4, 4);
      }

      // Ground line
      ctx.fillStyle = '#33ff66';
      ctx.fillRect(0, CANVAS_H - 36, CANVAS_W, 2);

      // Score legend
      ctx.font = '11px monospace';
      const legend = [
        { color: '#ff3333', label: '= ? pts', y: UFO_Y + 8 },
        { color: '#ff4edd', label: '= 30 pts', y: UFO_Y + 28 },
        { color: '#44d4ff', label: '= 20 pts', y: UFO_Y + 44 },
        { color: '#66ff66', label: '= 10 pts', y: UFO_Y + 60 },
      ];

      if (s.phase === 'start') {
        // Draw mini aliens for legend
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(CANVAS_W / 2 - 160, UFO_Y + 2, 24, 8); ctx.fillRect(CANVAS_W / 2 - 148, UFO_Y - 2, 8, 4);
        ctx.fillStyle = '#ff4edd';
        ctx.fillRect(CANVAS_W / 2 - 162, UFO_Y + 18, 28, 14);
        ctx.fillStyle = '#44d4ff';
        ctx.fillRect(CANVAS_W / 2 - 162, UFO_Y + 34, 28, 14);
        ctx.fillStyle = '#66ff66';
        ctx.fillRect(CANVAS_W / 2 - 162, UFO_Y + 50, 28, 14);
        for (const { color, label, y } of legend) {
          ctx.fillStyle = color;
          ctx.fillText(label, CANVAS_W / 2 - 125, y);
        }
      }

      // Barriers
      for (const bar of s.barriers) drawBarrier(ctx, bar);

      // Aliens
      for (const alien of s.aliens) drawAlien(ctx, alien, s.alienFrame);

      // UFO
      drawUFO(ctx, s.ufo);
      if (s.ufoScoreTimer > 0 && s.ufoScore) {
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`+${s.ufoScore}`, s.ufo ? s.ufo.x + 10 : CANVAS_W / 2, UFO_Y);
      }

      // Player bullets
      for (const b of s.playerBullets) drawBullet(ctx, b, true);
      // Alien bullets
      for (const b of s.alienBullets) drawBullet(ctx, b, false);

      // Player
      if (s.phase !== 'gameover') {
        if (godModeRef.current) {
          // Gold aura
          ctx.save();
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 18;
          ctx.fillStyle = 'rgba(255,215,0,0.15)';
          ctx.fillRect(s.playerX - 6, PLAYER_Y - 6, PLAYER_W + 12, PLAYER_H + 12);
          ctx.restore();
        }
        drawPlayer(ctx, s.playerX, s.phase !== 'dead' || s.deadTimer > 90, s.flashTimer);
      }

      // Auto-play HUD tag
      if (autoPlayRef.current) {
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = `hsl(${(Date.now() / 20) % 360}, 100%, 65%)`;
        ctx.fillText('AUTO', CANVAS_W - 48, CANVAS_H - 56);
      }

      // God-mode HUD tag
      if (godModeRef.current) {
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('IDDQD', CANVAS_W - 60, CANVAS_H - 42);
      }

      // SFX-muted indicator
      if (soundRef.current?.isSfxMuted()) {
        ctx.font = '11px monospace';
        ctx.fillStyle = '#555';
        ctx.fillText('SFX OFF', CANVAS_W - 62, CANVAS_H - 28);
      }

      // Explosions
      for (const e of explosionsRef.current) drawExplosion(ctx, e.x, e.y, e.timer);

      // Overlays
      if (s.phase === 'start') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(CANVAS_W / 2 - 200, 160, 400, 180);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', CANVAS_W / 2, 210);
        ctx.fillText('INVADERS', CANVAS_W / 2, 260);
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px monospace';
        const blink = Math.floor(Date.now() / 500) % 2 === 0;
        if (blink) ctx.fillText('PRESS SPACE TO START', CANVAS_W / 2, 310);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '13px monospace';
        ctx.fillText('← → Move    SPACE Shoot', CANVAS_W / 2 - 115, CANVAS_H - 12);
      }

      if (s.phase === 'levelup') {
        const progress = 1 - s.levelupTimer / 180;
        const alpha = progress < 0.15 ? progress / 0.15 : progress > 0.75 ? (1 - progress) / 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,20,0.75)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#44d4ff';
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${s.level + 1}`, CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        const speedLabel = ['', 'EASY', 'EASY', 'NORMAL', 'NORMAL', 'NORMAL', 'HARD', 'HARD', 'HARD', 'INSANE', 'INSANE'][s.level + 1] || '';
        ctx.fillText(speedLabel, CANVAS_W / 2, CANVAS_H / 2 + 24);
        ctx.textAlign = 'left';
        ctx.restore();
      }

      if (s.phase === 'win') {
        ctx.fillStyle = 'rgba(0,0,20,0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px monospace';
        ctx.fillText(`SCORE: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const blink = Math.floor(Date.now() / 500) % 2 === 0;
        if (blink) ctx.fillText('PRESS SPACE TO PLAY AGAIN', CANVAS_W / 2, CANVAS_H / 2 + 60);
        ctx.textAlign = 'left';
      }

      if (s.phase === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,20,0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px monospace';
        ctx.fillText(`SCORE: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const blink = Math.floor(Date.now() / 500) % 2 === 0;
        if (blink) ctx.fillText('PRESS SPACE TO PLAY AGAIN', CANVAS_W / 2, CANVAS_H / 2 + 60);
        ctx.textAlign = 'left';
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reset]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#000011',
      fontFamily: 'monospace',
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        tabIndex={0}
        style={{
          border: '2px solid #33ff66',
          boxShadow: '0 0 30px rgba(51,255,102,0.3)',
          cursor: 'none',
          outline: 'none',
        }}
        onClick={e => e.target.focus()}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12 }}>
        <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
          Click the canvas then use ← → to move, SPACE to shoot, <span style={{ color: sfxMuted ? '#888' : '#555' }}>S = SFX {sfxMuted ? 'off' : 'on'}</span>
        </p>
        <button
          onClick={toggleMute}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: 4,
            color: muted ? '#555' : '#33ff66',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 13,
            padding: '4px 10px',
          }}
        >
          {muted ? '🔇 unmute' : '🔊 mute'}
        </button>
      </div>
    </div>
  );
}
