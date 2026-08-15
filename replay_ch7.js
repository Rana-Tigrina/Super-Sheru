import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP } from './src/core/constants.js';
import fs from 'fs';

const level = JSON.parse(fs.readFileSync('./levels/ch7_01.json', 'utf8'));
const proof = JSON.parse(fs.readFileSync('./proofs/ch7_01.proof.json', 'utf8'));

console.log('Replaying ch7_01 proof:', proof.steps, 'steps, result:', proof.result);

const sim = createSimulation(level, 'entry');

// Convert RLE inputs to per-step array
const inputs = [];
for (let i = 0; i < proof.inputs.length - 1; i++) {
    const curr = proof.inputs[i];
    const next = proof.inputs[i + 1];
    for (let t = curr.t; t < next.t; t++) {
        inputs.push(curr.b);
    }
}
// Fill remaining steps with last input
const lastInput = proof.inputs[proof.inputs.length - 1];
for (let t = lastInput.t; t < proof.steps; t++) {
    inputs.push(lastInput.b);
}

console.log('Generated', inputs.length, 'input frames');

// Replay
for (let t = 0; t < proof.steps && sim.result === 'playing'; t++) {
    const bits = inputs[t] || 0;
    stepSimulation(sim, bits);
    
    if (t % 200 === 0) {
        const p = sim.player.s;
        console.log('Step', t, 'x=', FP.toInt(p.x), 'y=', FP.toInt(p.y), 'result=', sim.result);
    }
}

console.log('\\nFinal: steps=', proof.steps, 'result=', sim.result, 'laddoos=', sim.player.s.laddoos);
console.log('Expected result:', proof.result, 'Expected laddoos:', proof.laddoos);
console.log('Hash OK:', sim.inputHash === proof.inputHash);
