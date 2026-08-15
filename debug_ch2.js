import { createSimulation, stepSimulation, runGhostTest } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));
const proof = JSON.parse(readFileSync('./proofs/ch2_01.proof.json', 'utf8'));

console.log("Testing existing proof replay...");
const result = runGhostTest(level, proof);
console.log("Result:", result.result, "hashOk:", result.hashOk, "steps:", result.steps);

// Let's trace through manually
console.log("\nManual trace of first 100 steps:");
const sim = createSimulation(level, 'entry');
const p = sim.player.s;
console.log(`Start: x=${FP.toNumber(p.x).toFixed(2)}, y=${FP.toNumber(p.y).toFixed(2)}, w=${p.w}, h=${p.h}`);

for (let i = 0; i < 100 && sim.result === 'playing'; i++) {
    const input = proof.inputs.find(inp => inp.t === i);
    if (input) {
        console.log(`Step ${i}: input=${input.b.toString(2).padStart(5,'0')} (R=${!!(input.b&BTN.RIGHT)}, J=${!!(input.b&BTN.JUMP)}, RUN=${!!(input.b&BTN.RUN)})`);
    }
    stepSimulation(sim, input ? input.b : 0);
    const pos = sim.player.s;
    if (i % 10 === 0 || input) {
        console.log(`  -> x=${FP.toNumber(pos.x).toFixed(2)}, y=${FP.toNumber(pos.y).toFixed(2)}, vy=${FP.toNumber(pos.vy).toFixed(2)}, ground=${sim.player.ground}`);
    }
}
