/* src/scenes/GameScene.js — plays one level.
 * The world IS a FixedStepVerifier simulation: identical step semantics to
 * proofs/ghosts. This scene adds input, audio, camera, rendering, HUD, and game feel.
 */

import { VIEW, PHYS, BTN, P_STATE, FP, TILE, TILE_ID } from '../core/constants.js';
import { SpriteFactory, tileSpriteName } from '../art/SpriteFactory.js';
import { ColorGradePipeline } from '../render/ColorGradePipeline.js';
import { Camera } from '../render/Camera.js';
import { GameFeel } from '../core/GameFeel.js';
import { BlockManager } from '../level/BlockManager.js';
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
        if (!sfx) return;
        if (ev.jump) sfx.jump();
        if (ev.bonk) {
            this.blockManager.hitBlock(ev.bonk.tx, ev.bonk.ty, this.sim.player.isSuper);
            this.gameFeel.shake(4, 1.5);
            sfx.laddoo();
        }
        if (ev.laddoo) sfx.laddoo();
        if (ev.throw) sfx.chakra();
        if (ev.stomp) {
            this.gameFeel.onEnemyStomp();
            sfx.stomp();
        } else if (ev.enemyKilled) {
            sfx.stomp();
        }
        if (ev.shatter) {
            this.gameFeel.onBrickShatter();
            sfx.pause();
        }
        if (ev.hurt) {
            this.gameFeel.onPlayerHurt();
            sfx.hurt();
        }
        if (ev.transform) {
            this.gameFeel.onTransform();
            sfx.laddoo();
        }
        if (ev.kavach) {
            this.gameFeel.onTransform();
            sfx.laddoo();
        }
        if (ev.splash || ev.pit) sfx.splash();
        if (ev.respawn || ev.checkpoint) sfx.checkpoint();
        if (ev.pipe) sfx.pipe();
        if (ev.flag) sfx.flag();
        if (ev.dead) sfx.dead();
    }

    /* ── render ───────────────────────────────────────────────────────────── */

    render(ctx) {
        const sim = this.sim;
        const level = sim.level;
        const sprites = this.app.sprites;
        const grade = this.app.grade;
        const p = sim.player.s;

        grade.drawSky(ctx);

        const camX = this.camX;
        const camY = this.camY;

        /* tiles in view */
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

        /* world objects */
        for (const d of level.decors) d.draw(ctx, sprites, camX, camY, this.stepCount);
        for (const pipe of level.pipes) pipe.draw(ctx, sprites, camX, camY);
        for (const chk of level.checkpoints) chk.draw(ctx, sprites, camX, camY);
        for (const l of level.laddoos) l.draw(ctx, sprites, camX, camY, this.stepCount);
        if (level.flag) level.flag.draw(ctx, sprites, camX, camY);

        /* interactive block animations & brick debris */
        this.blockManager.draw(ctx, sprites, camX, camY);

        /* actors */
        for (const e of level.enemies) e.draw(ctx, sprites, camX, camY, this.stepCount);
        sim.player.draw(ctx, sprites, camX, camY, this.stepCount);
        for (const c of sim.chakras.list) c.draw(ctx, sprites, camX, camY, this.stepCount);

        /* grade pass, then UI */
        grade.drawWeather(ctx, this.stepCount);
        grade.apply(ctx);

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

        /* warp fade */
        if (sim.result === 'warp') {
            ctx.fillStyle = `rgba(24,16,34,${Math.min(1, this._warpTimer / PIPE_FADE_STEPS)})`;
            ctx.fillRect(0, 0, VIEW.W, VIEW.H);
        }

        this.debug.draw(ctx, this);
    }
}