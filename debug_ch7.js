import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import fs from 'fs';

const level = JSON.parse(fs.readFileSync('./levels/ch7_01.json', 'utf8'));
const sim = createSimulation(level, 'entry');

// Manual test: run right and see where we get stuck
let steps = 0;
const maxSteps = 1000;
while (sim.result === 'playing' && steps < maxSteps) {
    const p = sim.player.s;
    const col = FP.floorInt(p.x + FP.fromInt(p.w)) >> 4;
    const footRow = FP.floorInt(p.y + FP.fromInt(p.h) - 1) >> 4;
    
    // Check what's ahead
    let bits = BTN.RIGHT;
    
    // Simple jump at gaps
    let hasSupport = false;
    for (let r = footRow + 1; r <= footRow + 3; r++) {
        const id = level.tileAt(col + 1, r);
        if (id !== 0 && id !== 0x2A) { // not empty, not spike
            hasSupport = true;
            break;
        }
    }
    
    if (!hasSupport) {
        bits |= BTN.JUMP | BTN.RUN;
    }
    
    // Check for platforms above
    for (let d = 1; d <= 6; d++) {
        for (let r = footRow - 1; r >= footRow - 4; r--) {
            const id = level.tileAt(col + d, r);
            if (id === 0x2B) { // platform
                bits = BTN.RIGHT | BTN.JUMP | BTN.RUN;
            }
        }
    }
    
    stepSimulation(sim, bits);
    steps++;
    
    if (steps % 100 === 0) {
        console.log('Step', steps, 'x=', FP.toInt(p.x), 'y=', FP.toInt(p.y), 'result=', sim.result);
    }
}

console.log('Final: steps=', steps, 'result=', sim.result, 'laddoos=', sim.player.s.laddoos);
console.log('Player pos:', FP.toInt(sim.player.s.x), FP.toInt(sim.player.s.y));
