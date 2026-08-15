/* main.js — Super Sheru Bros · GRD v2 boot
 * ─────────────────────────────────────────
 * Owns: level manifest, canvas, the fixed-step clock, scene routing,
 * and the global keys (Enter start · P pause · M mute · R restart).
 *
 * GRD rule #1: the simulation advances ONLY inside whole fixed steps.
 * Rendering may happen any number of times between steps; it never
 * mutates state. See docs/GRD_v2.md §3.
 */

import ch1_01 from './levels/ch1_01.json';
import ch2_01 from './levels/ch2_01.json';
import ch2_bonus from './levels/ch2_bonus.json';
import ch3_01 from './levels/ch3_01.json';
import ch4_01 from './levels/ch4_01.json';
import ch5_01 from './levels/ch5_01.json';
import ch6_01 from './levels/ch6_01.json';
import ch6_bonus from './levels/ch6_bonus.json';
import ch7_01 from './levels/ch7_01.json';
import ch8_01 from './levels/ch8_01.json';

import { PHYS } from './src/core/constants.js';
import { AudioEngine } from './src/audio/AudioEngine.js';
import { TitleScene } from './src/scenes/TitleScene.js';
import { GameScene } from './src/scenes/GameScene.js';
import { EndingScene } from './src/scenes/EndingScene.js';
import { TouchControls } from './src/ui/TouchControls.js';

/** GRD v2 level manifest — single source of truth for scenes, solver, tests. */
export const LEVELS = {
    ch1_01, ch2_01, ch2_bonus, ch3_01, ch4_01,
    ch5_01, ch6_01, ch6_bonus, ch7_01, ch8_01,
};

/** The eight lands of Bharat, in play order. */
export const CHAPTERS = [
    'ch1_01', 'ch2_01', 'ch3_01', 'ch4_01',
    'ch5_01', 'ch6_01', 'ch7_01', 'ch8_01',
];

/* ── canvas ─────────────────────────────────────────────────────────────── */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;            // pixels stay pixels

/* ── app object passed to every scene ───────────────────────────────────── */
const app = {
    canvas, ctx,
    levels: LEVELS,
    chapters: CHAPTERS,
    audio: null,                                // created below (needs gesture)
    scene: null,
    chapterIndex: 0,
    goto(scene) {
        this.scene?.exit?.();
        this.scene = scene;
        scene.enter?.();
    },
};

/* ── scene routing ──────────────────────────────────────────────────────── */
export function startGame() {
    app.chapterIndex = 0;
    app.goto(new GameScene(app, CHAPTERS[0], 'entry'));
}

export function nextChapter() {
    app.chapterIndex += 1;
    if (app.chapterIndex >= CHAPTERS.length) app.goto(new EndingScene(app));
    else app.goto(new GameScene(app, CHAPTERS[app.chapterIndex], 'entry'));
}

/** Pipe warps (ch2 ↔ ch2_bonus, ch6 ↔ ch6_bonus). Chapter index is preserved. */
export function warpTo(levelId, spawnId = 'entry') {
    app.goto(new GameScene(app, levelId, spawnId));
}

/* ── audio (created lazily; browsers demand a user gesture) ─────────────── */
app.audio = new AudioEngine();
window.addEventListener('pointerdown', () => app.audio.unlock(), { once: true });
window.addEventListener('keydown', () => app.audio.unlock(), { once: true });

/* ── global keys ────────────────────────────────────────────────────────── */
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    switch (e.code) {
        case 'Enter':
            if (app.scene?.id === 'title') startGame();
            else if (app.scene?.id === 'ending') app.goto(new TitleScene(app));
            break;
        case 'KeyP': app.scene?.togglePause?.(); break;
        case 'KeyM': app.audio.toggleMute(); break;
        case 'KeyR':
            if (app.scene?.id === 'game') app.scene.restart();
            break;
    }
});

TouchControls.mount(document.getElementById('touch'), app);

/* ── the fixed-step clock ───────────────────────────────────────────────── */
const STEP_MS = 1000 / PHYS.HZ;   // 16.66… ms — the only clock that matters
const MAX_ACC = STEP_MS * 5;      // spiral-of-death clamp (tab-switch etc.)

let last = performance.now();
let acc = 0;

function frame(now) {
    acc += Math.min(now - last, MAX_ACC);
    last = now;

    while (acc >= STEP_MS) {
        app.scene?.step?.();            // exactly one deterministic tick
        acc -= STEP_MS;
    }

    app.scene?.render?.(ctx);         // draw latest verified state, 1:1
    requestAnimationFrame(frame);
}

app.goto(new TitleScene(app));
requestAnimationFrame(frame);