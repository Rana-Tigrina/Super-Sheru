import { autopilotLevel } from './tests/autopilot.mjs';
import fs from 'fs';

const level = JSON.parse(fs.readFileSync('./levels/ch7_01.json', 'utf8'));

// Test different styles
for (let style = 0; style < 4; style++) {
    const result = autopilotLevel(level, { maxSteps: 2000, style });
    console.log('Style', style, ': result=', result.result, 'steps=', result.steps, 'laddoos=', result.laddoos);
}
