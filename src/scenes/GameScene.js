/* src/scenes/GameScene.js — plays one level.
 * The world IS a FixedStepVerifier simulation: identical step semantics to
 * proofs/ghosts. This scene adds input, audio, camera, rendering, HUD, and visual juice.
 */

import { VIEW, PHYS, BTN, P_STATE, FP, TILE, TILE_ID } from '../core/constants.js';
import { SpriteFactory, tileSpriteName } from '../art/SpriteFactory.js';
import { ColorGradePipeline } from '../render/ColorGradePipeline.js';
import { Camera } from '../render/Camera.js';
import { GameFeel } from '../core/GameFeel.js';
import { BlockManager } from '../level/BlockManager.js';
import { ParallaxBackground } from '../render/ParallaxBackground.js';
import { ParticleEngine } from '../render/ParticleEngine.js';
import { LightingEngine } from '../render/LightingEngine.js';
import { HUD } from '../ui/HUD.js';
import { TouchControls } from '../ui/TouchControls.js';
import { DebugOverlay } from '../debug/DebugOverlay.js';
import { createSimulation, stepSimulation } from '../verification/FixedStepVerifier.js';
import { PIPE_FADE_STEPS } from '../level/MacroLevelLoader.js';

const GAME_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
    'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyZ', 'KeyX', 'KeyC', 'ShiftLeft', 'ShiftRight',
]);

export class GameScene {
    constructor(app, levelId, spawnId = 'entry') {
        this.app = app;
        this.levelId = levelId;
        this.spawnId = spawnId;
        this.id = 'game';
    }

    /* ── lifecycle ────────────────────────────────────────────────────────── */

    enter() {
        this.json = this.app.levels[this.levelId];
        if (!this.app.sprites) this.app.sprites = new SpriteFactory();
        if (!this.app.grade) this.app.grade = new ColorGradePipeline();
        if (!this.app.hud) this.app.hud = new HUD();

        this.app.grade.setGrade(this.json.meta.grade);
        this.sim = createSimulation(this.json, this.spawnId);

        this.camera = new Camera(VIEW.W, VIEW.H);
        this.camera.reset(FP.toInt(this.sim.player.s.x), 0, this.sim.level.pxW);

        this.gameFeel = new GameFeel(this.camera);
        this.blockManager = new BlockManager(this.sim.level);
        this.parallax = new ParallaxBackground(this.levelId);
        this.particles = new ParticleEngine();
        this.lighting = new LightingEngine(VIEW.W, VIEW.H);

        this.stepCount = 0;
        this.paused = false;
        this.titleTimer = 150;
        this._deadTimer = 0;
        this._warpTimer = 0;
        this.throwQueued = false;
        this._prevTouch = 0;
        this.camX = 0;
        this.camY = -(VIEW.H - this.sim.level.pxH);

        this.keys = { left: false, right: false, jump: false, run: false, down: false };
        this._kd = (e) => this._onKey(e, true);
        this._ku = (e) => this._onKey(e, false);
        window.addEventListener('keydown', this._kd);
        window.addEventListener('keyup', this._ku);

        this.debug = new DebugOverlay();
        this.app.audio?.startMusic(this.json.meta);
    }

    exit() {
        window.removeEventListener('keydown', this._kd);
        window.removeEventListener('keyup', this._ku);
        this.debug?.destroy();
        this.app.audio?.stopMusic();
    }

    restart() {
        this.sim = createSimulation(this.json, 'entry');
        this.blockManager.reset();
        this.particles.clear();
        this.lighting.clear();
        this.camera.reset(FP.toInt(this.sim.player.s.x), 0, this.sim.level.pxW);
        this._deadTimer = 0;
        this._warpTimer = 0;
        this.titleTimer = 150;
        this.paused = false;
        this.app.audio?.duck(false);
    }

    togglePause() {
        this.paused = !this.paused;
        this.app.audio?.duck(this.paused);
        this.app.audio?.sfx?.pause();
    }

    _onKey(e, down) {
        if (!GAME_KEYS.has(e.code)) return;
        e.preventDefault();
        switch (e.code) {
            case 'ArrowLeft': case 'KeyA': this.keys.left = down; break;
            case 'ArrowRight': case 'KeyD': this.keys.right = down; break;
            case 'ArrowUp': case 'Space': case 'KeyZ': case 'KeyW': this.keys.jump = down; break;
            case 'ArrowDown': case 'KeyS': this.keys.down = down; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.run = down; break;
            case 'KeyX':
                this.keys.run = down;
                if (down && !e.repeat) this.throwQueued = true;   // X = run + chakra
                break;
            case 'KeyC':
                if (down && !e.repeat) this.throwQueued = true;   // convenience throw
                break;
        }
    }

    /* ── fixed step ───────────────────────────────────────────────────────── */

    step() {
        if (this.paused) return;

        // Hit-stop check: if game is currently in impact micro-pause, freeze step
        if (!this.gameFeel.update()) return;

        this.stepCount++;
        this.blockManager.update();

        let bits = 0;
        if (this.keys.left) bits |= BTN.LEFT;
        if (this.keys.right) bits |= BTN.RIGHT;
        if (this.keys.jump) bits |= BTN.JUMP;
        if (this.keys.run) bits |= BTN.RUN;
        if (this.keys.down) bits |= BTN.DOWN;
        bits |= TouchControls.bits & (BTN.LEFT | BTN.RIGHT | BTN.JUMP | BTN.RUN);

        let throwPressed = this.throwQueued;
        this.throwQueued = false;
        const touch = TouchControls.bits;
        if ((touch & BTN.RUN) && !(this._prevTouch & BTN.RUN)) throwPressed = true;
        this._prevTouch = touch;

        const ev = stepSimulation(this.sim, bits);
        this._consumeEvents(ev);

        const sim = this.sim;
        const p = sim.player.s;

        // Ambient movement particles
        if (p.state === P_STATE.RUN && (this.stepCount % 6 === 0)) {
            this.particles.runDust(FP.toInt(p.x), FP.toInt(p.y), p.facing);
        }
        if (sim.player.isKavach && (this.stepCount % 4 === 0)) {
            this.particles.invincibilityTrail(FP.toInt(p.x), FP.toInt(p.y));
        }
        this.particles.update();

        // Update smooth look-ahead camera
        this.camera.update(FP.toInt(p.x), FP.toInt(p.y), p.facing, FP.toNumber(p.vx), sim.level.pxW);
        this.camX = this.camera.renderX;
        this.camY = this.camera.renderY - (VIEW.H - sim.level.pxH);

        if (sim.result === 'flag') {
            if (sim.player.s.stateTimer >= PHYS.WIN_LOCK_STEPS) this.app.nextChapter();
        } else if (sim.result === 'dead') {
            this._deadTimer++;
            if (this._deadTimer > 70) this.restart();
        } else if (sim.result === 'warp') {
            this._warpTimer++;
            if (this._warpTimer >= PIPE_FADE_STEPS) {
                this.app.warpTo(sim.warpTarget.levelId, sim.warpTarget.spawnId);
            }
        }

        if (this.titleTimer > 0) this.titleTimer--;
    }

    _consumeEvents(ev) {
        const sfx = this.app.audio?.sfx;
        const p = this.sim.player.s;
        const px = FP.toInt(p.x);
        const py = FP.toInt(p.y);

        if (ev.jump) {
            this.particles.burst(px + 4, py + 12, 'dust', 3);
            sfx?.jump();
        }
        if (ev.land) {
            this.particles.landDust(px + 4, py + 10);
        }
        if (ev.bonk) {
            this.blockManager.hitBlock(ev.bonk.tx, ev.bonk.ty, this.sim.player.isSuper);
            this.gameFeel.shake(4, 1.5);
            this.particles.laddooCollect(ev.bonk.tx * 16 + 4, ev.bonk.ty * 16);
            sfx?.laddoo();
        }
        if (ev.laddoo) {
            this.particles.laddooCollect(px + 4, py + 4);
            sfx?.laddoo();
        }
        if (ev.throw) {
            this.particles.chakraTrail(px + 8, py + 8);
            sfx?.chakra();
        }
        if (ev.stomp) {
            this.gameFeel.onEnemyStomp();
            this.particles.enemyStomp(px + 4, py + 12);
            sfx?.stomp();
        } else if (ev.enemyKilled) {
            this.particles.enemyStomp(px + 4, py + 12);
            sfx?.stomp();
        }
        if (ev.shatter) {
            this.gameFeel.onBrickShatter();
            this.particles.brickShatter(ev.shatter.tx * 16, ev.shatter.ty * 16);
            sfx?.shatter();
        }
        if (ev.hurt) {
            this.gameFeel.onPlayerHurt();
            this.particles.hurtFlash(px, py);
            sfx?.hurt();
        }
        if (ev.transform) {
            this.gameFeel.onTransform();
            this.particles.powerUpTransform(px, py);
            sfx?.powerUp();
        }
        if (ev.kavach) {
            this.gameFeel.onTransform();
            this.particles.powerUpTransform(px, py);
            sfx?.kavach();
        }
        if (ev.splash || ev.pit) sfx?.splash();
        if (ev.respawn || ev.checkpoint) {
            this.particles.checkpointActivate(px, py);
            sfx?.checkpoint();
        }
        if (ev.pipe) {
            this.particles.pipeWarp(px, py);
            sfx?.pipe();
        }
        if (ev.flag) {
            this.particles.flagCelebrate(px, py);
            sfx?.flag();
        }
        if (ev.dead) {
            this.particles.deathExplosion(px, py);
            sfx?.dead();
        }
    }

    /* ── render ───────────────────────────────────────────────────────────── */

    render(ctx) {
        const sim = this.sim;
        const level = sim.level;
        const sprites = this.app.sprites;
        const grade = this.app.grade;
        const p = sim.player.s;

        const camX = this.camX;
        const camY = this.camY;

        /* 1. Five-Tier Parallax Layers */
        this.parallax.drawSky(ctx, camX, this.stepCount);
        this.parallax.drawDistant(ctx, camX, this.stepCount);
        this.parallax.drawLandmarks(ctx, camX, this.stepCount);
        this.parallax.drawForeground(ctx, camX, this.stepCount);

        /* 2. Tiles in view */
        const tx0 = Math.max(0, camX >> 4);
        const tx1 = Math.min(level.w - 1, ((camX + VIEW.W) >> 4) + 1);
        for (let ty = 0; ty < level.h; ty++) {
            for (let tx = tx0; tx <= tx1; tx++) {
                const id = level.grid[ty * level.w + tx];
                if (id === TILE_ID.AIR) continue;
                const sx = tx * TILE - camX;
                const sy = ty * TILE - camY;
                if (id === TILE_ID.WATER) sprites.drawWater(ctx, sx, sy, this.stepCount);
                else {
                    const name = tileSpriteName(id);
                    if (name) sprites.draw(ctx, name, sx, sy);
                }
            }
        }

        /* 3. World objects */
        for (const d of level.decors) d.draw(ctx, sprites, camX, camY, this.stepCount);
        for (const pipe of level.pipes) pipe.draw(ctx, sprites, camX, camY);
        for (const chk of level.checkpoints) chk.draw(ctx, sprites, camX, camY);
        for (const l of level.laddoos) l.draw(ctx, sprites, camX, camY, this.stepCount);
        if (level.flag) level.flag.draw(ctx, sprites, camX, camY);

        /* 4. Interactive block animations & brick debris */
        this.blockManager.draw(ctx, sprites, camX, camY);

        /* 5. Actors */
        for (const e of level.enemies) e.draw(ctx, sprites, camX, camY, this.stepCount);
        sim.player.draw(ctx, sprites, camX, camY, this.stepCount);
        for (const c of sim.chakras.list) c.draw(ctx, sprites, camX, camY, this.stepCount);

        /* 6. Dynamic Localized Lights */
        this.lighting.clear();
        for (const d of level.decors) {
            if (d.name === 'decor.diya' || d.name === 'decor.lamp') {
                this.lighting.addLight(d.x - camX + 8, d.y - camY + 8, 22, '#ffb632', 0.45);
            }
        }
        for (const l of level.laddoos) {
            if (!l.taken) {
                this.lighting.addLight(l.x - camX + 4, l.y - camY + 4, 14, '#ffd94a', 0.35);
            }
        }
        for (const c of sim.chakras.list) {
            if (c.alive) {
                this.lighting.addLight(FP.toInt(c.x) - camX + 8, FP.toInt(c.y) - camY + 8, 26, '#ffd94a', 0.6);
            }
        }
        if (sim.player.isKavach) {
            this.lighting.addLight(FP.toInt(p.x) - camX + 8, FP.toInt(p.y) - camY + 10, 38, '#ffd94a', 0.7);
        }
        this.lighting.draw(ctx);

        /* 7. Particles & Atmospheric Weather */
        this.particles.draw(ctx);
        this.parallax.drawWeather(ctx, this.stepCount);

        /* 8. Color Grade Matrix Pass & Screen Transitions */
        grade.apply(ctx);

        /* 9. UI / HUD */
        this.app.hud.draw(ctx, {
            sprites,
            laddoos: p.laddoos,
            par: level.par.laddoos,
            lives: Math.max(0, p.lives),
            step: this.stepCount,
            muted: !!this.app.audio?.muted,
            paused: this.paused,
            chapter: level.meta.chapter,
            title: level.meta.name,
            land: level.meta.land,
            titleTimer: this.titleTimer,
        });

        /* Warp fade */
        if (sim.result === 'warp') {
            ctx.fillStyle = `rgba(24,16,34,${Math.min(1, this._warpTimer / PIPE_FADE_STEPS)})`;
            ctx.fillRect(0, 0, VIEW.W, VIEW.H);
        }

        this.debug.draw(ctx, this);
    }
}