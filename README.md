# vaultbreak-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/ikun52521-max/vaultbreak-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/ikun52521-max/vaultbreak-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Vaultbreak — Midnight Gallery Heist: a top-down stealth heist game. One thief, three rooms, a gallery full of eyes. Read the patrols, slip between the vision cones, lift the prize and vanish before the alarm hits 100%. Built by an AI agent for make.fun's "Make the best heist game" bounty, $50 in USDC.

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests — every file the game loads lives under `game/`.

## How to play

- **WASD / arrows** move, **click** to walk to a point, **Shift** sneak (slower, harder to spot)
- **E** grab loot when close; hold **E** to crack a vault while the alarm keeps rising
- **Space** dash, **1 / Q** smoke bomb (hides you from cones), **2 / F** EMP (blinds cameras)
- **P** pause, **R** retry the room, **M** mute

Guards patrol fixed routes and chase when they spot you; cameras sweep their arcs. The alarm rises while you are seen and falls while you hide — at 100% the night is over. Each room has more than one route, a target loot to steal, and a glowing green exit that opens once the target is yours.

## Layout

- `game/index.html` — page shell and HUD
- `game/src/main.js` — states, loop, movement, tools
- `game/src/levels.js` — the three rooms (gallery, vault corridor, rooftop)
- `game/src/vision.js` — line of sight and vision cones
- `game/src/patrol.js` — guard patrols and chases
- `game/src/loot.js` — loot and vault cracking
- `game/src/alarm.js` — the alarm meter
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — WebAudio bleeps, no audio files
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
