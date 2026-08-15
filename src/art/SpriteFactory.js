/* src/art/SpriteFactory.js — runtime pixel art, palette-locked.
 * ─────────────────────────────────────────────────────────────────────────
 * GRD rule #5 (spec §1): every drawn pixel resolves through PALETTE.
 * validate-palette.mjs enforces:
 *   · PALETTE entries are lowercase '#rrggbb', globally unique
 *   · BANK_* arrays hold ≤ 32 palette keys each
 *   · NO raw hex literals exist outside the PALETTE block
 *
 * Sprites are authored as char grids ('.' = transparent) and baked once at
 * boot into offscreen canvases at 1px-per-texel; the 512×288 canvas draws
 * them 1:1 with imageSmoothing disabled (see index.html).
 */

import { TILE_ID } from '../core/constants.js';

/* ══ THE LOCKED PALETTE — 26 colors, land-of-Bharat inspired ══════════════ */
export const PALETTE = {
    ink: '#1a0f2e',           // deep indigo night
    aubergine: '#4a1a5c',     // baingan purple
    plum: '#6b2d8f',          // jamun plum
    indigo: '#2d4a8f',        // neel kanth blue
    deepwater: '#1a3a6f',     // Ganga deep
    water: '#4a8fd9',         // Yamuna blue
    peacock: '#007a8f',       // mayur green-blue
    teal: '#2fb58f',          // temple bronze
    deepgreen: '#1a5c2e',     // paddy field dark
    leaf: '#6fb54a',          // tulsi green
    olive: '#9fad3b',         // mustard greens
    earth: '#8f4a2a',         // mitti brown
    brick: '#b56a3c',         // terracotta
    sandstone: '#e0c088',     // Jaisalmer stone
    cream: '#f5e6c8',         // malai cream
    white: '#faf6ef',         // ivory white
    ash: '#c8c4d8',           // bhasm ash
    slate: '#8f84a8',         // monsoon cloud
    cloud: '#e4ecf5',         // himalayan mist
    marigold: '#ffb632',      // genda phool
    flame: '#ffd94a',         // diya flame
    saffron: '#ff8c28',       // bhagwa orange
    sindoor: '#d9383c',       // vermilion red
    crimson: '#a82836',       // kumkum deep
    rose: '#e85a7a',          // gulab pink
    lotus: '#f08aa0',         // kamal pink
};

/* ══ BANKS — per-sprite-group key lists, ≤ 32 each (validator rule 3) ═════ */
export const BANK_PLAYER = ['ink', 'cream', 'marigold', 'saffron', 'sindoor', 'crimson', 'white'];
export const BANK_ENEMY = ['ink', 'aubergine', 'plum', 'slate', 'ash', 'rose', 'white', 'flame'];
export const BANK_TILES = ['ink', 'earth', 'brick', 'sandstone', 'cream', 'marigold', 'flame', 'leaf', 'deepgreen', 'slate', 'ash', 'water', 'deepwater', 'peacock', 'teal', 'crimson'];
export const BANK_DECOR = ['ink', 'marigold', 'flame', 'sindoor', 'leaf', 'deepgreen', 'sandstone', 'earth', 'rose', 'lotus', 'cream', 'white', 'saffron', 'slate'];
export const BANK_UI = ['ink', 'white', 'marigold', 'flame', 'sindoor', 'cream', 'slate', 'plum'];

/* ══ grid char → palette key ══════════════════════════════════════════════ */
const CHAR_MAP = {
    k: 'ink', u: 'aubergine', p: 'plum', i: 'indigo', d: 'deepwater', w: 'water',
    q: 'peacock', t: 'teal', G: 'deepgreen', g: 'leaf', o: 'olive', e: 'earth',
    b: 'brick', s: 'sandstone', c: 'cream', W: 'white', a: 'ash', l: 'slate',
    C: 'cloud', m: 'marigold', f: 'flame', S: 'saffron', r: 'sindoor',
    R: 'crimson', h: 'rose', L: 'lotus',
};

const DOT16 = '................';

/* ── baking ─────────────────────────────────────────────────────────────── */
function bake(rows) {
    const h = rows.length;
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === '.' || ch === ' ') continue;
            const key = CHAR_MAP[ch];
            if (!key) throw new Error(`SpriteFactory: unknown pixel char '${ch}'`);
            g.fillStyle = PALETTE[key];
            g.fillRect(x, y, 1, 1);
        }
    }
    return cv;
}

/* ══ SHERU — the golden lion of Bharat with regal mane ═══════════════════════ */
const SHERU_BODY = [
    DOT16,
    '.....mmmmmm.....',
    '....mSSSSSSm....',
    '...mSccccccSSm...',
    '...mScckkccSm...',
    '...mSccrrccSm...',
    '....mSSSSSSm....',
    '....SSSSSSSS....',
    '...SSSccccSSS...',
    '...SSSccccSSS...',
    '....SSSSSSSS....',
];
const SHERU_LEGS = {
    idle: ['....SS....SS....', '....cc....cc....'],
    run0: ['...SS......SS...', '...cc......cc...'],
    run1: ['.....SS..SS.....', '.....cc..cc.....'],
    jump: ['....SSSSSSSS....', DOT16],
};

/* ══ enemies ══════════════════════════════════════════════════════════════ */
const WALKER_BODY = [
    DOT16,
    '.....pppppp.....',
    '....pppppppp....',
    '....pWkppkWp....',
    '....pppppppp....',
    '...pppppppppp...',
    '...pphhhhhhpp...',
    '...pphhhhhhpp...',
    '....pppppppp....',
];
const WALKER_FEET = [
    ['...uu..uu..uu...', DOT16],
    ['..uu..uu..uu....', DOT16],
];

const FLOATER = [
    [
        DOT16,
        '......tttt......',
        '.....tttttt.....',
        '....ttWttWtt....',
        '....tttttttt....',
        '..a.tttttttt.a..',
        '.aa.tttttttt.aa.',
        '..a.tttttttt.a..',
        '....tttttttt....',
        '.....t.tt.t.....',
        DOT16,
    ],
    [
        DOT16,
        '......tttt......',
        '.....tttttt.....',
        '....ttWttWtt....',
        '....tttttttt....',
        '.aa.tttttttt.aa.',
        '..a.tttttttt.a..',
        '....tttttttt....',
        '....tttttttt....',
        '....t.tt.t......',
        DOT16,
    ],
];

/* ══ tiles — Indian architectural textures ═══════════════════════════════════ */
const TILE_GROUND = [
    'gggggggggggggggg',
    'GggGgggGgGgggGgG',
    'eeeeeeeeeeeeeeee',
    'eeueeeeeueeeeeue',
    'eeeeeeeeeeeeeeee',
    'eeeeueeeeeueeeee',
    'ebeeeeeebeeeeeee',
    'eeeeeeeeeeeeeeee',
    'eeeeueeeeeeeueee',
    'eeeeeebeeeeeeeee',
    'eeeeeeeeeeeeeeee',
    'eeueeeeeueeeeeue',
    'eeeeeeeeeeeeeeee',
    'eeeebeeeeeeebeee',
    'eeeeeeeeeeeeeeee',
    'eeeeeeeeeeeeeeee',
];

const TILE_BRICK = [
    'bbbbbbbbbbbbbbbb',
    'bkbbbkbbbbbkbbbk',
    'bbbbbbbbbbbbbbbb',
    'kkkkkkkkkkkkkkkk',
    'bbbkbbbbbkbbbbbk',
    'bbbbbbbbbbbbbbbb',
    'bbbbbbbbbbbbbbbb',
    'kkkkkkkkkkkkkkkk',
    'bbbbbkbbbbbkbbbb',
    'bbbbbbbbbbbbbbbb',
    'bkbbbkbbbbbkbbbk',
    'kkkkkkkkkkkkkkkk',
    'bbbbbbbbbbbbbbbb',
    'bbbkbbbbbkbbbbbk',
    'bbbbbbbbbbbbbbbb',
    'kkkkkkkkkkkkkkkk',
];

const TILE_QUESTION = [
    'kkkkkkkkkkkkkkkk',
    'kmmmmmmmmmmmmmmk',
    'kmffffffffffffmk',
    'kmffffffffffmmmk',
    'kmfffffffmmmmmmk',
    'kmfffffmmmmmmmmk',
    'kmfffffmmmmmmmmk',
    'kmfffffmmmmmmmmk',
    'kmffffffmmmmmmmk',
    'kmfffffffffmmmmk',
    'kmfffffmmmmmmmmk',
    'kmfffffmmmmmmmmk',
    'kmfffffmmmmmmmmk',
    'kmmmmmmmmmmmmmmk',
    'kmmmmmmmmmmmmmmk',
    'kkkkkkkkkkkkkkkk',
];

const TILE_SPENT = [
    'kkkkkkkkkkkkkkkk',
    'kllllllllllllllk',
    'kllllllllllllllk',
    'klalllllllllal lk'.replace(' ', 'l'),
    'kllllllllllllllk',
    'kllllllllllllllk',
    'kllllllllllllllk',
    'kllllllllllllllk',
    'kllllllllllllllk',
    'kllllllllllllllk',
    'kllllllllllllllk',
    'klalllllllllal lk'.replace(' ', 'l'),
    'kllllllllllllllk',
    'kllllllllllllllk',
    'kkkkkkkkkkkkkkkk',
];

const TILE_PLATFORM = [
    'cccccccccccccccc',
    'ssssssssssssssss',
    'sksksksksksksksk',
    DOT16.slice(0, 4) + 's' + DOT16.slice(0, 4) + 's' + DOT16.slice(0, 4) + 's',
];

const TILE_SPIKE = [
    DOT16,
    DOT16,
    DOT16,
    DOT16,
    DOT16,
    DOT16,
    '...R.......R....',
    '...R.......R....',
    '..rRr.....rRr...',
    '..rRr.....rRr...',
    '..rRr.....rRr...',
    '.rrRrr...rrRrr..',
    '.rrRrr...rrRrr..',
    '.rrRrr...rrRrr..',
    'rrrRrrr.rrrRrrr.',
    'RRRRRRRRRRRRRRRR',
];

const TILE_WATER = [
    [
        'wwwwwwwwwwwwwwww',
        'CwwwwwwCwwwwwwCw',
        'wwwwwwwwwwwwwwww',
        'wwdwwwwwwwwdwwww',
        'wwwwwwwwwwwwwwww',
        'wwwwwdwwwwwwwwwd',
        'wwwwwwwwwwwwwwww',
        'wdwwwwwwwwdwwwww',
        'wwwwwwwwwwwwwwww',
        'wwwwwwdwwwwwwwww',
        'wwwwwwwwwwwwdwww',
        'wwdwwwwwwwwwwwww',
        'wwwwwwwwwwwwwwww',
        'wwwwwdwwwwwwwwd w'.replace(' ', 'w'),
        'wwwwwwwwwwwwwwww',
        'wwwwwwwwdwwwwwww',
    ],
    [
        'wwwwwwwwwwwwwwww',
        'wwCwwwwwwCwwwwww',
        'wwwwwwwwwwwwwwww',
        'dwwwwdwwwwwwdwww',
        'wwwwwwwwwwwwwwww',
        'wwdwwwwwwdwwwwww',
        'wwwwwwwwwwwwwwww',
        'wwwwdwwwwwwwwdww',
        'wwwwwwwwwwwwwwww',
        'wdwwwwwwwwwwwwww',
        'wwwwwwdwwwwwwwww',
        'wwwwwwwwwwdwwwww',
        'wwwwwwwwwwwwwwww',
        'dwwwwwwdwwwwwwdw',
        'wwwwwwwwwwwwwwww',
        'wwwwdwwwwwwwwwww',
    ],
];

/* ══ pickups & objects ════════════════════════════════════════════════════ */
const LADDOO = [
    '..mmmm..',
    '.mffffm.',
    'mffkff fm'.replace(' ', 'f'),
    'mffffffm',
    'mffkfffm',
    'mffffkfm',
    '.mffffm.',
    '..mmmm..',
];

const CHAKRA_FRAMES = [
    [
        '..aaaa..',
        '.aWWWWa.',
        'aWmmmmWa',
        'aWmffmWa',
        'aWmffmWa',
        'aWmmmmWa',
        '.aWWWWa.',
        '..aaaa..',
    ],
    [
        '..aWWa..',
        '.aWffWa.',
        'aWfmmfWa',
        'aWfm mfWa'.replace(' ', 'f'),
        'aWfm mfWa'.replace(' ', 'f'),
        'aWfmmfWa',
        '.aWffWa.',
        '..aWWa..',
    ],
];

const FLAG = [
    'lSSSSSSSS.......',
    'lSSSSSSS........',
    'lSSSSSS.........',
    'lWWWWW..........',
    'lWWWW...........',
    'lWWW............',
    'lgggg...........',
    'lggg............',
    'lgg.............',
    'l...............',
    'l...............',
    'l...............',
    'l...............',
    'l...............',
    'l...............',
    'lll.............',
];

const CHECKPOINT_OFF = [
    DOT16,
    DOT16,
    DOT16,
    DOT16,
    '.......k........',
    '.......k........',
    '......sss.......',
    '.....sssss......',
    '....sssssss.....',
    '....ebbbbe......',
    '...eebbbbbe e...'.replace(' ', 'e'),
    '...eeeeeeee.....',
    DOT16,
    DOT16,
];
const CHECKPOINT_ON = [
    DOT16,
    '.......f........',
    '......fmf.......',
    '.......f........',
    '.......k........',
    '.......k........',
    '......sss.......',
    '.....sssss......',
    '....sssssss.....',
    '....ebbbbe......',
    '...eebbbbbe e...'.replace(' ', 'e'),
    '...eeeeeeee.....',
    DOT16,
    DOT16,
];

const PIPE_TOP = [
    'kkkkkkkkkkkkkkkk',
    'kttqqqqqqqqqqqtk',
    'ktqqqqqqqqqqqqqk',
    'kqqqqqqqqqqqqqqk',
    'kqqqqqqqqqqqqqqk',
    'kkkkkkkkkkkkkkkk',
];
const PIPE_BODY = [
    '.kkqqqqqqqqqqkk.',
    '.kkqqqqqqqqqqkk.',
    '.kkqqqqqqqqqqkk.',
    '.kkqqqqqqqqqqkk.',
];

const SPARKLE = [
    '...f....',
    '...f....',
    '..fff...',
    '.fffff..',
    '..fff...',
    '...f....',
    '...f....',
];
const PUFF = [
    '..a..a..',
    '.a....a.',
    'a..aa..a',
    '.a....a.',
    '..a..a..',
];

/* ══ decor — one sprite per DECOR_VARIANTS entry ══════════════════════════ */
const DECOR = {
    marigold: [
        DOT16,
        '......mm........',
        '.....mffm.......',
        '......mm........',
        '.......G........',
        '.......G........',
        '......gGg.......',
    ],
    diya: [
        DOT16,
        '.......f........',
        '......fm........',
        '.......f........',
        '......kkk.......',
        '.....ebbbe......',
        '......eee.......',
    ],
    cactus: [
        DOT16,
        '......gg........',
        '..g...gg........',
        '..g..ggg........',
        '..ggggg.........',
        '...gggG.........',
        '...gggG.........',
        '...eeee.........',
    ],
    palm: [
        '...gg.g.........',
        '..gggggg........',
        '...gggg.gg......',
        '.....ee.........',
        '.....ee.........',
        '.....ee.........',
        '.....ee.........',
        '....eee.........',
    ],
    banner: [
        '...l............',
        '...lrrrr........',
        '...lrrr.........',
        '...lrr..........',
        '...l............',
        '...l............',
        '...l............',
        '...l............',
    ],
    arch: [
        '....sssss.......',
        '...ss...ss......',
        '..ss.....ss.....',
        '..ss.....ss.....',
        '..ss.....ss.....',
        '..ss.....ss.....',
        '..ss.....ss.....',
    ],
    tea: [
        DOT16,
        '....gogog.......',
        '...ogggggo......',
        '..ggogggogg.....',
        '...eeeeeee......',
        '....ee.ee.......',
    ],
    snow: [
        DOT16,
        DOT16,
        '.....WWW........',
        '....WWWaW.......',
        '..WWWWWWWWWW....',
        '.WWWaWWWWaWWW...',
    ],
    lamp: [
        '.......f........',
        '......mfm.......',
        '......kkk.......',
        '.......l........',
        '.......l........',
        '.......l........',
        '.......l........',
        '......lll.......',
    ],
    bunting: [
        'kmmkhhkggkWkmmk.',
        '.mm..hh.gg..W...',
        '..m...h..g......',
        DOT16,
        DOT16,
    ],
};

/* ══ sprite registry ══════════════════════════════════════════════════════ */
const SPRITES = {
    'sheru.idle': [...SHERU_BODY, ...SHERU_LEGS.idle, DOT16, DOT16],
    'sheru.run0': [...SHERU_BODY, ...SHERU_LEGS.run0, DOT16, DOT16],
    'sheru.run1': [...SHERU_BODY, ...SHERU_LEGS.run1, DOT16, DOT16],
    'sheru.jump': [...SHERU_BODY, ...SHERU_LEGS.jump, DOT16, DOT16],

    'walker.0': [...WALKER_BODY, ...WALKER_FEET[0]],
    'walker.1': [...WALKER_BODY, ...WALKER_FEET[1]],
    'floater.0': FLOATER[0],
    'floater.1': FLOATER[1],

    'laddoo': LADDOO,
    'chakra.0': CHAKRA_FRAMES[0],
    'chakra.1': CHAKRA_FRAMES[1],
    'sparkle': SPARKLE,
    'puff': PUFF,

    'tile.ground': TILE_GROUND,
    'tile.brick': TILE_BRICK,
    'tile.question': TILE_QUESTION,
    'tile.spent': TILE_SPENT,
    'tile.platform': TILE_PLATFORM,
    'tile.spike': TILE_SPIKE,
    'tile.water.0': TILE_WATER[0],
    'tile.water.1': TILE_WATER[1],

    'flag': FLAG,
    'checkpoint.off': CHECKPOINT_OFF,
    'checkpoint.on': CHECKPOINT_ON,
    'pipe.top': PIPE_TOP,
    'pipe.body': PIPE_BODY,

    'decor.marigold': DECOR.marigold,
    'decor.diya': DECOR.diya,
    'decor.cactus': DECOR.cactus,
    'decor.palm': DECOR.palm,
    'decor.banner': DECOR.banner,
    'decor.arch': DECOR.arch,
    'decor.tea': DECOR.tea,
    'decor.snow': DECOR.snow,
    'decor.lamp': DECOR.lamp,
    'decor.bunting': DECOR.bunting,
};

/** TILE_ID → sprite name, for the renderer. */
export function tileSpriteName(tileId) {
    switch (tileId) {
        case TILE_ID.GROUND: return 'tile.ground';
        case TILE_ID.BRICK: return 'tile.brick';
        case TILE_ID.LADDOO_BLOCK: return 'tile.question';
        case TILE_ID.PLATFORM: return 'tile.platform';
        case TILE_ID.SPIKE: return 'tile.spike';
        case TILE_ID.WATER: return 'tile.water.0';
        case TILE_ID.SPENT: return 'tile.spent';
        default: return null;
    }
}

/* ══ the factory ══════════════════════════════════════════════════════════ */
export class SpriteFactory {
    constructor() {
        this.cache = new Map();
        for (const [name, rows] of Object.entries(SPRITES)) {
            this.cache.set(name, bake(rows));
        }
    }

    get(name) {
        return this.cache.get(name) ?? null;
    }

    /** Draw at integer screen coords. flip mirrors horizontally (facing). */
    draw(ctx, name, x, y, flip = false) {
        const cv = this.get(name);
        if (!cv) return;
        x |= 0; y |= 0;
        if (flip) {
            ctx.save();
            ctx.translate(x + cv.width, y);
            ctx.scale(-1, 1);
            ctx.drawImage(cv, 0, 0);
            ctx.restore();
        } else {
            ctx.drawImage(cv, x, y);
        }
    }

    /** Water tiles alternate frames with the global step clock. */
    drawWater(ctx, x, y, step) {
        this.draw(ctx, ((step >> 4) & 1) ? 'tile.water.1' : 'tile.water.0', x, y);
    }
}