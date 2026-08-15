#!/usr/bin/env node
/* tools/benchmark.mjs — sim throughput sanity. GRD doesn't care about
 * speed, but a 60 Hz fixed step must stay cheap on potato hardware too.
 */

import { readFileSync } from 'node:fs';
import { createSimulation, stepSimulation } from '../src/verification/FixedStepVerifier.js';
import { autopilotLevel } from '../tests/autopilot.mjs';

const load = (id) => JSON.parse(readFileSync(new URL(`../levels/${id}.json`, import.meta.url), 'utf8'));

/* raw step throughput on the biggest level */
const level = load('ch8_01');
const sim = createSimulation(level, 'entry');
const STEPS = 20000;

const t0 = process.hrtime.bigint();
for (let t = 0; t < STEPS; t++) stepSimulation(sim, t % 90 < 60 ? 2 : 6);
const t1 = process.hrtime.bigint();

const ms = Number(t1 - t0) / 1e6;
console.log(`raw sim:    ${STEPS} steps in ${ms.toFixed(1)} ms`);
console.log(`            ${(STEPS / ms).toFixed(0)} steps/ms · ${(ms / STEPS * 1000).toFixed(2)} µs/step`);
console.log(`            budget: 16.67 ms/frame → ${(16.67 / (ms / STEPS)).toFixed(0)}× headroom`);

/* full autopilot pass over all chapters */
console.log('\nautopilot solve times:');
const ids = ['ch1_01', 'ch2_01', 'ch3_01', 'ch4_01', 'ch5_01', 'ch6_01', 'ch7_01', 'ch8_01'];
for (const id of ids) {
    const a = process.hrtime.bigint();
    const run = autopilotLevel(load(id), { style: 0, maxSteps: 14000 });
    const b = process.hrtime.bigint();
    const took = Number(b - a) / 1e6;
    console.log(`  ${id}: ${run.result.padEnd(7)} ${String(run.steps).padStart(5)} steps in ${took.toFixed(0)} ms`);
}