import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

// Manually crafted proof based on level analysis
// ch2_01: 80 cols, gaps at 18-20, 39-42, pipe at 58-59, gap at 63-66, flag at 76
const inputs = [
    { t: 0, b: BTN.RIGHT },           // Run right from start
    { t: 280, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump gap at col 18
    { t: 300, b: BTN.RIGHT },
    { t: 580, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump gap at col 39
    { t: 600, b: BTN.RIGHT },
    { t: 880, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump over pipe at col 58
    { t: 920, b: BTN.RIGHT },
    { t: 1000, b: BTN.RIGHT | BTN.JUMP | BTN.RUN }, // Jump gap at col 63
    { t: 1020, b: BTN.RIGHT },
];

console.log("Testing manually crafted proof...");
const sim = createSimulation(level, 'entry');

let inputIdx = 0;
for (let i = 0; i < 1500 && sim.result === 'playing'; i++) {
    // Find current input
    let bits = 0;
    for (let j = inputs.length - 1; j >= 0; j--) {
        if (inputs[j].t <= i) {
            bits = inputs[j].b;
            break;
        }
    }
    
    stepSimulation(sim, bits);
    const px = FP.toNumber(sim.player.s.x);
    const py = FP.toNumber(sim.player.s.y);
    const col = Math.floor(px / 16);
    
    if (i % 100 === 0 || sim.result !== 'playing') {
        console.log(`Step ${i}: x=${px.toFixed(1)} (${col}), y=${py.toFixed(1)}, bits=${bits.toString(2).padStart(5,'0')}, result=${sim.result}`);
    }
}

console.log(`\nFinal: result=${sim.result}, steps=${sim.step}`);
if (sim.result === 'flag') {
    console.log("SUCCESS! Generating proof file...");
    const proof = {
        format: 'grd2/proof',
        levelId: 'ch2_01',
        engineVersion: '2.0.0',
        steps: sim.step,
        result: 'flag',
        laddoos: sim.player.s.laddoos,
        inputHash: '0x00000000', // Will be calculated
        inputs: inputs
    };
    console.log(JSON.stringify(proof, null, 2));
}
