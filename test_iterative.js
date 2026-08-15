import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

// Iteratively build a working proof
console.log("Building proof iteratively...");

const inputs = [];
let currentBits = BTN.RIGHT;
let lastChange = 0;

const sim = createSimulation(level, 'entry');

for (let i = 0; i < 2000 && sim.result === 'playing'; i++) {
    const px = FP.toNumber(sim.player.s.x);
    const py = FP.toNumber(sim.player.s.y);
    const col = Math.floor(px / 16);
    const row = Math.floor(py / 16);
    
    // Determine what we need to do
    let newBits = BTN.RIGHT;
    
    // Check for gaps ahead
    let gapAhead = false;
    for (let c = col + 1; c <= col + 3; c++) {
        let hasSupport = false;
        for (let r = row + 1; r <= row + 3; r++) {
            if (r >= 0 && r < level.size.h && c >= 0 && c < level.size.w) {
                const ch = level.tiles.rows[r]?.[c] || '.';
                if (ch === '#' || ch === '=' || ch === '?' || ch === 'x') hasSupport = true;
            }
        }
        if (!hasSupport) gapAhead = true;
    }
    
    // Check for pipe ahead
    let pipeAhead = false;
    for (const pipe of level.entities) {
        if (pipe.type === 'pipe' && pipe.tx >= col && pipe.tx <= col + 4) {
            pipeAhead = true;
        }
    }
    
    // Jump for gaps or pipes
    if ((gapAhead || pipeAhead) && row <= 13) {
        newBits = BTN.RIGHT | BTN.JUMP | BTN.RUN;
    }
    
    if (newBits !== currentBits) {
        inputs.push({ t: i, b: newBits });
        currentBits = newBits;
        lastChange = i;
    }
    
    stepSimulation(sim, currentBits);
    
    if (i % 200 === 0) {
        console.log(`Step ${i}: x=${px.toFixed(1)} (${col}), y=${py.toFixed(1)} (${row}), gap=${gapAhead}, pipe=${pipeAhead}, bits=${currentBits.toString(2).padStart(5,'0')}`);
    }
}

console.log(`\nFinal: result=${sim.result}, steps=${sim.step}`);
if (sim.result === 'flag') {
    console.log("SUCCESS!");
    console.log("Inputs:", JSON.stringify(inputs, null, 2));
} else {
    console.log("Failed - player died or didn't reach flag");
}
