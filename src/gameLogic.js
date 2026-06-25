import {
  BARRIER_COUNT, CANVAS_W, BARRIER_Y, ALIEN_ROWS, ALIEN_COLS, ALIEN_W, ALIEN_PAD_X,
  ALIEN_H, ALIEN_PAD_Y, PLAYER_W, PLAYER_Y, ALIEN_SCORES, UFO_INTERVAL_MIN, UFO_INTERVAL_MAX
} from './constants';

export function makeBarriers() {
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

export function spawnAliens(level) {
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

export function initialState() {
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
    winTimer: 0,
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

export function collidesWithBarrier(barrier, bx, by, bw2, bh) {
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
export function computeAutoInputs(s) {
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
