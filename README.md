# Space Invaders

A faithful recreation of the classic 1978 arcade game built with React and Vite, rendered on an HTML5 canvas with procedurally synthesized sound effects.

## Play

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move left / right |
| `Space` | Shoot |
| `Space` / `Enter` | Start / restart game |

Click the canvas first to focus it.

## Features

- **55 aliens** across 5 rows and 3 types (squid, crab, octopus) with authentic 2-frame pixel-art animations
- **Destructible barriers** — each block erodes individually from both player and alien fire
- **UFO** flies across the top at random intervals for bonus points (50–300)
- **10 levels** — alien speed and shoot rate increase each level; the grid starts slightly lower every wave
- **Procedural audio** — all sound effects synthesized at runtime via the Web Audio API (no audio files)
  - Player shoot, alien kill, UFO warble drone, player hit, alien march beat, game over, win fanfare
- **Mute button** below the canvas
- **IDDQD cheat code** — type `iddqd` during gameplay to toggle invincibility (gold aura + HUD indicator)
- Hi-score persisted across rounds within the session

## Level Progression

| Level | Base speed | Shoot interval |
|-------|-----------|----------------|
| 1     | ×1.0      | 45 frames      |
| 3     | ×1.6      | 39 frames      |
| 5     | ×2.2      | 33 frames      |
| 7     | ×2.8      | 27 frames      |
| 10    | ×3.7      | 18 frames      |

Speed also ramps up mid-level as aliens are killed, so the last few survivors at level 10 are extremely fast.

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- HTML5 Canvas API
- Web Audio API
