import { useEffect, useRef, useCallback, useState } from 'react';
import { createSoundEngine } from './audio';
import {
  initialState, computeAutoInputs, collidesWithBarrier, spawnAliens
} from './gameLogic';
import {
  CANVAS_W, CANVAS_H, PLAYER_W, PLAYER_H, PLAYER_Y, PLAYER_SPEED,
  BULLET_SPEED, ALIEN_BULLET_SPEED, ALIEN_COLS, ALIEN_ROWS,
  ALIEN_W, ALIEN_H, ALIEN_DROP, ALIEN_COLORS, ALIEN_SCORES,
  BARRIER_Y, UFO_Y, UFO_W, UFO_SPEED, UFO_INTERVAL_MIN, UFO_INTERVAL_MAX
} from './constants';

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

export default function SpaceInvaders() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const keysRef = useRef({});
  const rafRef = useRef(null);
  const explosionsRef = useRef([]);
  const winParticlesRef = useRef([]);
  const soundRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  
  // These are handled via refs to avoid re-renders but kept in state in original.
  // We remove state to avoid unused vars lint errors, as they are not used in JSX render.
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
    winParticlesRef.current = [];
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
        // setAutoPlay(autoPlayRef.current); // Removed unused state update
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
          // setGodMode(godModeRef.current); // Removed unused state update
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
          s.aliens = spawnAliens(s.level); // spawnAliens is imported
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
      } else if (s.phase === 'win') {
        s.winTimer++;
        // Spawn a new firework burst every 35 frames
        if (s.winTimer % 35 === 1) {
          const bx = 80 + Math.random() * (CANVAS_W - 160);
          const by = 60 + Math.random() * (CANVAS_H * 0.55);
          const hue = Math.random() * 360;
          for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 4;
            winParticlesRef.current.push({
              x: bx, y: by,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1,
              life: 1,
              decay: 0.012 + Math.random() * 0.018,
              hue: (hue + Math.random() * 40) % 360,
              size: 2 + Math.random() * 3,
            });
          }
        }
        // Tick particles
        winParticlesRef.current = winParticlesRef.current.filter(p => {
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.07; // gravity
          p.vx *= 0.97;
          p.life -= p.decay;
          return p.life > 0;
        });
        if (keys['Space'] || keys['Enter']) {
          s.hiScore = Math.max(s.hiScore, s.score);
          snd?.stopMusic();
          winParticlesRef.current = [];
          reset(true);
          stateRef.current.hiScore = s.hiScore;
          stateRef.current.phase = 'start';
        }
      } else if (s.phase === 'gameover') {
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
        // Removed unused sx, sy
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
        // Firework particles (drawn before the overlay so text stays on top)
        for (const p of winParticlesRef.current) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = `hsl(${p.hue},100%,65%)`;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Semi-transparent overlay for text legibility
        ctx.fillStyle = 'rgba(0,0,20,0.55)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Pulsing rainbow "YOU WIN!" title
        const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 200);
        ctx.save();
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 40);
        ctx.scale(pulse, pulse);
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `hsl(${(Date.now() / 8) % 360},100%,65%)`;
        ctx.fillText('YOU WIN!', 0, 0);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = '22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillStyle = '#ffff00';
        ctx.font = '14px monospace';
        ctx.fillText(`ALL 10 LEVELS CLEARED`, CANVAS_W / 2, CANVAS_H / 2 + 48);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const blink = Math.floor(Date.now() / 500) % 2 === 0;
        if (blink) ctx.fillText('PRESS SPACE TO PLAY AGAIN', CANVAS_W / 2, CANVAS_H / 2 + 76);
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
