import { autopilotLevel } from './tests/autopilot.mjs';
import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

console.log("Testing autopilot on ch2_01 with different styles...");
for (let style = 0; style < 4; style++) {
    console.log(`\n--- Style ${style} ---`);
    const result = autopilotLevel(level, { style, maxSteps: 2000 });
    console.log(`Result: ${result.result}, Steps: ${result.steps}, Laddoos: ${result.laddoos}`);
    if (result.result === 'flag') {
        console.log("SUCCESS! Proof inputs:", JSON.stringify(result.inputs, null, 2));
        break;
    }
}
