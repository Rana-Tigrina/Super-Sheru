#!/usr/bin/env node
/* tools/grd-solver.mjs — the proof gate.
 * For each chapter: if the shipped proof still replays to the flag with a
 * matching FNV hash → keep it. Otherwise re-solve with the autopilot
 * (4 styles) and write a fresh proofs/<id>.proof.json.
 *
 *   node tools/grd-solver.mjs --all
 *   node tools/grd-solver.mjs --level ch4_01
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { autopilotLevel } from '../tests/autopilot.mjs';
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
const proofPath = (id) => new URL(`../proofs/${id}.proof.json`, import.meta.url);

function solve(id) {
    const level = loadLevel(id);
    const path = proofPath(id);

    /* 1 — existing proof still valid? */
    if (existsSync(path)) {
        try {
            const proof = JSON.parse(readFileSync(path, 'utf8'));
            const r = runGhostTest(level, proof);
            if (r.result === 'flag' && r.hashOk) {
                console.log(`  ✓ ${id}: shipped proof replays → flag in ${r.steps} steps`);
                return true;
            }
            console.log(`  … ${id}: shipped proof stale (${r.result}, hashOk=${r.hashOk}) — re-solving`);
        } catch {
            console.log(`  … ${id}: shipped proof unreadable — re-solving`);
        }
    }

    /* 2 — autopilot search across styles */
    for (const style of [0, 1, 2, 3]) {
        const run = autopilotLevel(level, { style, maxSteps: 14000 });
        if (run.result === 'flag') {
            const doc = {
                format: 'grd2/proof',
                levelId: id,
                engineVersion: ENGINE_VERSION,
                steps: run.steps,
                result: 'flag',
                laddoos: run.laddoos,
                inputHash: hex(hashInputVector(run.inputs)),
                inputs: run.inputs,
            };
            writeFileSync(path, JSON.stringify(doc, null, 2) + '\n');
            console.log(`  ✓ ${id}: PROVED (style ${style}) → flag in ${run.steps} steps, ${run.laddoos} laddoos`);
            return true;
        }
    }

    console.error(`  ✗ ${id}: UNSOLVED — level fails the GRD gate`);
    return false;
}

/* ── CLI ────────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
let ids = CHAPTERS;
if (args.includes('--level')) {
    const id = args[args.indexOf('--level') + 1];
    ids = CHAPTERS.includes(id) ? [id] : [];
    if (!ids.length) { console.error(`unknown level '${id}'`); process.exit(2); }
} else if (!args.includes('--all')) {
    console.log('usage: grd-solver.mjs --all | --level <id>');
    process.exit(2);
}

console.log('grd-solver · engine ' + ENGINE_VERSION);
let ok = 0;
for (const id of ids) if (solve(id)) ok++;

console.log(`module-proven levels: ${ok}/${ids.length}`);
process.exit(ok === ids.length ? 0 : 1);