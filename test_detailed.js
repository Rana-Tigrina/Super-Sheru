import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

console.log("Detailed trace of ch2_01...");
const sim = createSimulation(level, 'entry');

let bits = BTN.RIGHT;
for (let i = 0; i < 1000 && sim.result === 'playing'; i++) {
    const px = FP.toNumber(sim.player.s.x);
    const py = FP.toNumber(sim.player.s.y);
    const col = Math.floor(px / 16);
    const row = Math.floor(py / 16);
    
    // Check ground at current position and ahead
    let groundHere = false;
    let groundAhead = false;
    for (let r = row + 1; r <= row + 3; r++) {
        if (r >= 0 && r < level.size.h) {
            if (col >= 0 && col < level.size.w && ['#','=','?','x'].includes(level.tiles.rows[r]?.[col] || '.')) groundHere = true;
            if (col + 1 >= 0 && col + 1 < level.size.w && ['#','=','?','x'].includes(level.tiles.rows[r]?.[col+1] || '.')) groundAhead = true;
        }
    }
    
    // Check for pipe
    let onPipe = false;
    for (const pipe of level.entities) {
        if (pipe.type === 'pipe') {
            if (px >= pipe.tx * 16 - 5 && px <= (pipe.tx + pipe.w) * 16 + 5 && py >= pipe.ty * 16 - 10) {
                onPipe = true;
            }
        }
    }
    
    // Jump logic
    if (!groundAhead && groundHere) {
        bits = BTN.RIGHT | BTN.JUMP | BTN.RUN;
    } else if (onPipe && row <= 13) {
        bits = BTN.RIGHT | BTN.JUMP | BTN.RUN;
    } else {
        bits = BTN.RIGHT;
    }
    
    stepSimulation(sim, bits);
    
    if (i % 50 === 0 || !groundAhead && groundHere || onPipe) {
        console.log(`Step ${i}: x=${px.toFixed(1)} (${col}), y=${py.toFixed(1)} (${row}), groundHere=${groundHere}, groundAhead=${groundAhead}, onPipe=${onPipe}, bits=${bits.toString(2).padStart(5,'0')}`);
    }
}

console.log(`\nFinal: result=${sim.result}, steps=${sim.step}`);
