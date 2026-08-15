import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP } from './src/core/constants.js';
import fs from 'fs';

const level = JSON.parse(fs.readFileSync('./levels/ch7_01.json', 'utf8'));
const proof = JSON.parse(fs.readFileSync('./proofs/ch7_01.proof.json', 'utf8'));

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
const lastInput = proof.inputs[proof.inputs.length - 1];
for (let t = lastInput.t; t < proof.steps; t++) {
    inputs.push(lastInput.b);
}

// Replay with detailed tracing
let diedAt = -1;
for (let t = 0; t < proof.steps && sim.result === 'playing'; t++) {
    const bits = inputs[t] || 0;
    stepSimulation(sim, bits);
    
    if (sim.result !== 'playing') {
        diedAt = t;
        break;
    }
}

console.log('Died at step:', diedAt);
console.log('Player state:', JSON.stringify({
    x: FP.toInt(sim.player.s.x),
    y: FP.toInt(sim.player.s.y),
    vx: FP.toInt(sim.player.s.vx),
    vy: FP.toInt(sim.player.s.vy),
    result: sim.result
}));

// Check where player is relative to level
const col = FP.floorInt(sim.player.s.x + FP.fromInt(8)) >> 4;
const row = FP.floorInt(sim.player.s.y + FP.fromInt(8)) >> 4;
console.log('Tile position: col=', col, 'row=', row);

// Show nearby tiles
console.log('Nearby tiles:');
for (let r = row - 2; r <= row + 2; r++) {
    let line = '';
    for (let c = col - 2; c <= col + 2; c++) {
        if (r >= 0 && r < level.size.h && c >= 0 && c < level.size.w) {
            const ch = level.tiles.rows[r][c];
            line += ch === '.' ? ' ' : ch;
        } else {
            line += '?';
        }
    }
    console.log('  Row', r, ':', line);
}
