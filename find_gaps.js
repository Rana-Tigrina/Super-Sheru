import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));
const rows = level.tiles.rows;

console.log("Finding gaps in ground (rows 13-15):");
let inGap = false;
let gapStart = -1;
for (let c = 0; c < level.size.w; c++) {
    let hasGround = false;
    for (let r = 13; r <= 15; r++) {
        if (rows[r] && rows[r][c] === '#') hasGround = true;
    }
    
    if (!hasGround && !inGap) {
        gapStart = c;
        inGap = true;
    } else if (hasGround && inGap) {
        console.log(`  Gap from col ${gapStart} to ${c-1} (width: ${c - gapStart})`);
        inGap = false;
    }
}
if (inGap) {
    console.log(`  Gap from col ${gapStart} to ${level.size.w - 1}`);
}

console.log("\nPipe position:");
for (const e of level.entities) {
    if (e.type === 'pipe') {
        console.log(`  Pipe at tx=${e.tx}, ty=${e.ty}, w=${e.w}, h=${e.h}`);
        console.log(`  Pixel coords: x=${e.tx * 16}-${(e.tx + e.w) * 16}, y=${e.ty * 16}-${(e.ty + e.h) * 16}`);
    }
}

console.log("\nFlag position:");
for (const e of level.entities) {
    if (e.type === 'flag') {
        console.log(`  Flag at tx=${e.tx}, ty=${e.ty}`);
        console.log(`  Pixel coords: x=${e.tx * 16}, y=${e.ty * 16}`);
    }
}
