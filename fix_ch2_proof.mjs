import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { hashInputVector } from './src/core/util.js';
import { readFileSync, writeFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

// Based on detailed trace analysis:
// Player moves ~1.9px/step when walking
// Gap 1 at cols 18-20 (x=288-320): jump at x~273 (step ~122)
// Gap 2 at cols 39-42 (x=624-672): jump at x~600 
// Pipe at tx=58 (x=928-960): jump at x~900
// Gap 3 at cols 63-66 (x=1008-1056): jump at x~980
// Flag at tx=76 (x=1216)

// Use longer jump holds to clear obstacles
const inputs = [
    { t: 0, b: BTN.RIGHT },
    { t: 118, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },   // Gap 1
    { t: 145, b: BTN.RIGHT },
    { t: 310, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },   // Gap 2  
    { t: 340, b: BTN.RIGHT },
    { t: 470, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },   // Pipe
    { t: 510, b: BTN.RIGHT },
    { t: 530, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },   // Gap 3
    { t: 560, b: BTN.RIGHT },
];

console.log("Testing ch2_01 proof attempt...");
const sim = createSimulation(level, 'entry');

for (let i = 0; i < 1000 && sim.result === 'playing'; i++) {
    let bits = 0;
    for (let j = inputs.length - 1; j >= 0; j--) {
        if (inputs[j].t <= i) {
            bits = inputs[j].b;
            break;
        }
    }
    
    stepSimulation(sim, bits);
    
    if (i % 100 === 0 || (i > 100 && i < 150) || (i > 300 && i < 350) || (i > 460 && i < 520) || sim.result !== 'playing') {
        const px = FP.toNumber(sim.player.s.x);
        const py = FP.toNumber(sim.player.s.y);
        console.log(`Step ${i}: x=${px.toFixed(1)}, y=${py.toFixed(1)}, result=${sim.result}`);
    }
}

console.log(`\nFinal: result=${sim.result}, steps=${sim.step}`);
if (sim.result === 'flag') {
    console.log("SUCCESS!");
    const hash = hashInputVector(inputs);
    const proof = {
        format: 'grd2/proof',
        levelId: 'ch2_01',
        engineVersion: '2.0.0',
        steps: sim.step,
        result: 'flag',
        laddoos: sim.player.s.laddoos,
        inputHash: '0x' + (hash >>> 0).toString(16).padStart(8, '0'),
        inputs: inputs
    };
    writeFileSync('./proofs/ch2_01.proof.json', JSON.stringify(proof, null, 2) + '\n');
    console.log(JSON.stringify(proof, null, 2));
}
