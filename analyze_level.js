import { readFileSync } from 'fs';

const level = JSON.parse(readFileSync('./levels/ch2_01.json', 'utf8'));

console.log("Level:", level.meta.name);
console.log("Size:", level.size.w, "x", level.size.h, "tiles");
console.log("\nGrid visualization (row 12-15 = ground area):");

const rows = level.tiles.rows;
for (let r = 0; r < rows.length; r++) {
    console.log(`Row ${r.toString().padStart(2)}: ${rows[r]}`);
}

console.log("\nKey entities:");
level.entities.forEach(e => {
    console.log(`  ${e.type}: tx=${e.tx}, ty=${e.ty}${e.w ? `, w=${e.w}` : ''}`);
});

// Find gaps in ground
console.log("\nGround analysis (rows 13-15):");
const groundRows = [13, 14, 15];
for (let c = 0; c < level.size.w; c++) {
    let hasGround = false;
    for (const r of groundRows) {
        if (rows[r] && rows[r][c] === '#') hasGround = true;
    }
    if (!hasGround) {
        console.log(`  Gap at column ${c}`);
    }
}
