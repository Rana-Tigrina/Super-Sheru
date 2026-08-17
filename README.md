# 🐅 सुपर शेरू · Super Sheru Bros

> **An authentic 2D retro platformer across the Eight Lands of Bharat.**  

---

## 🌟 Overview & Major Overhaul

**Super Sheru Bros (सुपर शेरू)** is a love letter to classic 8/16-bit platformers infused with the rich cultural heritage, vibrant landscapes, and classical music of India. 

Play as **Sheru** on an epic quest through eight distinct regions of Bharat—from the golden mustard fields of Punjab to the sacred confluence of Kanyakumari.

```
                  ┌────────────────────────────────────────┐
                  │          सुपर शेरू · SUPER SHERU       │
                  │   ✦ 8 Lands · 8 Ragas · Pure 60Hz ✦    │
                  └────────────────────────────────────────┘
```

### ✨ Key Features

- ⚙️ **GRD v2 Deterministic Engine**: Fixed-step 60Hz simulation driven entirely by **integer Q16.16 fixed-point math** (`PHYS_FP`). Zero floating-point drift, deterministic collision separation, and bit-identical replays across any browser or OS.
- 🪓 **Sacred Chakra Combat**: Throw spinning sacred Chakras with parabolic flight paths, cooldowns, and impact recoil to vanquish patrolling Asuras and hovering aerial hazards.
- 🎶 **Live Procedural Raga & Tabla Synthesizer**: **Zero audio sample files.** The entire soundtrack and sound effects are synthesized in real-time using the Web Audio API—featuring sitar/flute harmonic models, tanpura drones, and physical acoustic modeling of Dagga and Dayan tabla drums.
- 🗺️ **Eight Lands of Bharat (Chapters 1–8 + Underground Secrets)**: Handcrafted levels with authentic cultural decor (marigolds, diyas, arches, chai stalls, temple ruins) and pipe warp secret stages.
- 🎨 **Dynamic Color-Grading & Pixel-Art Engine**: 26-color locked aesthetic across 5 color banks, multi-layer parallax scrolling, CRT scanline shader, and procedural weather/particle effects (monsoon downpours, swirling snow, glowing embers, floating marigold petals).
- 🤖 **Machine-Proven Level Proofs**: Automated A* level solver (`tools/grd-solver.mjs`) and ghost recorder that mathematically prove winnability and frame-exact execution.
- 📱 **Responsive Cross-Platform Controls**: Zero-latency desktop keyboard input and customized on-screen touch D-pad & action buttons for mobile devices.

---

## 🗺️ The Eight Lands of Bharat

| Ch | Region | Setting & Atmosphere | Raga | Tala / Mood |
|:---:|:---|:---|:---|:---|
| **1** | **Punjab** | Sarson Fields · Golden morning sunlight & village huts | *Bhairav* | Teentaal (76 BPM) |
| **2** | **Jaipur** | Rose Gates & Haveli rooftops (+ Secret Underground Pipe) | *Yaman* | Keherwa (84 BPM) |
| **3** | **Mumbai** | Monsoon Docks · Torrential rain, slick piers & cargo boats | *Miyan ki Malhar* | Dadra (80 BPM) |
| **4** | **Kashi** | Ganga Ghats · Evening Aarti, floating diyas & temple steps | *Bhairavi* | Deepchandi (72 BPM) |
| **5** | **Assam** | Tea Gardens · Rolling emerald hills, mist & wooden bridges | *Desh* | Keherwa (88 BPM) |
| **6** | **Hampi** | Deccan Stones · Ancient boulders, pillars & underground crypts | *Khamaj* | Teentaal (82 BPM) |
| **7** | **Himalaya** | Snowline Peaks · Freezing blizzards & high altitude cliffs | *Malkauns* | Rupak (74 BPM) |
| **8** | **Kanyakumari** | Sun Coast · Sacred tri-sea shoreline & golden sunrise finale | *Shankara* | Teentaal (92 BPM) |

---

## 🎮 Controls

### Keyboard Controls

| Action | Primary Keys | Secondary Keys |
|:---|:---|:---|
| **Move Left / Right** | `←` `→` | `A` / `D` |
| **Jump** *(hold for higher jump)* | `Space` | `↑` / `Z` |
| **Sprint / Throw Chakra** | `Shift` | `X` |
| **Pipe Warp / Duck** | `↓` | `S` |
| **Start / Confirm** | `Enter` | — |
| **Pause Simulation** | `P` | — |
| **Toggle Audio Mute** | `M` | — |
| **Restart Chapter** | `R` | — |

### Mobile / Touch Controls
- **D-Pad (◀ ▶)**: Move Sheru left and right.
- **Button B**: Run / Sprint / Throw Chakra.
- **Button A**: Jump (tap for hop, hold for maximum height).

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` (packaged with Node.js)

### Installation & Launch

```bash
# 1. Clone the repository
git clone https://github.com/Rana-Tigrina/Super-Sheru.git
cd Super-Sheru

# 2. Install dependencies
npm install

# 3. Launch Vite local dev server
npm run dev
```

Open **`http://localhost:5173`** in your browser to play immediately!

---

## 🛠️ Project Scripts & Tooling

```bash
# Start local development server with HMR
npm run dev

# Validate art sprite palette rules (ensures strict 26-color gamut)
npm run palette

# Run the deterministic A* level solver across all levels
npm run prove

# Run level solver for a specific level (e.g. ch1_01)
npm run prove:one -- --level ch1_01

# Generate and verify ghost input replays
npm run ghosts

# Run full GRD test suite (physics, math, collision, determinism, replays)
npm test

# Benchmark fixed-step physics & solver throughput
npm run bench

# Production build (runs palette check + solver proofs + Vite bundle)
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Architecture & Project Structure

```
Super-Sheru/
├── index.html                   # Pixel-perfect canvas shell & CRT overlay
├── main.js                      # Fixed-step game loop (60 Hz) & scene router
├── package.json                 # Project configuration & npm scripts
├── vite.config.js               # Vite build configuration
│
├── levels/                      # JSON Level maps (32×18 tile layouts)
│   ├── ch1_01.json ... ch8_01.json
│   ├── ch2_bonus.json           # Jaipur underground bonus stage
│   └── ch6_bonus.json           # Hampi ancient crypt bonus stage
│
├── proofs/                      # Machine-generated deterministic proof replays
│   └── *.proof.json
│
├── src/
│   ├── index.js                 # Top-level library barrel export
│   ├── art/                     # Procedural pixel art generation
│   │   ├── SpriteFactory.js     # 16×16 tile & character rasterizer
│   │   └── index.js             # Art domain barrel
│   │
│   ├── audio/                   # Zero-asset Web Audio synthesis engine
│   │   ├── AudioEngine.js       # Audio coordinator & master bus
│   │   ├── RagaSynth.js         # Classical Indian modal raga synthesizer
│   │   ├── TablaSynth.js        # Physical modeling of Dayan & Dagga drums
│   │   ├── SFX.js               # 8-bit retro sound effect generators
│   │   └── index.js             # Audio domain barrel
│   │
│   ├── core/                    # Core mathematical foundations
│   │   ├── constants.js         # Q16.16 fixed-point LUTs, physics constants & tiles
│   │   ├── combat.js            # Stomp, hurt, and damage resolution
│   │   ├── util.js              # State hashing & bitwise helpers
│   │   └── index.js             # Core domain barrel
│   │
│   ├── debug/                   # Developer tooling & diagnostics
│   │   ├── DebugOverlay.js      # Frame timer, velocity, hitbox visualizer
│   │   └── index.js             # Debug domain barrel
│   │
│   ├── enemies/                 # Enemy AI & state machines
│   │   ├── WalkerEnemy.js       # Ground-patrolling Asuras
│   │   ├── WalkerEnemyLogic.js  # Pure deterministic walker physics
│   │   ├── FloaterEnemy.js      # Sine-wave floating aerial hazards
│   │   ├── FloaterEnemyLogic.js # Pure deterministic floater physics
│   │   ├── EnemyLogic.js        # Backward-compatible re-export
│   │   └── index.js             # Enemies domain barrel
│   │
│   ├── level/                   # Map decoding & level parsing
│   │   ├── MacroLevelLoader.js  # Spawns, collectables, pipe links, flags
│   │   └── index.js             # Level domain barrel
│   │
│   ├── physics/                 # Deterministic physics engine
│   │   ├── SpatialHash.js       # Broad-phase spatial hashing in fixed-point
│   │   └── index.js             # Physics domain barrel
│   │
│   ├── player/                  # Hero controller & state
│   │   ├── Player.js            # Player entity shell
│   │   ├── PlayerLogic.js       # Coyote time, jump cut, skid, throw & death
│   │   ├── PowerUpManager.js    # Power-up state management
│   │   └── index.js             # Player domain barrel
│   │
│   ├── render/                  # Rendering & post-processing
│   │   ├── ColorGradePipeline.js# Atmospheric lighting & palette matrix
│   │   ├── ParallaxBackground.js# Multi-layer scenic backdrop
│   │   ├── ParticleEngine.js    # Monsoon, snow, embers, marigold petals
│   │   ├── RagaGrades.js        # Color profiles matching each musical Raga
│   │   └── index.js             # Render domain barrel
│   │
│   ├── scenes/                  # Game state scenes
│   │   ├── TitleScene.js        # Main title screen with poster aesthetic
│   │   ├── GameScene.js         # Main gameplay scene
│   │   ├── EndingScene.js       # Ending credits & victory raga montage
│   │   └── index.js             # Scenes domain barrel
│   │
│   ├── ui/                      # Touch controls & on-screen HUD
│   │   ├── HUD.js               # Laddoo counters & live status HUD
│   │   ├── TouchControls.js     # Responsive mobile D-Pad & action buttons
│   │   └── index.js             # UI domain barrel
│   │
│   ├── verification/            # Simulation verifier
│   │   ├── FixedStepVerifier.js # Headless runner for automated validation
│   │   └── index.js             # Verification domain barrel
│   │
│   └── weapons/                 # Projectile mechanics
│       ├── Chakra.js            # Spinning chakra projectile
│       ├── ChakraLogic.js       # Trajectory & lifetime simulation
│       ├── ChakraManager.js     # Projectile pooling and limit enforcement
│       └── index.js             # Weapons domain barrel
│
├── tests/                       # Test suites & autopilot bots
│   ├── run-grd-v1-suite.mjs     # Complete validation runner
│   ├── autopilot.mjs            # Autonomous exploration bot
│   ├── generate-all-ghosts.mjs  # Ghost recording and verification suite
│   └── record-ghost.mjs         # Interactive terminal ghost recorder
│
└── tools/                       # Developer CLI tools
    ├── grd-solver.mjs           # A* physics level solver
    ├── validate-palette.mjs     # Color bank & gamut validator
    └── benchmark.mjs            # Physics & solver performance benchmarks
```

---

## 🔬 Mathematical Foundations

Super Sheru Bros uses **Game Requirements Determinism** to ensure that the game operates strictly as a discrete state machine:

1. **Fixed-Step Clock**: The simulation advances solely inside fixed **16.666 ms (60 Hz)** ticks. Rendering can happen at arbitrary display refresh rates (60Hz, 120Hz, 144Hz) without altering the game's state.
2. **Q16.16 Fixed Point (`FP`)**: All positions, velocities, and accelerations are represented as 32-bit signed integers with a 16-bit fractional component (`1.0 = 65536`).
3. **Lookup-Table Trigonometry**: Floating-point `Math.sin` is replaced with a precomputed 256-entry integer sine quarter-table for aerial floaters and atmospheric decor sway.
4. **State Hash Invariants**: Every step produces an integer hash of the player, enemy, and projectile states. Proof files (`proofs/*.proof.json`) store verified input vectors that can be replayed frame-by-frame with zero error.

---

## 📜 License

This project is open-source software licensed under the [MIT License](LICENSE).
