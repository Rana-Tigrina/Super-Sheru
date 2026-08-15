import fs from 'fs';

// Load level
const level = JSON.parse(fs.readFileSync('./levels/ch7_01.json', 'utf8'));

console.log('Original level ch7_01:');
console.log('  Size:', level.size.w, 'x', level.size.h);

// The problem: platforms are too high and gaps are too wide
// Solution: Lower some platforms and add intermediate platforms

// Row 9 platform at cols 34-37 - lower it to row 10
let row9 = level.tiles.rows[9];
let row10 = level.tiles.rows[10];

// Move platform from row 9 (cols 34-37) to row 10
let newRow9 = row9.substring(0, 34) + '....' + row9.substring(38);
let newRow10 = row10.substring(0, 34) + '----' + row10.substring(38);

level.tiles.rows[9] = newRow9;
level.tiles.rows[10] = newRow10;

// Also move the row 8 platform at cols 45-48 down to row 9
let row8 = level.tiles.rows[8];
row9 = level.tiles.rows[9];

let newRow8 = row8.substring(0, 45) + '....' + row8.substring(49);
let newRow9 = row9.substring(0, 45) + '----' + row9.substring(49);

level.tiles.rows[8] = newRow8;
level.tiles.rows[9] = newRow9;

// Move row 8 platform at cols 91-94 down to row 9
row8 = level.tiles.rows[8];
row9 = level.tiles.rows[9];

newRow8 = row8.substring(0, 91) + '....' + row8.substring(95);
newRow9 = row9.substring(0, 91) + '----' + row9.substring(95);

level.tiles.rows[8] = newRow8;
level.tiles.rows[9] = newRow9;

// Move row 9 platform at cols 78-81 down to row 10
row9 = level.tiles.rows[9];
row10 = level.tiles.rows[10];

newRow9 = row9.substring(0, 78) + '....' + row9.substring(82);
newRow10 = row10.substring(0, 78) + '----' + row10.substring(82);

level.tiles.rows[9] = newRow9;
level.tiles.rows[10] = newRow10;

// Move row 11 platform at cols 81-84 up to row 10
let row11 = level.tiles.rows[11];
row10 = level.tiles.rows[10];

let newRow11 = row11.substring(0, 81) + '....' + row11.substring(85);
let newRow10b = row10.substring(0, 81) + '----' + row10.substring(85);

level.tiles.rows[11] = newRow11;
level.tiles.rows[10] = newRow10b;

console.log('\nModified platforms:');
for (let r = 8; r <= 11; r++) {
    const row = level.tiles.rows[r];
    if (row.includes('-')) {
        const matches = [...row.matchAll(/-+/g)];
        matches.forEach(m => {
            console.log('  Row', r, ': cols', m.index, '-', m.index + m[0].length);
        });
    }
}

// Save modified level
fs.writeFileSync('./levels/ch7_01.json', JSON.stringify(level, null, 4));
console.log('\nLevel saved!');
