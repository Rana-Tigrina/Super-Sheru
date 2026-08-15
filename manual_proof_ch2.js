import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN } from './src/core/constants.js';
import { readFileSync, writeFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

// Level analysis:
// - Start: x=48 (col 3), y=192 (row 12)  
// - Gap 1: cols 18-20 (x=288-320) - need jump around x=270
// - Gap 2: cols 39-42 (x=624-672) - need jump around x=600
// - Pipe: tx=58, x=928-960 - need jump around x=900 to clear it
// - Gap 3: cols 63-66 (x=1008-1056) - need jump around x=980
// - Flag: tx=76, x=1216

// Estimated timing at ~1.9 px/step (walking speed):
// - x=270 at step ~120
// - x=600 at step ~290  
// - x=900 at step ~450
// - x=980 at step ~500
// - x=1216 at step ~620

const inputs = [
    { t: 0, b: BTN.RIGHT },              // Run right from start
    { t: 115, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump gap 1 (cols 18-20)
    { t: 135, b: BTN.RIGHT },
    { t: 280, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump gap 2 (cols 39-42)
    { t: 300, b: BTN.RIGHT },
    { t: 440, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump over pipe (tx=58)
    { t: 470, b: BTN.RIGHT },
    { t: 490, b: BTN.RIGHT | BTN.JUMP | BTN.RUN },  // Jump gap 3 (cols 63-66)
    { t: 510, b: BTN.RIGHT },
];

console.log("Testing manually crafted proof for ch2_01...");
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
    const px = FP.toNumber(sim.player.s.x);
    const py = FP.toNumber(sim.player.s.y);
    const col = Math.floor(px / 16);
    
    if (i % 100 === 0 || sim.result !== 'playing') {
        console.log(`Step ${i}: x=${px.toFixed(1)} (${col}), y=${py.toFixed(1)}, result=${sim.result}`);
    }
}

console.log(`\nFinal: result=${sim.result}, steps=${sim.step}`);
if (sim.result === 'flag') {
    console.log("SUCCESS!");
    
    // Calculate hash
    import { hashInputVector } from './src/core/util.js';
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
    console.log("Proof saved to proofs/ch2_01.proof.json");
    console.log(JSON.stringify(proof, null, 2));
}
