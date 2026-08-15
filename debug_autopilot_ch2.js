import { autopilotLevel, collapseBits } from './tests/autopilot.mjs';
import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

console.log("Detailed autopilot trace for ch2_01 style 0:");
const result = autopilotLevel(level, { style: 0, maxSteps: 950 });
console.log(`Result: ${result.result}, Steps: ${result.steps}, Laddoos: ${result.laddoos}`);

// Expand inputs and trace
const inputs = collapseBits(result.inputs);
console.log("\nInput sequence:");
inputs.forEach((inp, i) => {
    if (i < 30 || i > inputs.length - 10) {
        console.log(`  t=${inp.t.toString().padStart(4)}: b=${inp.b.toString(2).padStart(5,'0')} (R=${!!(inp.b&2)}, J=${!!(inp.b&4)}, RUN=${!!(inp.b&8)})`);
    } else if (i === 30) {
        console.log("  ...");
    }
});

// Trace simulation
console.log("\nSimulating with autopilot inputs:");
const sim = createSimulation(level, 'entry');
const vec = new Uint8Array(1000);
for (let i = 0; i < inputs.length; i++) {
    const start = inputs[i].t;
    const end = (i + 1 < inputs.length) ? inputs[i + 1].t : 1000;
    for (let s = start; s < end && s < 1000; s++) vec[s] = inputs[i].b;
}

for (let i = 0; i < 950 && sim.result === 'playing'; i++) {
    stepSimulation(sim, vec[i]);
    const pos = sim.player.s;
    const px = FP.toNumber(pos.x);
    const py = FP.toNumber(pos.y);
    
    // Print key moments
    if (i < 20 || i > 880 || (i % 100 === 0)) {
        console.log(`Step ${i}: x=${px.toFixed(1)}(${Math.floor(px/16)}), y=${py.toFixed(1)}, bits=${vec[i].toString(2).padStart(5,'0')}, result=${sim.result}`);
    }
    
    // Check gaps
    if (px > 280 && px < 340 && py > 250) {
        console.log(`  >>> FALLING at step ${i}: x=${px.toFixed(1)}, y=${py.toFixed(1)}`);
    }
}
console.log(`\nFinal: result=${sim.result}, x=${FP.toNumber(sim.player.s.x).toFixed(1)}, y=${FP.toNumber(sim.player.s.y).toFixed(1)}`);
