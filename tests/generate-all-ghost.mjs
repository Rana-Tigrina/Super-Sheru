#!/usr/bin/env node
/* tests/generate-all-ghosts.mjs — regenerate all eight ghosts with the
 * autopilot (style 1, "relaxed"), then replay-verify each one. The build
 * claims "ghost-tested 8/8" only if every replay reaches the flag.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { autopilotLevel } from './autopilot.mjs';
import { runGhostTest } from '../src/verification/FixedStepVerifier.js';
import { hashInputVector } from '../src/core/util.js';
import { ENGINE_VERSION } from '../src/core/constants.js';

const CHAPTERS = [
    'ch1_01', 'ch2_01', 'ch3_01', 'ch4_01',
    'ch5_01', 'ch6_01', 'ch7_01', 'ch8_01',
];

const hex = (h) => '0x' + (h >>> 0).toString(16).padStart(8, '0');
const loadLevel = (id) =>
    JSON.parse(readFileSync(new URL(`../levels/${id}.json`, import.meta.url), 'utf8'));

let ok = 0;
for (const id of CHAPTERS) {
    const level = loadLevel(id);
    const run = autopilotLevel(level, { style: 1, maxSteps: 14000 });

    if (run.result !== 'flag') {
        console.error(`  ✗ ${id}: autopilot failed to record a ghost (${run.result})`);
        continue;
    }

    const doc = {
        format: 'grd2/ghost',
        levelId: id,
        engineVersion: ENGINE_VERSION,
        steps: run.steps,
        result: 'flag',
        laddoos: run.laddoos,
        inputHash: hex(hashInputVector(run.inputs)),
        inputs: run.inputs,
    };
    const out = new URL(`./ghosts/${id}.ghost.json`, import.meta.url);
    writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');

    /* trust but verify: replay what we just wrote */
    const r = runGhostTest(level, doc);
    if (r.result === 'flag' && r.hashOk) {
        console.log(`  ✓ ${id}: ghost recorded & replayed → flag in ${r.steps} steps`);
        ok++;
    } else {
        console.error(`  ✗ ${id}: ghost written but replay diverged (${r.result})`);
    }
}

console.log(`ghost-tested ${ok}/${CHAPTERS.length}`);
process.exit(ok === CHAPTERS.length ? 0 : 1);