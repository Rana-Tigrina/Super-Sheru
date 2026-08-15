import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));
const proof = JSON.parse(readFileSync('./proofs/ch2_01.proof.json', 'utf8'));

console.log("Tracing around pipe area (steps 440-470):");
const sim = createSimulation(level, 'entry');

for (let i = 0; i < 500 && sim.result === 'playing'; i++) {
    let bits = 0;
    for (let j = proof.inputs.length - 1; j >= 0; j--) {
        if (proof.inputs[j].t <= i) {
            bits = proof.inputs[j].b;
            break;
        }
    }
    
    const prevX = FP.toNumber(sim.player.s.x);
    const prevY = FP.toNumber(sim.player.s.y);
    
    stepSimulation(sim, bits);
    const pos = sim.player.s;
    const px = FP.toNumber(pos.x);
    const py = FP.toNumber(pos.y);
    
    // Check pipe interaction zone
    if (i >= 440 && i <= 470) {
        const col = Math.floor(px / 16);
        const pipeLeft = 58 * 16;
        const pipeRight = 60 * 16;
        const onPipe = (px + 10 > pipeLeft && px < pipeRight && py >= 176 - 14 && py <= 176);
        
        console.log(`Step ${i}: x=${px.toFixed(1)}(${col}), y=${py.toFixed(1)}, vx=${FP.toNumber(pos.vx).toFixed(2)}, vy=${FP.toNumber(pos.vy).toFixed(2)}, bits=${bits.toString(2).padStart(5,'0')} (DOWN=${!!(bits&BTN.DOWN)}), onGround=${sim.player.ground}, onPipe=${onPipe}`);
    }
}
