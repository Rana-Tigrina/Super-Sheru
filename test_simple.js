import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));
const sim = createSimulation(level, 'entry');

console.log("Testing manual input sequence...");
// Simple: run right, jump over gaps
for (let i = 0; i < 1000 && sim.result === 'playing'; i++) {
    let bits = BTN.RIGHT;
    
    // Jump at specific columns for gaps
    const px = FP.toNumber(sim.player.s.x);
    const col = Math.floor(px / 16);
    
    // Gap at col 18-20
    if (col === 17) bits |= BTN.JUMP | BTN.RUN;
    // Gap at col 39-42  
    if (col === 38) bits |= BTN.JUMP | BTN.RUN;
    // Pipe at col 58-59 - need big jump
    if (col === 56) bits |= BTN.JUMP | BTN.RUN;
    // Gap at col 63-66
    if (col === 62) bits |= BTN.JUMP | BTN.RUN;
    
    stepSimulation(sim, bits);
    
    if (i % 100 === 0 || sim.result !== 'playing') {
        console.log(`Step ${i}: x=${FP.toNumber(sim.player.s.x).toFixed(1)} (${Math.floor(FP.toNumber(sim.player.s.x)/16)}), y=${FP.toNumber(sim.player.s.y).toFixed(1)}, result=${sim.result}`);
    }
}

console.log(`\nFinal: result=${sim.result}, steps=${sim.step}`);
if (sim.result === 'flag') console.log("SUCCESS!");
