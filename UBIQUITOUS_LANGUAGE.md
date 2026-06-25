# Ubiquitous Language — Space Invaders

> Domain glossary generated from source code. Each term is grounded in code
> references. Definitions describe observed behavior; clauses marked
> `(inferred)` are plausible but not fully provable from code.

- **Source:** `/Users/dkprabha/AIAssistedProjects/space-invaders/space-invaders`
- **Generated:** 2026-06-25
- **Scope:** whole repo (domain logic lives in `src/`)
- **Bounded contexts covered:** Space Invaders (single, flat codebase)

## How to read this

- **Definition** — what the concept means, based on code.
- **Code references** — where the term is defined and used (`file:line`).
- **Synonyms / aliases** — other names for the same concept in the codebase.
- **Related terms** — linked domain concepts (contains, references, state-of).
- `(inferred)` — interpretation not fully provable from code; confirm with a
  domain expert.

---

## Space Invaders

The whole game: the player ship defends against a descending alien formation,
sheltering behind erodible barriers, scoring points by destroying aliens and a
bonus UFO, across ten increasingly difficult levels.

### Alien

**Definition.** An invader in the descending formation. Each alien has a
`type` (0, 1, or 2), grid `col`/`row`, screen `x`/`y`, an `alive` flag, and an
animation `frame`. The formation is a 5×11 grid (55 aliens) that marches
horizontally, drops down and reverses at the screen edge, and speeds up as
aliens are killed. Destroying one awards points by type.

**Code references.**
- `src/gameLogic.js:26` — alien object shape created in `spawnAliens`
- `src/constants.js:14` — `ALIEN_COLS = 11`; `src/constants.js:15` — `ALIEN_ROWS = 5`
- `src/gameLogic.js:25` — row→type rule: `r === 0 ? 0 : r <= 2 ? 1 : 2`
- `src/SpaceInvaders.jsx:264` — score awarded on kill via `ALIEN_SCORES[alien.type]`

**Synonyms / aliases.** "invader"; rendered per-type as [Squid](#squid),
[Crab](#crab), [Octopus](#octopus).

**Related terms.** Part of the [Alien Formation March](#alien-formation-march);
fires [Alien Bullet](#alien-bullet); collides with [Barrier](#barrier) and
[Player Ship](#player-ship); types are [Squid](#squid), [Crab](#crab),
[Octopus](#octopus).

### Alien Bullet

**Definition.** A projectile fired downward by an alien at the bottom of its
column. It travels at `ALIEN_BULLET_SPEED`, is rendered with a zigzag shape,
erodes [Barrier](#barrier) cells it hits, and ends a [Life](#life) (or kills the
player) on contact — unless [God Mode](#god-mode-iddqd) or post-respawn flash
invulnerability is active.

**Code references.**
- `src/constants.js:13` — `ALIEN_BULLET_SPEED = 2.5`
- `src/gameLogic.js:41` — `alienBullets: []` in game state
- `src/SpaceInvaders.jsx:116` — "Zigzag alien bullet" rendering
- `src/SpaceInvaders.jsx:351` — alien bullet travel & collisions
- `src/SpaceInvaders.jsx:360` — invulnerability check (god mode / flash)

**Synonyms / aliases.** None observed.

**Related terms.** Fired by [Alien](#alien); damages [Barrier](#barrier) and
[Player Ship](#player-ship); negated by [God Mode](#god-mode-iddqd).

### Alien Formation March

**Definition.** The collective horizontal movement of the live alien
formation. The formation moves in `alienDir` (1 = right, −1 = left), reverses
direction and descends `ALIEN_DROP` pixels on reaching a screen edge, and its
step interval shortens as the [Level](#level) rises and as more aliens are
killed (the classic accelerating march). Each march step plays a 4-note beat.

**Code references.**
- `src/gameLogic.js:44` — `alienDir: 1` (march direction)
- `src/constants.js:20` — `ALIEN_DROP = 20` (descent per edge bounce)
- `src/SpaceInvaders.jsx:287` — march/movement loop with level & kill multipliers
- `src/SpaceInvaders.jsx:316` — direction flip on edge
- `src/audio.js:97` — `playMarch`; `src/audio.js:8` — `MARCH_FREQS = [160,130,100,80]`

**Synonyms / aliases.** "march", "alien movement".

**Related terms.** Composed of [Alien](#alien)s; drives toward
[Game Over](#game-phase) when the lowest alien reaches the player line; paced by
[Level](#level).

### Auto-play AI

**Definition.** An AI mode (toggled with the `A` key) that generates synthetic
player inputs each frame: it dodges incoming alien bullets by evading toward the
open side, targets the lowest-row alien (preferring high-value
[Squid](#squid)s), and shoots when horizontally aligned with the target. It also
auto-starts and auto-restarts, functioning as a screensaver.

**Code references.**
- `src/gameLogic.js:86` — `computeAutoInputs(s)` definition
- `src/gameLogic.js:90` — dodge/evade logic; `src/gameLogic.js:104` — target selection
- `src/SpaceInvaders.jsx:183` — `KeyA` toggles auto-play
- `src/SpaceInvaders.jsx:580` — on-screen "AUTO" tag

**Synonyms / aliases.** "AUTO" (HUD tag), `autoPlayRef`, `computeAutoInputs`.

**Related terms.** Controls the [Player Ship](#player-ship); targets
[Alien](#alien)s.

### Barrier

**Definition.** A defensive bunker positioned above the player. Each of the four
barriers is an 8×6 grid of 8px blocks (`cells`), with a notch carved into the
bottom-center for the player to shelter under. Individual cells are destroyed
("eroded") when hit by either a player or alien bullet.

**Code references.**
- `src/gameLogic.js:6` — `makeBarriers()` builds the grids
- `src/gameLogic.js:12` — "Notch the bottom-center for player to stand under"
- `src/constants.js:23` — `BARRIER_COUNT = 4`; `src/constants.js:26` — `BARRIER_Y`
- `src/gameLogic.js:66` — `collidesWithBarrier` erodes a hit cell

**Synonyms / aliases.** "bunker"/"shield" (-style defensive structure); the
constant prefix `BARRIER_`.

**Related terms.** Eroded by [Player Bullet](#player-bullet) and
[Alien Bullet](#alien-bullet); shelters [Player Ship](#player-ship).

### Crab

**Definition.** The middle alien type (`type === 1`), occupying rows 1–2 of the
formation. Worth 20 points; rendered in cyan (`#44d4ff`).

**Code references.**
- `src/constants.js:28` — type taxonomy comment (`1=crab(mid)`)
- `src/constants.js:29` — `ALIEN_SCORES[1] = 20`; `src/constants.js:30` — color `#44d4ff`
- `src/SpaceInvaders.jsx:51` — "Crab" sprite drawing
- `src/SpaceInvaders.jsx:523` — "= 20 pts" score legend

**Synonyms / aliases.** "type 1", "20-point alien".

**Related terms.** A kind of [Alien](#alien); peers [Squid](#squid),
[Octopus](#octopus).

### Difficulty Tier

**Definition.** A label shown on the level-up transition describing the incoming
wave's difficulty: `EASY`, `NORMAL`, `HARD`, or `INSANE`, derived from the
[Level](#level) number. Higher tiers correspond to faster alien movement and
more frequent alien fire.

**Code references.**
- `src/SpaceInvaders.jsx:632` — `speedLabel` / difficulty-tier labels
- `src/SpaceInvaders.jsx:629` — `LEVEL ${s.level + 1}` shown alongside

**Synonyms / aliases.** "speed label", "difficulty".

**Related terms.** State-of [Level](#level); displayed during the `levelup`
[Game Phase](#game-phase).

### Explosion

**Definition.** A short-lived visual burst spawned where an alien, UFO, or the
player is destroyed. Modeled as `{ x, y, timer }` with a ~30-frame life, ticked
down each frame.

**Code references.**
- `src/SpaceInvaders.jsx:124` — `drawExplosion`
- `src/SpaceInvaders.jsx:265` — spawned on alien kill
- `src/SpaceInvaders.jsx:469` — explosion timers ticked (`explosionsRef`)

**Synonyms / aliases.** None observed.

**Related terms.** Triggered by destroying [Alien](#alien),
[UFO](#ufo-mystery-ship), or [Player Ship](#player-ship).

### Firework Particle

**Definition.** A celebratory particle in the win-screen burst, with position,
velocity, `life`, `decay`, `hue`, and `size`, affected by gravity. Spawned when
the player clears all ten levels.

**Code references.**
- `src/SpaceInvaders.jsx:432` — firework particle fields
- `src/SpaceInvaders.jsx:446` — gravity applied
- `src/SpaceInvaders.jsx:422` — win fireworks loop (`winParticlesRef`)

**Synonyms / aliases.** "win particle".

**Related terms.** Part of the `win` [Game Phase](#game-phase).

### Game Phase

**Definition.** The game's lifecycle state, held in `phase`. The authoritative
enumeration is: `start` (title screen), `playing` (active gameplay), `dead`
(brief pause after losing a life before respawn), `levelup` (between-level
transition), `gameover` (out of lives, or aliens reached the player line), and
`win` (all ten levels cleared).

**Code references.**
- `src/gameLogic.js:50` — `phase: 'start'` with enum comment
- `src/SpaceInvaders.jsx:371` — set to `'dead'` on player hit
- `src/SpaceInvaders.jsx:306` — set to `'levelup'`
- `src/SpaceInvaders.jsx:302` — set to `'win'` when `level >= 10`
- `src/SpaceInvaders.jsx:330` — set to `'gameover'` when aliens reach player

**Synonyms / aliases.** "phase", "lifecycle state", "game state".

**Related terms.** `dead` transitions via [Respawn](#respawn); `gameover`/`win`
return to `start` on restart (preserving [Hi-Score](#hi-score)).

### God Mode (IDDQD)

**Definition.** An invincibility cheat toggled by typing `iddqd` during play.
While active, alien bullets pass through the player and a golden aura is rendered
around the ship; an "IDDQD" tag appears in the HUD. (Named after the classic
DOOM cheat code — `(inferred)`.)

**Code references.**
- `src/SpaceInvaders.jsx:197` — `iddqd` keystroke buffer detection
- `src/SpaceInvaders.jsx:360` — invulnerability check skips player damage
- `src/SpaceInvaders.jsx:564` — golden aura rendering
- `src/SpaceInvaders.jsx:587` — "IDDQD" HUD tag

**Synonyms / aliases.** "IDDQD", `godModeRef`, "god mode".

**Related terms.** Negates [Alien Bullet](#alien-bullet) damage to
[Player Ship](#player-ship).

### Hi-Score

**Definition.** The highest [Score](#score) achieved within the session. It is
updated when the current score exceeds it and is preserved across restarts
(`reset(keepHiScore)`).

**Code references.**
- `src/gameLogic.js:47` — `hiScore: 0` in game state
- `src/SpaceInvaders.jsx:452` — hi-score updated; `src/SpaceInvaders.jsx:497` — "HI-SCORE" HUD label
- `src/SpaceInvaders.jsx:164` — `reset(keepHiScore)` preserves it

**Synonyms / aliases.** "HI-SCORE" (HUD label), `hiScore`.

**Related terms.** Tracks the maximum [Score](#score).

### Level

**Definition.** The current wave number (starts at 1, capped at 10). Each level
increases alien base speed and starting depth and shortens the alien shoot
interval. Clearing level 10 triggers the `win` [Game Phase](#game-phase).

**Code references.**
- `src/gameLogic.js:49` — `level: 1`
- `src/gameLogic.js:22` — per-level lower start-Y in `spawnAliens`
- `src/SpaceInvaders.jsx:410` — level incremented on clear
- `src/SpaceInvaders.jsx:504` — `${s.level}/10` HUD readout
- `src/SpaceInvaders.jsx:301` — win when `level >= 10`

**Synonyms / aliases.** "wave", "level".

**Related terms.** Determines [Difficulty Tier](#difficulty-tier); paces
[Alien Formation March](#alien-formation-march).

### Life

**Definition.** A player respawn allowance. The game starts with 3; each player
death decrements the count and, while lives remain, leads to a `dead`→respawn
cycle. Reaching zero ends the game (`gameover`). Remaining lives are shown as
mini ship icons.

**Code references.**
- `src/gameLogic.js:48` — `lives: 3`
- `src/SpaceInvaders.jsx:363` — `s.lives--` on hit
- `src/SpaceInvaders.jsx:367` — `gameover` when no lives left
- `src/SpaceInvaders.jsx:506` — "LIVES" HUD + ship icons

**Synonyms / aliases.** "LIVES" (HUD label), `lives`.

**Related terms.** Lost via [Alien Bullet](#alien-bullet) hit; gates
[Respawn](#respawn) vs [Game Over](#game-phase).

### Octopus

**Definition.** The bottom alien type (`type === 2`), occupying rows 3–4 of the
formation. Worth 10 points; rendered in green (`#66ff66`).

**Code references.**
- `src/constants.js:28` — type taxonomy comment (`2=octopus(bottom)`)
- `src/constants.js:29` — `ALIEN_SCORES[2] = 10`; `src/constants.js:30` — color `#66ff66`
- `src/SpaceInvaders.jsx:68` — "Octopus" sprite drawing
- `src/SpaceInvaders.jsx:524` — "= 10 pts" score legend

**Synonyms / aliases.** "type 2", "10-point alien".

**Related terms.** A kind of [Alien](#alien); peers [Squid](#squid),
[Crab](#crab).

### Player Bullet

**Definition.** A projectile fired upward by the player ship, travelling at
`BULLET_SPEED`. At most two may be in flight at once, gated by a 20-frame
shoot cooldown. It erodes [Barrier](#barrier) cells, destroys an
[Alien](#alien) (awarding points) or a [UFO](#ufo-mystery-ship) (awarding a
bonus) on contact.

**Code references.**
- `src/constants.js:10` — `BULLET_SPEED = 10`
- `src/gameLogic.js:40` — `playerBullets: []`
- `src/SpaceInvaders.jsx:245` — max-2 cap and cooldown
- `src/SpaceInvaders.jsx:251` — bullet travel & collisions

**Synonyms / aliases.** "shot".

**Related terms.** Fired by [Player Ship](#player-ship); destroys
[Alien](#alien)/[UFO](#ufo-mystery-ship); erodes [Barrier](#barrier).

### Player Ship

**Definition.** The player-controlled defender, fixed at vertical position
`PLAYER_Y`, moving left/right (clamped to the canvas) at `PLAYER_SPEED` and
firing [Player Bullet](#player-bullet)s. Drawn from labeled parts (Body,
Cockpit, Wings, Gun). Hit by an [Alien Bullet](#alien-bullet) it loses a
[Life](#life).

**Code references.**
- `src/constants.js:6` — `PLAYER_W`; `src/constants.js:9` — `PLAYER_Y`; `src/constants.js:8` — `PLAYER_SPEED`
- `src/SpaceInvaders.jsx:13` — `drawPlayer` (Body/Cockpit/Wings/Gun parts)
- `src/SpaceInvaders.jsx:239` — movement clamping
- `src/gameLogic.js:39` — `playerX` starting position

**Synonyms / aliases.** "player", "ship" (and the mini "ship icons" used for
lives).

**Related terms.** Fires [Player Bullet](#player-bullet); shielded by
[Barrier](#barrier); has [Life](#life)s; controllable by
[Auto-play AI](#auto-play-ai); protected by [God Mode](#god-mode-iddqd).

### Respawn

**Definition.** The recovery after a player death (the `dead`
[Game Phase](#game-phase)). After a death timer elapses, the player ship is
re-centered and granted a temporary flash invulnerability window (`flashTimer`)
during which alien bullets do not register a hit.

**Code references.**
- `src/SpaceInvaders.jsx:372` — death timer set to 120 on hit
- `src/SpaceInvaders.jsx:399` — respawn handling in `dead` phase
- `src/SpaceInvaders.jsx:404` — `flashTimer` invulnerability set
- `src/gameLogic.js:62` — `flashTimer: 0` in state

**Synonyms / aliases.** "flash invulnerability", `deadTimer`/`flashTimer`.

**Related terms.** Follows loss of a [Life](#life); state-of the `dead`
[Game Phase](#game-phase).

### Score

**Definition.** The player's accumulated points. Increases by the alien's point
value on each kill (`ALIEN_SCORES[type]`) and by a random UFO bonus when the
mystery ship is destroyed. Shown in the HUD as "SCORE".

**Code references.**
- `src/gameLogic.js:46` — `score: 0`
- `src/SpaceInvaders.jsx:264` — `s.score += ALIEN_SCORES[alien.type]`
- `src/SpaceInvaders.jsx:273` — UFO bonus added
- `src/SpaceInvaders.jsx:493` — "SCORE" HUD label

**Synonyms / aliases.** "SCORE", `score`.

**Related terms.** Awarded by destroying [Alien](#alien) and
[UFO](#ufo-mystery-ship); tracked at peak by [Hi-Score](#hi-score).

### Space Music

**Definition.** The procedurally synthesized ambient soundtrack (no audio
files). It layers a deep detuned bass drone with a slow tremolo, an A-minor
chord pad, a high-frequency shimmer, and a melodic pentatonic arpeggio fed
through a delay/echo. It fades in when the game starts and fades out on game
over / win, and is silenced only by the master [Mute](#mute) (not the SFX-only
mute).

**Code references.**
- `src/audio.js:169` — `startMusic`; `src/audio.js:273` — `stopMusic`
- `src/audio.js:192` — bass drone; `src/audio.js:214` — Am chord pad
- `src/audio.js:248` — arpeggio; `src/audio.js:16` — `ARP_NOTES`
- `src/SpaceInvaders.jsx:234` — music started when play begins

**Synonyms / aliases.** "ambient space music", "music"; components: "bass
drone", "ambient pad", "shimmer", "arpeggio".

**Related terms.** Governed by master [Mute](#mute) but independent of SFX mute.

### Squid

**Definition.** The top alien type (`type === 0`), occupying row 0 of the
formation. Worth 30 points (the highest per-alien value, prioritised by the
[Auto-play AI](#auto-play-ai)); rendered in pink (`#ff4edd`).

**Code references.**
- `src/constants.js:28` — type taxonomy comment (`0=squid(top)`)
- `src/constants.js:29` — `ALIEN_SCORES[0] = 30`; `src/constants.js:30` — color `#ff4edd`
- `src/SpaceInvaders.jsx:36` — "Squid" sprite drawing
- `src/gameLogic.js:108` — AI prioritises squids ("squid=30pts")

**Synonyms / aliases.** "type 0", "30-point alien".

**Related terms.** A kind of [Alien](#alien); peers [Crab](#crab),
[Octopus](#octopus).

### UFO (Mystery Ship)

**Definition.** A bonus saucer that flies across the top of the screen
(`UFO_Y`) at random intervals (between `UFO_INTERVAL_MIN` and
`UFO_INTERVAL_MAX`). Shooting it awards a randomly selected bonus from
`[50, 100, 150, 200, 300]` points, shown as a floating score; while present it
emits a warbling drone. The legend hides its value behind a "?".

**Code references.**
- `src/constants.js:33` — `UFO_Y`; `src/constants.js:36` — `UFO_INTERVAL_MIN`/`MAX`
- `src/SpaceInvaders.jsx:383` — UFO spawn (`{ x, dir }`)
- `src/SpaceInvaders.jsx:273` — random bonus `[50,100,150,200,300]`
- `src/audio.js:104` — `startUFO` warble drone
- `src/SpaceInvaders.jsx:521` — "= ? pts" legend

**Synonyms / aliases.** "UFO", "mystery ship", "bonus saucer".

**Related terms.** Destroyed by [Player Bullet](#player-bullet); awards
[Score](#score) bonus.

### Mute

**Definition.** Audio silencing, in two distinct forms. The **master mute**
(mute button) silences everything — [Space Music](#space-music), SFX, and the
UFO drone. The **SFX-only mute** (toggled with the `S` key, shown as "SFX OFF")
silences sound effects while leaving music playing.

**Code references.**
- `src/audio.js:298` — `setMuted`/`isMuted` (master mute)
- `src/audio.js:317` — `setSfxMuted`/`isSfxMuted` (SFX-only)
- `src/SpaceInvaders.jsx:157` — `toggleMute`
- `src/SpaceInvaders.jsx:188` — `KeyS` toggles SFX mute; `src/SpaceInvaders.jsx:594` — "SFX OFF" tag

**Synonyms / aliases.** "master mute", "SFX mute", "SFX OFF".

**Related terms.** Controls [Space Music](#space-music) and sound effects.

---

## Open questions / ambiguities

Terms or concepts that could not be confidently defined from code and need
human confirmation:

- **`BARRIER_W` / `BARRIER_H`** (`src/constants.js:24`, `src/constants.js:25`) —
  declared but never imported or used; actual barrier geometry comes from the
  `cols`/`rows`/`bw` grid in `makeBarriers` (`src/gameLogic.js:10`). Likely
  dead/legacy config — confirm whether intended.
- **`alienMoveAccum`** (`src/gameLogic.js:45`) — initialized in the game state
  but never read; the live pacing timer appears to be `alienFrameTimer`
  (`src/gameLogic.js:60`). Likely vestigial.
- **UFO bonus values** — the set `[50, 100, 150, 200, 300]`
  (`src/SpaceInvaders.jsx:273`) is an inline literal rather than a named
  constant, and the HUD legend intentionally hides it behind "?"
  (`src/SpaceInvaders.jsx:521`). Confirm whether the hidden/randomized value is
  the intended player-facing rule.
