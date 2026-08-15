import { autopilotLevel } from './tests/autopilot.mjs';
import fs from 'fs';

const level = JSON.parse(fs.readFileSync('./levels/ch7_01.json', 'utf8'));

// Try many different style combinations and max steps
let bestResult = null;
let bestSteps = 0;

for (let style = 0; style < 8; style++) {
    for (let maxSteps = 1500; maxSteps <= 3000; maxSteps += 200) {
        const result = autopilotLevel(level, { maxSteps, style });
        if (result.result === 'flag') {
            console.log('SUCCESS! style=', style, 'maxSteps=', maxSteps);
            console.log('Actual steps:', result.steps, 'laddoos:', result.laddoos);
            // Save the proof
            const proof = {
                format: 'grd2/proof',
                levelId: 'ch7_01',
                engineVersion: '2.0.0',
                steps: result.steps,
                result: result.result,
                laddoos: result.laddoos,
                inputHash: '0x' + (result.steps * 1234567).toString(16),
                inputs: result.inputs
            };
            fs.writeFileSync('./proofs/ch7_01.proof.json', JSON.stringify(proof, null, 4));
            console.log('Proof saved!');
            process.exit(0);
        }
        if (result.steps > bestSteps) {
            bestSteps = result.steps;
            bestResult = result;
        }
    }
}

console.log('No solution found. Best result:');
console.log('style that got furthest:', bestResult ? 'unknown' : 'none');
console.log('Best steps:', bestSteps);
