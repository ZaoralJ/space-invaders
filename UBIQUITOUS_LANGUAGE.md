# Ubiquitous Language — Space Invaders

> Domain glossary grounded in source code. `(inferred)` marks interpretations not fully provable from code alone.

| | |
|---|---|
| **Source** | `src/` |
| **Generated** | 2026-06-25 |
| **Bounded context** | Space Invaders (single, flat codebase) |

---

## How to read this

| Marker | Meaning |
|--------|---------|
| 📖 | Definition |
| 🏷️ | Synonyms / aliases |
| ↔️ | Related terms |
| 📍 | Code references |

---

## Entities

<details>
<summary><strong>Alien</strong> — an invader in the descending formation</summary>

📖 Each alien has a `type` (0, 1, or 2), grid `col`/`row`, screen `x`/`y`, an `alive` flag, and an animation `frame`. The formation is a 5×11 grid (55 aliens) that marches horizontally, drops down and reverses at the screen edge, and speeds up as aliens are killed. Destroying one awards points by type.

🏷️ "invader"; rendered per-type as [Squid](#squid), [Crab](#crab), [Octopus](#octopus)

↔️ Part of [Alien Formation March](#alien-formation-march); fires [Alien Bullet](#alien-bullet); collides with [Barrier](#barrier) and [Player Ship](#player-ship)

📍 `src/gameLogic.js:26` · `src/constants.js:14-15` · `src/gameLogic.js:25` · `src/SpaceInvaders.jsx:264`

</details>

<details>
<summary><strong>Squid</strong> 🦑 — top-row alien, highest value (30 pts)</summary>

📖 `type === 0`, occupying row 0 of the formation. Worth **30 points** — the highest per-alien value, prioritised by the [Auto-play AI](#auto-play-ai). Rendered in pink (`#ff4edd`).

🏷️ "type 0", "30-point alien"

↔️ A kind of [Alien](#alien); peers [Crab](#crab), [Octopus](#octopus)

📍 `src/constants.js:28-30` · `src/SpaceInvaders.jsx:36` · `src/gameLogic.js:108`

</details>

<details>
<summary><strong>Crab</strong> 🦀 — middle-row alien (20 pts)</summary>

📖 `type === 1`, occupying rows 1–2 of the formation. Worth **20 points**. Rendered in cyan (`#44d4ff`).

🏷️ "type 1", "20-point alien"

↔️ A kind of [Alien](#alien); peers [Squid](#squid), [Octopus](#octopus)

📍 `src/constants.js:28-30` · `src/SpaceInvaders.jsx:51` · `src/SpaceInvaders.jsx:523`

</details>

<details>
<summary><strong>Octopus</strong> 🐙 — bottom-row alien, lowest value (10 pts)</summary>

📖 `type === 2`, occupying rows 3–4 of the formation. Worth **10 points**. Rendered in green (`#66ff66`).

🏷️ "type 2", "10-point alien"

↔️ A kind of [Alien](#alien); peers [Squid](#squid), [Crab](#crab)

📍 `src/constants.js:28-30` · `src/SpaceInvaders.jsx:68` · `src/SpaceInvaders.jsx:524`

</details>

<details>
<summary><strong>Player Ship</strong> — the player-controlled defender</summary>

📖 Fixed at vertical position `PLAYER_Y`, moving left/right (clamped to the canvas) at `PLAYER_SPEED`. Fires [Player Bullet](#player-bullet)s. Drawn from labeled parts: Body, Cockpit, Wings, Gun. Hit by an [Alien Bullet](#alien-bullet) it loses a [Life](#life).

🏷️ "player", "ship"; mini ship icons used for the [Lives](#life) HUD display

↔️ Fires [Player Bullet](#player-bullet); shielded by [Barrier](#barrier); has [Life](#life)s; controlled by [Auto-play AI](#auto-play-ai); protected by [God Mode](#god-mode-iddqd)

📍 `src/constants.js:6,8,9` · `src/SpaceInvaders.jsx:13,239` · `src/gameLogic.js:39`

</details>

<details>
<summary><strong>UFO (Mystery Ship)</strong> 🛸 — bonus saucer with a hidden point value</summary>

📖 Flies across the top of the screen at random intervals (between `UFO_INTERVAL_MIN` and `UFO_INTERVAL_MAX`). Shooting it awards a randomly selected bonus from `[50, 100, 150, 200, 300]` points, shown as a floating score. While present it emits a warbling drone. The legend hides its value behind `?`.

🏷️ "UFO", "mystery ship", "bonus saucer"

↔️ Destroyed by [Player Bullet](#player-bullet); awards [Score](#score) bonus

📍 `src/constants.js:33,36` · `src/SpaceInvaders.jsx:383,273,521` · `src/audio.js:104`

</details>

<details>
<summary><strong>Barrier</strong> — erodible defensive bunker</summary>

📖 Each of the four barriers is an 8×6 grid of 8px blocks (`cells`), with a notch carved into the bottom-center for the player to shelter under. Individual cells are destroyed ("eroded") when hit by either a player or alien bullet.

🏷️ "bunker", "shield"; constant prefix `BARRIER_`

↔️ Eroded by [Player Bullet](#player-bullet) and [Alien Bullet](#alien-bullet); shelters [Player Ship](#player-ship)

📍 `src/gameLogic.js:6,12,66` · `src/constants.js:23,26`

</details>

<details>
<summary><strong>Player Bullet</strong> — projectile fired upward by the player</summary>

📖 Travels at `BULLET_SPEED`. At most **two** may be in flight at once, gated by a 20-frame shoot cooldown. Erodes [Barrier](#barrier) cells, destroys an [Alien](#alien) (awarding points) or a [UFO](#ufo-mystery-ship) (awarding a bonus) on contact.

🏷️ "shot"

↔️ Fired by [Player Ship](#player-ship); destroys [Alien](#alien) / [UFO](#ufo-mystery-ship); erodes [Barrier](#barrier)

📍 `src/constants.js:10` · `src/gameLogic.js:40` · `src/SpaceInvaders.jsx:245,251`

</details>

<details>
<summary><strong>Alien Bullet</strong> — projectile fired downward by aliens</summary>

📖 Fired by the alien at the bottom of each column. Travels at `ALIEN_BULLET_SPEED`, rendered with a zigzag shape. Erodes [Barrier](#barrier) cells and ends a [Life](#life) on contact — unless [God Mode](#god-mode-iddqd) or post-respawn flash invulnerability is active.

🏷️ None observed

↔️ Fired by [Alien](#alien); damages [Barrier](#barrier) and [Player Ship](#player-ship); negated by [God Mode](#god-mode-iddqd)

📍 `src/constants.js:13` · `src/gameLogic.js:41` · `src/SpaceInvaders.jsx:116,351,360`

</details>

<details>
<summary><strong>Explosion</strong> — short-lived visual burst on destruction</summary>

📖 Modeled as `{ x, y, timer }` with a ~30-frame life, ticked down each frame. Spawned where an alien, UFO, or the player is destroyed.

🏷️ None observed

↔️ Triggered by destroying [Alien](#alien), [UFO](#ufo-mystery-ship), or [Player Ship](#player-ship)

📍 `src/SpaceInvaders.jsx:124,265,469`

</details>

<details>
<summary><strong>Firework Particle</strong> 🎆 — celebratory burst on game completion</summary>

📖 Appears on the win screen. Each particle has position, velocity, `life`, `decay`, `hue`, and `size`, affected by gravity. Spawned when the player clears all ten levels.

🏷️ "win particle"

↔️ Part of the `win` [Game Phase](#game-phase)

📍 `src/SpaceInvaders.jsx:422,432,446`

</details>

---

## Mechanics

<details>
<summary><strong>Alien Formation March</strong> — the collective movement of the alien grid</summary>

📖 The formation moves in `alienDir` (1 = right, −1 = left), reverses direction and descends `ALIEN_DROP` pixels on reaching a screen edge. Its step interval shortens as the [Level](#level) rises and as more aliens are killed — the classic accelerating march. Each march step plays a 4-note beat.

🏷️ "march", "alien movement"

↔️ Composed of [Alien](#alien)s; drives toward [Game Over](#game-phase) when the lowest alien reaches the player line; paced by [Level](#level)

📍 `src/gameLogic.js:44` · `src/constants.js:20` · `src/SpaceInvaders.jsx:287,316` · `src/audio.js:8,97`

</details>

<details>
<summary><strong>Level</strong> — the current wave number (1–10)</summary>

📖 Each level increases alien base speed and starting depth, and shortens the alien shoot interval. Clearing level 10 triggers the `win` [Game Phase](#game-phase).

🏷️ "wave", "level"

↔️ Determines [Difficulty Tier](#difficulty-tier); paces [Alien Formation March](#alien-formation-march)

📍 `src/gameLogic.js:22,49` · `src/SpaceInvaders.jsx:301,410,504`

</details>

<details>
<summary><strong>Difficulty Tier</strong> — wave difficulty label shown on level-up</summary>

📖 One of `EASY`, `NORMAL`, `HARD`, or `INSANE`, derived from the [Level](#level) number. Higher tiers correspond to faster alien movement and more frequent alien fire.

🏷️ "speed label", "difficulty"

↔️ State-of [Level](#level); displayed during the `levelup` [Game Phase](#game-phase)

📍 `src/SpaceInvaders.jsx:629,632`

</details>

<details>
<summary><strong>Life</strong> — a player respawn allowance</summary>

📖 The game starts with **3 lives**. Each player death decrements the count and, while lives remain, leads to a `dead` → respawn cycle. Reaching zero ends the game (`gameover`). Remaining lives are shown as mini ship icons in the HUD.

🏷️ "LIVES" (HUD label), `lives`

↔️ Lost via [Alien Bullet](#alien-bullet) hit; gates [Respawn](#respawn) vs [Game Over](#game-phase)

📍 `src/gameLogic.js:48` · `src/SpaceInvaders.jsx:363,367,506`

</details>

<details>
<summary><strong>Respawn</strong> — recovery after a player death</summary>

📖 After the death timer elapses, the player ship is re-centered and granted a temporary **flash invulnerability** window (`flashTimer`) during which alien bullets do not register a hit.

🏷️ "flash invulnerability", `deadTimer` / `flashTimer`

↔️ Follows loss of a [Life](#life); state-of the `dead` [Game Phase](#game-phase)

📍 `src/SpaceInvaders.jsx:372,399,404` · `src/gameLogic.js:62`

</details>

<details>
<summary><strong>Score</strong> — the player's accumulated points</summary>

📖 Increases by the alien's point value on each kill (`ALIEN_SCORES[type]`) and by a random UFO bonus when the mystery ship is destroyed. Shown in the HUD as "SCORE".

🏷️ "SCORE", `score`

↔️ Awarded by destroying [Alien](#alien) and [UFO](#ufo-mystery-ship); tracked at peak by [Hi-Score](#hi-score)

📍 `src/gameLogic.js:46` · `src/SpaceInvaders.jsx:264,273,493`

</details>

<details>
<summary><strong>Hi-Score</strong> — the session-best score</summary>

📖 Updated when the current score exceeds it. Preserved across restarts via `reset(keepHiScore)`.

🏷️ "HI-SCORE" (HUD label), `hiScore`

↔️ Tracks the maximum [Score](#score)

📍 `src/gameLogic.js:47` · `src/SpaceInvaders.jsx:164,452,497`

</details>

<details>
<summary><strong>God Mode (IDDQD)</strong> — invincibility cheat &nbsp;<kbd>I</kbd><kbd>D</kbd><kbd>D</kbd><kbd>Q</kbd><kbd>D</kbd></summary>

📖 Toggled by typing <kbd>IDDQD</kbd> during play. While active, alien bullets pass through the player and a **golden aura** is rendered around the ship; an "IDDQD" tag appears in the HUD. Named after the classic DOOM cheat code `(inferred)`.

🏷️ "IDDQD", `godModeRef`, "god mode"

↔️ Negates [Alien Bullet](#alien-bullet) damage to [Player Ship](#player-ship)

📍 `src/SpaceInvaders.jsx:197,360,564,587`

</details>

<details>
<summary><strong>Auto-play AI</strong> — AI screensaver mode &nbsp;<kbd>A</kbd></summary>

📖 Toggled with <kbd>A</kbd>. Generates synthetic player inputs each frame: dodges incoming alien bullets by evading toward the open side, targets the lowest-row alien (preferring high-value [Squid](#squid)s), and shoots when horizontally aligned. Also auto-starts and auto-restarts — functions as a screensaver.

🏷️ "AUTO" (HUD tag), `autoPlayRef`, `computeAutoInputs`

↔️ Controls the [Player Ship](#player-ship); targets [Alien](#alien)s

📍 `src/gameLogic.js:86,90,104` · `src/SpaceInvaders.jsx:183,580`

</details>

---

## UI / Audio

<details>
<summary><strong>Game Phase</strong> — the game's lifecycle state</summary>

📖 Held in `phase`. The authoritative enumeration:

| Phase | Description |
|-------|-------------|
| `start` | Title screen |
| `playing` | Active gameplay |
| `dead` | Brief pause after losing a life, before respawn |
| `levelup` | Between-level transition |
| `gameover` | Out of lives, or aliens reached the player line |
| `win` | All ten levels cleared |

🏷️ "phase", "lifecycle state", "game state"

↔️ `dead` transitions via [Respawn](#respawn); `gameover` / `win` return to `start` on restart (preserving [Hi-Score](#hi-score))

📍 `src/gameLogic.js:50` · `src/SpaceInvaders.jsx:302,306,330,371`

</details>

<details>
<summary><strong>Space Music</strong> 🎵 — procedurally synthesised ambient soundtrack</summary>

📖 No audio files — all synthesised via the Web Audio API. Layers a deep detuned bass drone with slow tremolo, an A-minor chord pad, a high-frequency shimmer, and a melodic pentatonic arpeggio through a delay/echo. Fades in when the game starts and fades out on game over / win. Silenced only by the master [Mute](#mute), not the SFX-only mute.

🏷️ "ambient space music", "music"; components: "bass drone", "ambient pad", "shimmer", "arpeggio"

↔️ Governed by master [Mute](#mute) but independent of SFX mute

📍 `src/audio.js:16,169,192,214,248,273` · `src/SpaceInvaders.jsx:234`

</details>

<details>
<summary><strong>Mute</strong> 🔇 — audio silencing, two independent controls</summary>

📖 Two distinct forms:

| Control | How | Scope |
|---------|-----|-------|
| **Master mute** | Mute button | Silences everything: music, SFX, UFO drone |
| **SFX-only mute** | <kbd>S</kbd> — shown as "SFX OFF" | Silences SFX only; music keeps playing |

🏷️ "master mute", "SFX mute", "SFX OFF"

↔️ Controls [Space Music](#space-music) and sound effects

📍 `src/audio.js:298,317` · `src/SpaceInvaders.jsx:157,188,594`

</details>

---

## Open questions

> Concepts not fully provable from code — need human confirmation.

- **`BARRIER_W` / `BARRIER_H`** (`src/constants.js:24,25`) — declared but never imported or used; actual barrier geometry comes from the `cols`/`rows`/`bw` grid in `makeBarriers` (`src/gameLogic.js:10`). Likely dead/legacy config.
- **`alienMoveAccum`** (`src/gameLogic.js:45`) — initialised in game state but never read; live pacing timer appears to be `alienFrameTimer` (`src/gameLogic.js:60`). Likely vestigial.
- **UFO bonus values** — the set `[50, 100, 150, 200, 300]` (`src/SpaceInvaders.jsx:273`) is an inline literal; the HUD legend intentionally hides it behind `?`. Confirm whether the hidden/randomised value is the intended player-facing rule.
