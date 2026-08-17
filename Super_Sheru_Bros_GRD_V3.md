# Super Sheru Bros — GRD V3
## Four-Phase Complete Overhaul Plan

**Purpose:** Transform the existing Super Sheru Bros repository into a polished, modern Indian 2D action-platformer through four sequential implementation phases.

**Execution model:** Run **one phase at a time** in Codex. After each phase, manually inspect/run the game before starting the next phase.

**Important:** Each phase builds on the previous one. Do not ask Codex to implement later-phase features early.

---

# Overall Vision

Super Sheru Bros should become a polished, expressive, culturally distinctive Indian 2D action-platformer inspired by the quality bar of games such as **Super Mario Bros., Celeste, Rayman Legends, and Ori**—without copying their assets or identity.

The final game should feel like a substantial remaster/sequel-level upgrade rather than the original game with visual effects layered on top.

## Final Feature Set

- 8 distinct Indian environments
- Multi-layer parallax
- Regional landmarks and atmosphere
- Modern player animation
- Strong game feel
- Indian-themed mystery blocks
- Complete power-up system
- Enemy variety
- Three distinct bosses
- Secret areas
- Ancient Seal collectibles
- Progression and costumes
- Audio/adaptive music architecture
- Polished HUD and transitions
- Modular, data-driven architecture

---

# Phase 1 — Foundation & Core Gameplay

## Goal

Build the technical and gameplay foundation that all later phases depend on.

### 1. Repository Audit

First inspect and understand:

- framework
- renderer
- game loop
- physics
- collision system
- player controller
- levels
- entities
- blocks
- collectibles
- camera
- UI
- audio
- asset pipeline

Preserve working systems. Do not rewrite the project blindly.

### 2. Core Architecture

Refactor toward modular systems for:

- game state
- timing
- player
- player states
- entities
- blocks
- power-ups
- camera
- levels
- rendering
- particles
- audio
- UI

Keep the existing architecture where it is already sound.

Avoid:

- giant files
- duplicated logic
- scattered boolean state
- magic numbers
- unnecessary dependencies
- hardcoded chapter-specific logic

### 3. Rendering Foundation

Modernize the renderer only if necessary.

If PixiJS is appropriate, use the current stable compatible architecture.

Prepare the rendering layer for:

- sprites
- layered rendering
- camera transforms
- particles
- effects
- high-resolution assets
- future lighting/post-processing

Do not implement all visual effects yet.

### 4. Player Controller

Preserve existing controls while improving the foundation:

- acceleration
- deceleration
- running
- jumping
- air control
- gravity
- collision
- landing
- falling
- damage
- death
- restart

Prepare for multiple player forms.

Use a coherent player-state system rather than scattered flags.

### 5. Power-Up State Architecture

Create reusable states for:

- Small
- Super
- Invincible
- Fire
- Glide
- Magnet

Support:

- activation
- duration
- expiration
- transformation
- movement modifiers
- damage interaction
- visuals
- audio
- cleanup

### 6. Implement Super Sheru

- larger Sheru
- royal pagri
- necklace
- stronger visual presence
- brick destruction
- one additional hit
- Super → Small on damage

### 7. Implement Sudarshan Kavach

Duration: **12 seconds**

- radiant solar/rainbow aura
- sparkle trail
- ~40% speed increase
- enemies defeated on contact
- activation feedback
- expiration feedback

### 8. Block System

Create a reusable block framework.

#### Royal Peetal Mystery Vault

- underside collision
- bounce
- item spawning
- spent state
- configurable contents

#### Mithai Multihit Box

- repeated hits
- up to 10 laddoos
- progressive feedback
- inactive final state

#### Terracotta/Sandstone Brick

- Small Sheru → recoil
- Super Sheru → destroy

### 9. Camera

Implement:

- smooth follow
- horizontal look-ahead
- configurable bounds
- camera shake API
- future cinematic/boss control

### 10. Game-Feel Foundation

Create reusable infrastructure for:

- hit-stop
- camera shake
- particles
- impact effects
- animation triggers
- sound triggers

### 11. Data-Driven Foundation

Prepare structures for:

- Chapter
- Level
- Enemy
- PowerUp
- Block
- Collectible
- Boss
- Weather
- Parallax
- Audio

Adding future content should require configuration/assets rather than rewriting core systems.

## Phase 1 Boundary

Do **not** implement:

- all 8 environments
- bosses
- full enemy roster
- secret areas
- Ancient Seals
- final audio
- advanced lighting
- final HUD redesign
- elaborate post-processing

### Phase 1 Result

A stable foundation containing:

- modular architecture
- improved player
- player-state system
- camera
- block framework
- Super Sheru
- Sudarshan Kavach
- game-feel infrastructure
- data-driven content structure
- rendering foundation

---

# Phase 2 — Worlds & Visual Identity

## Goal

Give Super Sheru Bros its distinctive Indian visual identity.

Build on Phase 1. Do not rewrite Phase 1 systems unless genuinely necessary.

## 1. Parallax System

Implement reusable, data-driven layers:

```text
Sky                  0.00x
Distant background   0.15x
Landmark             0.35x
Foreground ambience  0.65x
Gameplay             1.00x
Weather / FX         independent
```

The renderer must not contain chapter-specific hardcoded logic.

## 2. Eight Chapter Environments

### Chapter 1 — Punjab

- mustard fields
- Golden Temple / Harmandir Sahib
- villages
- tube wells
- tractors
- kites
- mustard petals

### Chapter 2 — Jaipur

- Hawa Mahal
- Amer Fort
- pink sandstone
- jharokhas
- palace arches
- brass lanterns
- desert dust

### Chapter 3 — Mumbai

- Gateway of India
- Bandra-Worli Sea Link
- Arabian Sea
- skyline
- monsoon rain
- wet environment

### Chapter 4 — Kashi / Varanasi

- Ganga ghats
- temple silhouettes
- stone steps
- dhuni fires
- diyas
- river mist
- smoke and embers

Represent religious/cultural elements respectfully.

### Chapter 5 — Assam

- tea gardens
- bamboo structures
- hills
- morning fog
- hornbills
- drifting leaves

### Chapter 6 — Hampi

- Vittala Stone Chariot
- Virupaksha Gopuram
- granite boulders
- ruins
- stone pillars
- warm sunlight

### Chapter 7 — Himalaya

- snow peaks
- monasteries/gompas
- prayer flags
- cliffs
- snow
- blizzard atmosphere

### Chapter 8 — Kanyakumari

- Vivekananda Rock Memorial
- Thiruvalluvar Statue
- ocean horizon
- palms
- ocean spray
- sunrise/sunset atmosphere

## 3. Atmosphere System

Create reusable configurable effects:

- rain
- snow
- fog
- mist
- dust
- embers
- petals
- leaves
- ocean spray
- sunlight rays

## 4. Particle System

Create reusable emitters for:

- landing
- running
- jumping
- block destruction
- enemy impact
- collectibles
- power-ups
- weather
- environmental ambience

Use pooling where appropriate.

## 5. Lighting / Effects

Implement subtle, performant:

- glow
- bloom
- localized light
- atmospheric haze
- god rays
- environmental lighting

Examples:

- diyas glow in Kashi
- lanterns glow in Jaipur
- chakras glow
- laddoos glow
- snow environments have colder atmospheric depth

Prioritize gameplay readability.

## 6. Character Presentation

Improve Sheru with:

- expressive animation
- squash/stretch
- landing animation
- running/skid animation
- power-up transformation
- damage reaction
- victory animation

Keep the animation architecture reusable for enemies and bosses.

### Phase 2 Result

The game now has:

- all 8 regional visual identities
- reusable parallax
- weather/atmosphere
- particles
- lighting/effects foundation
- substantially improved character presentation

---

# Phase 3 — Combat, Bosses & Content

## Goal

Make the game substantially deeper mechanically.

Build on Phases 1 and 2.

## 1. Complete Remaining Power-Ups

### Agni Chakra

- spinning fire projectile
- projectile collision
- bouncing
- enemy defeat
- torch ignition
- particles
- sound
- reasonable cooldown/limits

### Pawan Pagri / Garuda Feather

- glide
- improved air control
- optional double jump if compatible with existing movement
- scarf/energy trail

### Laddoo Magnet

- attraction radius
- smooth collectible attraction
- duration
- visual feedback

## 2. Enemy Framework

Create reusable enemy states supporting:

- idle
- patrol
- chase
- attack
- hurt
- death
- environmental interaction

Configurable:

- speed
- health
- damage
- movement
- detection
- attack patterns

## 3. Enemy Variety

Create several meaningful archetypes:

- walking
- flying
- ranged
- charging
- armored
- environmental

Use the Indian setting for visual identity without reducing enemies to stereotypes.

## 4. Bosses

### Jaipur — Kala Yantra

Mechanical palace guardian with:

- multiple attacks
- telegraphs
- vulnerable windows
- phases
- health
- defeat sequence

### Himalaya — Him-Manav

- ice boulders
- charge attacks
- environmental hazards
- phases

### Kashi — Mayavi Asura

- smoke/mist teleportation
- deceptive movement
- attack patterns
- vulnerable states
- phases

Bosses must require actual gameplay decisions, not just increased health.

## 5. Secret Areas

Implement Indian-inspired hidden bonus areas:

- baolis
- underground chambers
- hidden ruins
- secret passages

Include:

- hidden entrances
- bonus laddoos
- challenges
- secret exits
- warp functionality

## 6. Ancient Seals

Implement **3 Ancient Seals per level**:

- hidden placement
- collection
- persistence
- progression
- unlock hooks

Unlock hooks should support:

- lore
- concept art
- character information
- costumes

## 7. Costume System

Implement reusable cosmetics supporting:

- Royal Kurta
- Maratha-inspired armor
- Himalayan winter cape

Keep cosmetics separate from gameplay logic.

### Phase 3 Result

The game now has:

- complete power-up roster
- reusable enemy system
- enemy variety
- three distinct bosses
- secret areas
- Ancient Seals
- progression hooks
- costume framework

---

# Phase 4 — Final Polish & Presentation

## Goal

Integrate Phases 1–3 into one cohesive finished game.

Avoid major architectural rewrites unless absolutely necessary.

## 1. Game Feel

Fully integrate:

- hit-stop
- camera shake
- squash/stretch
- impact particles
- enemy death effects
- block destruction
- power-up activation
- landing effects
- collectible feedback

Effects should reinforce gameplay rather than become visual noise.

## 2. Audio

Complete the audio architecture:

- music
- SFX
- volume categories
- mute
- fades
- crossfades
- contextual audio
- adaptive music

Possible regional instrumentation:

- sitar
- sarangi
- shehnai
- bansuri
- tabla
- dholak

Support intensity states:

```text
Normal
↓
Danger
↓
Boss
↓
Power-up
↓
Victory
```

Do not block implementation waiting for final audio assets.

## 3. Final HUD

Polished HUD containing:

- lives
- score
- laddoos
- Ancient Seals
- current power-up
- power-up timer
- chapter
- pause

Add transitions for:

- chapter introduction
- power-up activation
- collectible acquisition
- death
- victory
- level transitions

## 4. Chapter Presentation

Give each chapter a strong identity through:

- chapter title cards
- environmental transitions
- visual palette
- music
- atmosphere
- landmark reveals

## 5. Final Visual Cohesion

Unify:

- sprite scale
- animation style
- lighting
- particles
- UI
- colors
- effects
- typography
- transitions

The game should feel like one cohesive product, not four development phases stitched together.

## 6. Final Cleanup

Remove:

- dead code
- unnecessary dependencies
- debugging code
- duplicated logic
- temporary implementations

Simplify unnecessary complexity and optimize expensive effects/assets where appropriate.

### Phase 4 Result

A cohesive Super Sheru Bros overhaul with:

- modern 2D presentation
- 8 Indian worlds
- parallax
- atmosphere/weather
- polished player
- game-feel system
- mystery blocks
- complete power-ups
- enemies
- bosses
- secret areas
- Ancient Seals
- progression
- costumes
- audio/adaptive music architecture
- polished HUD
- chapter presentation
- modular/data-driven architecture

---

# Phase Boundaries

## Phase 1
**Foundation + Core Gameplay**

↓

## Phase 2
**Worlds + Visual Identity**

↓

## Phase 3
**Combat + Bosses + Content**

↓

## Phase 4
**Polish + Presentation**

Each phase should build on the previous one.

**Do not implement later-phase features early unless required to create the architecture of the current phase.**

---

# Codex Operating Rule

For every phase:

1. Inspect the existing repository.
2. Understand what previous phases already established.
3. Implement only the current phase.
4. Preserve working systems.
5. Prefer incremental refactoring over unnecessary rewrites.
6. Make sensible engineering decisions without asking for obvious choices.
7. Do not leave major requested features as pseudocode or TODOs.
8. Do not claim a feature is implemented unless the code actually implements it.

**The user will personally run, test, inspect, and validate the game between phases.**

The Codex task is therefore focused on **implementation**, not testing instructions.

---

# Final Vision

Super Sheru Bros should ultimately feel like a polished Indian platformer with its own identity:

**responsive gameplay + strong game feel + rich Indian environments + meaningful exploration + expressive characters + memorable bosses + cohesive presentation.**

The goal is not maximum feature count.

The goal is a **coherent, polished game built carefully in four layers.**
