import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN, TILE } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));
const proof = JSON.parse(readFileSync('./proofs/ch2_01.proof.json', 'utf8'));

console.log("Manual trace through entire proof (742 steps):");
const sim = createSimulation(level, 'entry');

// Get tile positions for key objects
const pipe = level.entities?.find(e => e.type === 'pipe');
console.log("Pipe at:", pipe ? `tx=${pipe.tx}, ty=${pipe.ty}, w=${pipe.w}, h=${pipe.h}` : "not found");
const flag = level.entities?.find(e => e.type === 'flag');
console.log("Flag at:", flag ? `tx=${flag.tx}` : "not found");

for (let i = 0; i < 800 && sim.result === 'playing'; i++) {
    // Find current input
    let bits = 0;
    for (let j = proof.inputs.length - 1; j >= 0; j--) {
        if (proof.inputs[j].t <= i) {
            bits = proof.inputs[j].b;
            break;
        }
    }
    
    stepSimulation(sim, bits);
    const pos = sim.player.s;
    
    // Check when we approach the pipe area (cols 55-62)
    const px = FP.toNumber(pos.x);
    const py = FP.toNumber(pos.y);
    
    if (i >= 400 && i <= 520) {
        const col = Math.floor((px + 5) / 16);
        const row = Math.floor((py + 7) / 16);
        console.log(`Step ${i}: x=${px.toFixed(1)}, y=${py.toFixed(1)}, col=${col}, row=${row}, bits=${bits.toString(2).padStart(5,'0')}, result=${sim.result}`);
    }
    
    if (sim.result !== 'playing') {
        console.log(`\nGame ended at step ${i}: result=${sim.result}`);
        console.log(`Final position: x=${FP.toNumber(pos.x).toFixed(1)}, y=${FP.toNumber(pos.y).toFixed(1)}`);
        break;
    }
}
