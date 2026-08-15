#!/usr/bin/env node
/* tests/record-ghost.mjs — play a level from the terminal at 60 Hz and
 * save your run as a ghost.
 *
 *   node tests/record-ghost.mjs ch1_01 [out.json]
 *
 * Keys: ← → / A D move · SPACE / Z jump (hold = higher) · X run + chakra
 *       R restart · ESC finish & save · Ctrl-C abort
 * (Terminal raw mode can't see Shift, so X covers run/throw.)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createSimulation, stepSimulation } from '../src/verification/FixedStepVerifier.js';
import { runGhostTest } from '../src/verification/FixedStepVerifier.js';
import { collapseBits } from './autopilot.mjs';
import { hashInputVector } from '../src/core/util.js';
import { BTN, ENGINE_VERSION, FP } from '../src/core/constants.js';

const id = process.argv[2];
if (!id) { console.error('usage: record-ghost.mjs <levelId> [out.json]'); process.exit(2); }

const level = JSON.parse(readFileSync(new URL(`../levels/${id}.json`, import.meta.url), 'utf8'));
const outPath = process.argv[3]
    ? new URL(process.argv[3], `file://${process.cwd()}/`)
    : new URL(`./ghosts/${id}.ghost.json`, import.meta.url);

let sim = createSimulation(level, 'entry');
const stream = [];
let bits = 0, throwEdge = false, done = false;

const KEYMAP = {
    '\x1b[D': ['left', true], '\x1b[C': ['right', true],
    'a': ['left', true], 'd': ['right', true],
    ' ': ['jump', true], 'z': ['jump', true],
    'x': ['run', true],
};
const UPS = { '\x1b[D': 'left', '\x1b[C': 'right', a: 'left', d: 'right', ' ': 'jump', z: 'jump', x: 'run' };
const held = { left: false, right: false, jump: false, run: false };

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (buf) => {
    const k = buf.toString('utf8');
    if (k === '\x03') process.exit(1);                    // Ctrl-C
    if (k === '\x1b' || k === 'q') return finish();       // ESC / q
    if (k === 'r') { sim = createSimulation(level, 'entry'); stream.length = 0; return; }
    if (k === 'x' && !held.run) throwEdge = true;
    const dn = KEYMAP[k];
    if (dn) held[dn[0]] = true;
    if (UPS[k]) held[UPS[k]] = false;
});

function rebuildBits() {
    bits = (held.left ? BTN.LEFT : 0) | (held.right ? BTN.RIGHT : 0) |
        (held.jump ? BTN.JUMP : 0) | (held.run ? BTN.RUN : 0) |
        (throwEdge ? BTN.THROW : 0);
    throwEdge = false;
}

const timer = setInterval(() => {
    if (done) return;
    rebuildBits();
    stream.push(bits);
    stepSimulation(sim, bits);

    if (sim.step % 30 === 0) {
        const p = sim.player.s;
        process.stdout.write(
            `\r  step ${String(sim.step).padStart(5)} · x ${FP.toInt(p.x)} · laddoos ${p.laddoos} · lives ${p.lives} · ${sim.result}   `,
        );
    }
    if (sim.result === 'flag' || sim.result === 'dead' || sim.step >= 30000) finish();
}, 1000 / 60);

function finish() {
    if (done) return;
    done = true;
    clearInterval(timer);
    process.stdin.setRawMode(false);
    console.log('\n');

    const inputs = collapseBits(stream);
    const doc = {
        format: 'grd2/ghost',
        levelId: id,
        engineVersion: ENGINE_VERSION,
        steps: stream.length,
        result: sim.result,
        laddoos: sim.player.s.laddoos,
        inputHash: '0x' + (hashInputVector(inputs) >>> 0).toString(16).padStart(8, '0'),
        inputs,
    };
    writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n');

    const r = runGhostTest(level, doc);
    console.log(`  saved ${outPath.pathname}`);
    console.log(`  replay: ${r.result} in ${r.steps} steps · hashOk=${r.hashOk}`);
    process.exit(r.result === 'flag' ? 0 : 1);
}