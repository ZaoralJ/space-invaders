# Space Invaders

A faithful recreation of the classic 1978 arcade game built with React and Vite, rendered on an HTML5 canvas with procedurally synthesized audio — no assets, no dependencies beyond React.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:5173, click the canvas to focus it, then use the controls below.

**Hosted:** https://zaorali.github.io/space-invaders/

## Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move left / right |
| `Space` | Shoot |
| `Space` / `Enter` | Start / restart game |
| `A` | Toggle auto-play (AI takes over) |
| `S` | Toggle SFX on / off (music keeps playing) |
| `iddqd` | Type during play to toggle god mode |

## Features

### Gameplay
- **55 aliens** in a 5×11 grid, three types — squid (30 pts), crab (20 pts), octopus (10 pts)
- Authentic **2-frame pixel-art sprite animations** for every alien type
- **4 destructible barriers** — each 8×6 block erodes individually from both player and alien fire
- **UFO** flies across the top at random intervals, worth 50–300 bonus points
- **Score & hi-score** tracked within the session; lives displayed as mini ship icons

### 10-Level Progression

| Level | Base speed | Shoot interval | Difficulty |
|-------|------------|----------------|------------|
| 1–2   | ×1.0       | 75 frames      | Easy       |
| 3–4   | ×1.36      | 65 frames      | Easy       |
| 5–6   | ×1.72      | 55 frames      | Normal     |
| 7–8   | ×2.08      | 45 frames      | Hard       |
| 9–10  | ×2.44+     | 35–30 frames   | Insane     |

Speed also ramps up mid-wave as aliens are killed. A level-up transition screen shows the incoming difficulty before the next wave spawns. Clearing level 10 triggers the win screen.

### Audio (all procedurally synthesized — no audio files)
- **Ambient space music** — deep bass drone, Am pentatonic chord pad with slow LFO drift, high-frequency shimmer, and a melodic arpeggio with echo/delay feedback
- **Sound effects** — player shoot, alien explosion, UFO warble drone, player hit, alien march beat, game over, win fanfare
- Music fades in when the game starts and fades out on game over / win
- **Mute button** silences everything; **`S` key** mutes SFX only, leaving music playing

### Extras
- **Auto-play mode** (`A`) — AI plays the game automatically:
  - Dodges incoming bullets by evading toward the open side
  - Targets the lowest alien row, prioritising high-value squids
  - Shoots when aligned within the target's width
  - Auto-starts and auto-restarts — leave it running as a screensaver
- **IDDQD god mode** — type `iddqd` at any time to toggle invincibility; alien bullets pass through the player, golden aura rendered around the ship
- Rainbow **AUTO** / gold **IDDQD** / grey **SFX OFF** HUD tags in the canvas corner

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- HTML5 Canvas API
- Web Audio API
- GitHub Actions + GitHub Pages (CI/CD)
