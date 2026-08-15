# GRD v2 SPEC — सुपर शेरू · Super Sheru Bros

**GRD = Guaranteed Replay Determinism.** Version 2 of the revamp keeps what
v1 proved (fixed-step physics, machine-verified levels, ghost-tested 8/8) and
formalizes it into gates that the build cannot skip.

> "Every chapter machine-verified winnable before you play it."

---

## 1. The contract

1. **One clock.** Simulation advances in fixed steps of `1000/60 ms`.
   `main.js` accumulates real time and runs N whole steps; rendering is
   stateless with respect to the sim.
2. **Integer math only in gameplay.** All positions/velocities live in
   Q16.16 fixed point (`src/core/constants.js → FP`). No `Math.random`,
   no floats, no `Date.now` inside the sim. Decor variation uses a seeded
   hash of tile coordinates (`combineHashes`), which is stable forever.
3. **Inputs are bits.** One byte per step:
   `LEFT=1 RIGHT=2 JUMP=4 RUN=8 THROW=16`.
   A proof/ghost is just `[{t, b}]` — step index + bitmask.
4. **Levels are data.** JSON in `levels/`, schema below. The same files are
   imported by the game, the solver, and the tests.
5. **Palette is locked.** Every drawn pixel resolves through `PALETTE`.
   `npm run palette` gates the build.
6. **Audio never touches gameplay.** Raga & tabla are synthesized live from
   `meta.raga / meta.tempo / meta.tala`; they may drop frames but never
   change sim outcomes.

## 2. Repository gates (CI order)

| Gate | Command | Passes when |
|---|---|---|
| palette | `npm run palette` | 0 violations |
| proofs | `npm run prove` | all 8 chapters have a fresh `proofs/*.proof.json` whose input vector replays to the flag |
| ghosts | `npm run ghosts` | all 8 `tests/ghosts/*.ghost.json` replay to the flag in `FixedStepVerifier` |
| suite | `npm run test` | unit checks: AABB, FP rounding, combat table, hash combiner |

`npm run build` runs palette + prove before `vite build`.

## 3. Fixed-step physics (`PHYS`)

All values are px/step at 60 Hz (converted to FP once at load):

| const | value | meaning |
|---|---|---|
| `HZ` | 60 | steps per second |
| `GRAVITY` | 0.34 | fall acceleration |
| `MAX_FALL` | 6.0 | terminal fall speed |
| `WALK_ACC` / `RUN_ACC` | 0.18 / 0.26 | ground acceleration |
| `AIR_ACC` | 0.12 | air control |
| `FRICTION` | 0.30 | ground decel, no input |
| `MAX_WALK` / `MAX_RUN` | 1.9 / 3.1 | speed caps (run needs Shift/X held) |
| `JUMP_V` | -6.0 | initial jump velocity |
| `JUMP_CUT` | 0.45 | vy multiplier on early release (hold = higher) |
| `COYOTE_STEPS` | 6 | late-jump grace after leaving a ledge |
| `JUMP_BUFFER_STEPS` | 6 | early-jump grace before landing |
| `STOMP_BOUNCE` | -3.4 | bounce after stomping an enemy |

Derived budget (used by level design): max jump height ≈ 3.3 tiles;
walk-jump gap ≤ 4 tiles; run-jump gap ≤ 6 tiles.

Player states (`P_STATE`): `IDLE RUN SKID JUMP FALL STOMP HURT DEAD WIN`.

## 4. Tile legend (`TILE_ID`)

Levels encode terrain as ASCII rows, one char per 16×16 tile:

| char | TILE_ID | solid? | behavior |
|---|---|---|---|
| `.` | 0 AIR | no | empty |
| `#` | 1 GROUND | yes | earth/stone |
| `=` | 2 BRICK | yes | brick block, stair material |
| `?` | 3 LADDOO_BLOCK | yes | bonk from below → +1 laddoo, becomes SPENT |
| `-` | 4 PLATFORM | one-way | pass through from below; land from above |
| `^` | 5 SPIKE | no | contact = hurt + knockback |
| `~` | 6 WATER | no | contact = respawn at last checkpoint |

Entities (laddoos, enemies, pipes, checkpoints, flags, decor) are **never**
in the tile grid — they live in `entities[]` so the solver can reason about
them independently.

## 5. Level JSON schema

```jsonc
{
  "format": "grd2/level",
  "meta": {
    "id": "ch1_01",          // must match filename
    "chapter": 1,            // 1–8 (bonus chapters share host number)
    "name": "Marigold Run",
    "land": "Punjab · Sarson Fields",
    "raga": "bhairav",       // key into RagaSynth tables
    "grade": "dawn",         // key into RagaGrades color-grade pipeline
    "tempo": 96,             // BPM for TablaSynth
    "tala": "teentaal"       // rhythmic cycle
  },
  "size": { "w": 72, "h": 16 },
  "tiles": {
    "rows": [
      "........................................................................",
      "........................................................................"
    ]
  },
  "spawns": [ { "id": "entry", "tx": 3, "ty": 12 } ],
  "entities": [
    { "type": "laddoo",     "tx": 8,  "ty": 11 },
    { "type": "walker",     "tx": 26, "ty": 12, "dir": -1 },
    { "type": "floater",    "tx": 48, "ty": 8,  "amp": 2, "phase": 0 },
    { "type": "checkpoint", "tx": 44, "ty": 12 },
    { "type": "flag",       "tx": 68, "ty": 12 },
    { "type": "pipe",       "tx": 58, "ty": 11, "w": 2, "h": 2,
      "target": "ch2_bonus", "spawn": "entry" },
    { "type": "decor",      "variant": "marigold", "tx": 6, "ty": 12 }
  ],
  "par": { "laddoos": 10 }
}
```

## 6. Proof and Ghost Schemas

Proofs verify that a level is winnable via automated solver, while Ghosts represent saved replay playback runs.

### 6.1 Proof JSON schema (`proofs/*.proof.json`)

```jsonc
{
  "format": "grd2/proof",
  "levelId": "ch1_01",
  "steps": 412,
  "inputs": [
    { "t": 0, "b": 2 },   // RIGHT held
    { "t": 45, "b": 6 },  // RIGHT + JUMP
    { "t": 60, "b": 2 }   // RIGHT held
  ],
  "result": {
    "status": "WIN",
    "finalStep": 412,
    "laddoosCollected": 10
  }
}
```

### 6.2 Ghost JSON schema (`tests/ghosts/*.ghost.json`)

```jsonc
{
  "format": "grd2/ghost",
  "levelId": "ch1_01",
  "totalSteps": 412,
  "trace": [
    { "t": 0, "b": 2, "x": 196608, "y": 786432 },
    { "t": 1, "b": 2, "x": 198246, "y": 786432 }
  ]
}
```

## 7. Fixed-Step Verifier & Solver Architecture

- **`FixedStepVerifier`**: Runs headless physics ticks step-by-step applying input bitmasks. Matches browser gameplay frame-by-frame with zero DOM or rendering overhead.
- **A* Solver (`tools/grd-solver.mjs`)**: Searches state space over input vectors `(LEFT, RIGHT, JUMP, RUN)` to find the minimal steps needed to reach the `flag` entity from `entry` spawn without dying.

## 8. Palette & Audio Engine Systems

- **Palette Gate**: Enforces that zero raw color hex strings exist outside `PALETTE` in `SpriteFactory.js`, and every sprite bank contains ≤ 32 color keys.
- **Audio Separation**: WebAudio synthesis runs out-of-band driven by `meta.raga`, `meta.tempo`, and `meta.tala`. Audio node garbage collection or frame drops can never alter random state or physics step order.

## 9. Command Reference

| Action | Command |
|---|---|
| Development Server | `npm run dev` |
| Build & Gate Checks | `npm run build` |
| Palette Gate Check | `npm run palette` |
| Solve & Verify All Proofs | `npm run prove` |
| Solve & Verify One Level | `npm run prove:one -- --level=ch1_01` |
| Generate & Replay Ghosts | `npm run ghosts` |
| Run Fixed Unit Tests | `npm run test` |