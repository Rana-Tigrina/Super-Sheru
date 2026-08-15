import { createSimulation, stepSimulation } from './src/verification/FixedStepVerifier.js';
import { FP, BTN, isSolid, isOneWay } from './src/core/constants.js';
import { readFileSync } from 'node:fs';

const levelJson = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

function toFloat(f) { return f / 65536; }

// The key insight: pipe at col 58-59 on solid ground (row 13 has #)
// Player must jump and NOT land on the pipe top surface
// Pipe top is at y = 11*16 = 176px
// Player height is 14px, so player bottom when standing on pipe would be ~176px
// To avoid warp, player must stay airborne until past col 59+

const sim = createSimulation(levelJson, 'entry');

let t = 0;
const maxSteps = 1500;
let jumpedForPipe = false;

for (; t < maxSteps && sim.result === 'playing'; t++) {
    const p = sim.player.s;
    const footRow = FP.floorInt(p.y + FP.fromInt(p.h) - 1) >> 4;
    const colFront = FP.floorInt(p.x + FP.fromInt(p.w)) >> 4;
    
    // Check for support ahead
    const support = (c) => {
        for (let r = footRow + 1; r <= footRow + 3; r++) {
            const id = sim.level.tileAt(c, r);
            if (isSolid(id) || isOneWay(id)) return true;
        }
        return false;
    };
    
    let bits = BTN.RIGHT;
    
    // Gap detection - must jump!
    if (!support(colFront + 1)) {
        bits = BTN.RIGHT | BTN.JUMP | BTN.RUN;
    }
    
    // PIPE SKIP LOGIC
    // Pipe is at tx=58, we need to clear cols 58-59
    // Start jump at col 52-53 (5-6 tiles before pipe)
    // Hold jump long enough to clear pipe + have safe landing
    const pipeAhead = !jumpedForPipe && colFront >= 51 && colFront <= 56;
    if (pipeAhead) {
        jumpedForPipe = true;
        console.log(`t=${t}: PIPE SKIP START at col=${colFront}`);
        // Hold jump for 35 frames to ensure we clear the pipe entirely
        for (let i = 0; i < 35 && sim.result === 'playing'; i++) {
            bits = BTN.RIGHT | BTN.JUMP | BTN.RUN;
            stepSimulation(sim, bits);
            t++;
        }
        const p2 = sim.player.s;
        console.log(`       After jump: pos=(${toFloat(p2.x).toFixed(1)},${toFloat(p2.y).toFixed(1)}) col=${FP.floorInt(p2.x + FP.fromInt(p2.w)) >> 4} onGround=${p2.onGround}`);
        continue;
    }
    
    stepSimulation(sim, bits);
}

console.log(`\nFinal: result=${sim.result} steps=${t}`);
if (sim.warpTarget) {
    console.log(`WARP to: ${sim.warpTarget.levelId}`);
} else if (sim.result === 'flag') {
    console.log('SUCCESS - reached flag!');
} else if (sim.result === 'dead') {
    console.log('Player died');
}
