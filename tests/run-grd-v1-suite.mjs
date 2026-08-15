#!/usr/bin/env node
/* tests/run-grd-v1-suite.mjs — the GRD gate suite (name kept from v1 CI).
 *   unit checks → determinism → proof replays → ghost replays
 * Hint: proofs/ghosts are build artifacts. If replays fail, refresh them:
 *   npm run prove && npm run ghosts
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { FP, P_STATE, PHYS } from '../src/core/constants.js';
import { aabb, combineHashes, hashInputVector } from '../src/core/util.js';
import { resolvePlayerEnemy, CONTACT } from '../src/core/combat.js';
import { loadLevel } from '../src/level/MacroLevelLoader.js';
import { createSimulation, stepSimulation, runGhostTest } from '../src/verification/FixedStepVerifier.js';

let pass = 0, fail = 0;
function check(name, cond, hint = '') {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.error(`  ✗ ${name}${hint ? ' — ' + hint : ''}`); }
}

const ALL_LEVELS = [
    'ch1_01', 'ch2_01', 'ch2_bonus', 'ch3_01', 'ch4_01', 'ch5_01',
    'ch6_01', 'ch6_bonus', 'ch7_01', 'ch8_01',
];
const CHAPTERS = ALL_LEVELS.filter((id) => !id.includes('bonus'));
const load = (id) => JSON.parse(readFileSync(new URL(`../levels/${id}.json`, import.meta.url), 'utf8'));

/* ── 1 · FP sanity ─────────────────────────────────────────────────────── */
console.log('\n[1] fixed point');
check('fromNumber/toNumber roundtrip', FP.toNumber(FP.fromNumber(3.140625)) === 3.140625);
check('mul', FP.mul(FP.fromNumber(2.5), FP.fromNumber(4)) === FP.fromNumber(10));
check('div', FP.div(FP.fromNumber(10), FP.fromNumber(4)) === FP.fromNumber(2.5));
check('sin(0)=0 · sin(64)=ONE · sin(192)=-ONE',
    FP.sin(0) === 0 && FP.sin(64) === FP.ONE && FP.sin(192) === -FP.ONE);
let sym = true;
for (let i = 0; i < 256; i++) if (FP.sin((i + 128) & 255) !== -FP.sin(i)) sym = false;
check('sin half-wave antisymmetry (256 phases)', sym);

/* ── 2 · aabb ──────────────────────────────────────────────────────────── */
console.log('\n[2] collision primitives');
check('overlap', aabb(0, 0, 10, 10, 5, 5, 10, 10) === true);
check('separate', aabb(0, 0, 10, 10, 20, 0, 5, 5) === false);
check('edge-touch is not overlap', aabb(0, 0, 10, 10, 10, 0, 5, 5) === false);

/* ── 3 · hashing ───────────────────────────────────────────────────────── */
console.log('\n[3] hashing');
check('combineHashes deterministic', combineHashes(7, 13) === combineHashes(7, 13));
check('combineHashes order-sensitive', combineHashes(7, 13) !== combineHashes(13, 7));
const v1 = [{ t: 0, b: 2 }, { t: 10, b: 6 }];
check('hashInputVector deterministic', hashInputVector(v1) === hashInputVector(v1));
check('hashInputVector input-sensitive',
    hashInputVector(v1) !== hashInputVector([{ t: 0, b: 2 }, { t: 11, b: 6 }]));

/* ── 4 · combat table ──────────────────────────────────────────────────── */
console.log('\n[4] combat resolution');
check('falling onto enemy (TOP, vy>0) → stomp',
    resolvePlayerEnemy(P_STATE.FALL, CONTACT.TOP, FP.fromInt(1)).action === 'stomp');
check('rising into enemy (TOP, vy<0) → hurt',
    resolvePlayerEnemy(P_STATE.JUMP, CONTACT.TOP, FP.fromInt(-1)).action === 'hurt');
check('side contact → hurt',
    resolvePlayerEnemy(P_STATE.RUN, CONTACT.SIDE, FP.fromInt(1)).action === 'hurt');
check('STOMP state keeps stomping',
    resolvePlayerEnemy(P_STATE.STOMP, CONTACT.TOP, FP.fromInt(1)).action === 'stomp');
let deadSafe = true;
for (const st of [P_STATE.HURT, P_STATE.DEAD, P_STATE.WIN])
    for (let sd = 0; sd < 3; sd++)
        if (resolvePlayerEnemy(st, sd, FP.fromInt(1)).action !== 'none') deadSafe = false;
check('HURT/DEAD/WIN never interact', deadSafe);

/* ── 5 · level loader ──────────────────────────────────────────────────── */
console.log('\n[5] levels');
for (const id of ALL_LEVELS) {
    try {
        const json = load(id);
        const lvl = loadLevel(json);
        const okGrid = lvl.grid.length === lvl.w * lvl.h;
        const okFlag = id.includes('bonus') ? true : !!lvl.flag;
        const okPipes = lvl.pipes.every((pp) => existsSync(new URL(`../levels/${pp.target}.json`, import.meta.url)));
        check(`${id}: grid ${lvl.w}×${lvl.h}, flag, pipes resolve`, okGrid && okFlag && okPipes);

        /* advisory: par vs collectables */
        let blocks = 0;
        for (let i = 0; i < lvl.grid.length; i++) if (lvl.grid[i] === 3) blocks++;
        const collect = lvl.laddoos.length + blocks;
        if (collect !== lvl.par.laddoos) {
            console.log(`     ⚠ ${id}: par ${lvl.par.laddoos} vs collectables ${collect} (advisory)`);
        }
    } catch (err) {
        check(`${id}: loads`, false, err.message);
    }
}

/* ── 6 · determinism ───────────────────────────────────────────────────── */
console.log('\n[6] determinism');
function scriptedRun(id, steps) {
    const sim = createSimulation(load(id), 'entry');
    for (let t = 0; t < steps; t++) {
        const bits = (t % 90 < 55) ? 2 : (t % 90 < 75 ? 6 : 0);
        stepSimulation(sim, bits);
    }
    const p = sim.player.s;
    let gh = 1;
    for (let i = 0; i < sim.level.grid.length; i += 7) gh = combineHashes(gh, sim.level.grid[i]);
    return [p.x, p.y, p.vx, p.vy, p.laddoos, p.lives, gh].join('|');
}
for (const id of ['ch1_01', 'ch4_01']) {
    check(`${id}: two runs are bit-identical (900 steps)`, scriptedRun(id, 900) === scriptedRun(id, 900));
}

/* ── 7 · proof replays (THE gate) ──────────────────────────────────────── */
console.log('\n[7] proof replays');
for (const id of CHAPTERS) {
    const path = new URL(`../proofs/${id}.proof.json`, import.meta.url);
    if (!existsSync(path)) { check(`${id}: proof exists`, false, 'run npm run prove'); continue; }
    const proof = JSON.parse(readFileSync(path, 'utf8'));
    const r = runGhostTest(load(id), proof);
    check(`${id}: proof replays → flag`, r.result === 'flag' && r.hashOk,
        `result=${r.result}, hashOk=${r.hashOk} — run npm run prove`);
}

/* ── 8 · ghost replays ─────────────────────────────────────────────────── */
console.log('\n[8] ghost replays');
let ghostOk = 0;
for (const id of CHAPTERS) {
    const path = new URL(`./ghosts/${id}.ghost.json`, import.meta.url);
    if (!existsSync(path)) { console.log(`  - ${id}: no ghost yet (npm run ghosts)`); continue; }
    const ghost = JSON.parse(readFileSync(path, 'utf8'));
    const r = runGhostTest(load(id), ghost);
    check(`${id}: ghost replays → flag`, r.result === 'flag' && r.hashOk, `result=${r.result}`);
    ghostOk++;
}
console.log(`  ghost-tested ${ghostOk}/${CHAPTERS.length}`);

/* ── summary ───────────────────────────────────────────────────────────── */
console.log(`\nGRD suite: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);