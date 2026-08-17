/* src/core/constants.js — GRD v2 source of truth for all simulation constants.
 * ─────────────────────────────────────────────────────────────────────────────
 * Spec: docs/GRD_V2_SPEC.md §1–§4.
 * Rule #2 of GRD: gameplay math is integer-only Q16.16 fixed point. Nothing
 * in the sim may touch Math.random, floats-as-state, or wall-clock time.
 */

export const ENGINE_VERSION = '2.0.0';

/* ── screen & tiles ─────────────────────────────────────────────────────── */
export const TILE = 16;                       // px per tile (spec §4)
export const VIEW = { W: 512, H: 288 };       // 32 × 18 tiles — matches index.html canvas

/* ── FP: Q16.16 fixed point ─────────────────────────────────────────────── */
const FP_SHIFT = 16;
const FP_ONE = 1 << FP_SHIFT;               // 65536

/* Sine quarter-table: round(sin(k·π/128) · 65536) for k = 0..64.
 * Hardcoded integers → identical on every JS engine, forever. The full
 * 256-entry LUT below is derived by pure-integer mirror symmetry.
 * Used by FloaterEnemy hover & decor sway (spec §5). */
const SIN_QUARTER = [
    0, 1608, 3216, 4821, 6424, 8022, 9616, 11204, 12585, 14359,
    15924, 17479, 19024, 20557, 22078, 23586, 25080, 26558, 28020, 29466,
    30893, 32303, 33692, 35062, 36410, 37736, 39040, 40320, 41576, 42807,
    44012, 45190, 46341, 47464, 48559, 49625, 50660, 51665, 52639, 53582,
    54492, 55369, 56212, 57022, 57798, 58539, 59244, 59914, 60548, 61145,
    61705, 62229, 62714, 63162, 63572, 63944, 64277, 64572, 64827, 65043,
    65221, 65359, 65457, 65517, 65536,
];

const SIN_LUT = (() => {
    const lut = new Array(256);
    for (let i = 0; i < 256; i++) {
        const q = i & 63, mirror = i & 64, neg = i & 128;
        const v = mirror ? SIN_QUARTER[64 - q] : SIN_QUARTER[q];
        lut[i] = neg ? -v : v;
    }
    return lut;
})();

export const FP = {
    SHIFT: FP_SHIFT,
    ONE: FP_ONE,
    HALF: FP_ONE >> 1,

    fromInt: (n) => (n << FP_SHIFT),
    fromNumber: (n) => Math.round(n * FP_ONE),   // load-time only (PHYS conversion)
    toNumber: (f) => f / FP_ONE,               // render-time only — never sim state
    toInt: (f) => Math.trunc(f / FP_ONE),
    floorInt: (f) => Math.floor(f / FP_ONE),

    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mul: (a, b) => Math.trunc((a * b) / FP_ONE), // exact: |a·b| < 2^53 in our ranges
    div: (a, b) => Math.trunc((a * FP_ONE) / b),

    clamp: (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v),
    abs: (v) => (v < 0 ? -v : v),
    sign: (v) => (v > 0 ? 1 : v < 0 ? -1 : 0),

    /** phase: integer 0..255 (wraps). Returns FP in [-ONE, +ONE]. */
    sin: (phase) => SIN_LUT[phase & 255],
};

/* ── PHYS: px/step at 60 Hz (spec §3) ───────────────────────────────────── */
export const PHYS = {
    HZ: 60,

    GRAVITY: 0.34,
    MAX_FALL: 6.0,

    WALK_ACC: 0.18,
    RUN_ACC: 0.26,
    AIR_ACC: 0.12,
    FRICTION: 0.30,

    MAX_WALK: 1.9,
    MAX_RUN: 3.1,

    JUMP_V: -6.0,
    JUMP_CUT: 0.45,              // vy multiplier on early jump release (hold = higher)

    COYOTE_STEPS: 6,
    JUMP_BUFFER_STEPS: 6,
    STOMP_BOUNCE: -3.4,

    PLAYER_W: 10, PLAYER_H: 14,
    ENEMY_W: 12, ENEMY_H: 12,
    FLOATER_W: 14, FLOATER_H: 10,

    INVULN_STEPS: 60,
    HURT_KNOCK_X: 2.4,
    HURT_POP_Y: -3.0,

    CHAKRA_SPEED: 4.2,         // spec §6: 6-tile life ⇒ ~23 steps
    CHAKRA_LIFE: 23,
    CHAKRA_COOLDOWN: 20,
    CHAKRA_MAX: 2,

    RESPAWN_STEPS: 45,          // water/hazard → checkpoint respawn delay
    WIN_LOCK_STEPS: 90,          // flag slide → next chapter
};

/** Pre-converted fixed-point mirror of the continuous PHYS values.
 *  Integer steps/counts stay plain numbers. */
export const PHYS_FP = {
    GRAVITY: FP.fromNumber(PHYS.GRAVITY),
    MAX_FALL: FP.fromNumber(PHYS.MAX_FALL),
    WALK_ACC: FP.fromNumber(PHYS.WALK_ACC),
    RUN_ACC: FP.fromNumber(PHYS.RUN_ACC),
    AIR_ACC: FP.fromNumber(PHYS.AIR_ACC),
    FRICTION: FP.fromNumber(PHYS.FRICTION),
    MAX_WALK: FP.fromNumber(PHYS.MAX_WALK),
    MAX_RUN: FP.fromNumber(PHYS.MAX_RUN),
    JUMP_V: FP.fromNumber(PHYS.JUMP_V),
    JUMP_CUT: FP.fromNumber(PHYS.JUMP_CUT),
    STOMP_BOUNCE: FP.fromNumber(PHYS.STOMP_BOUNCE),
    HURT_KNOCK_X: FP.fromNumber(PHYS.HURT_KNOCK_X),
    HURT_POP_Y: FP.fromNumber(PHYS.HURT_POP_Y),
    CHAKRA_SPEED: FP.fromNumber(PHYS.CHAKRA_SPEED),
};

/* ── input bits (spec §1.3) — one byte per simulation step ──────────────── */
export const BTN = { LEFT: 1, RIGHT: 2, JUMP: 4, RUN: 8, THROW: 16, DOWN: 32 };
export const INPUT = BTN;   // alias used by solver/verifier code

/* ── player states & forms (spec §3) ────────────────────────────────────── */
export const P_STATE = {
    IDLE: 0, RUN: 1, SKID: 2, JUMP: 3, FALL: 4,
    STOMP: 5, HURT: 6, DEAD: 7, WIN: 8, TRANSFORMING: 9,
};

export const PLAYER_FORM = {
    SMALL: 0,
    SUPER: 1,
    INVINCIBLE: 2,
    FIRE: 3,
    GLIDE: 4,
    MAGNET: 5,
};

export const FORM_DIMS = {
    [PLAYER_FORM.SMALL]: { w: 10, h: 14, wFP: FP.fromInt(10), hFP: FP.fromInt(14) },
    [PLAYER_FORM.SUPER]: { w: 14, h: 22, wFP: FP.fromInt(14), hFP: FP.fromInt(22) },
    [PLAYER_FORM.INVINCIBLE]: { w: 10, h: 14, wFP: FP.fromInt(10), hFP: FP.fromInt(14) },
    [PLAYER_FORM.FIRE]: { w: 14, h: 22, wFP: FP.fromInt(14), hFP: FP.fromInt(22) },
    [PLAYER_FORM.GLIDE]: { w: 12, h: 18, wFP: FP.fromInt(12), hFP: FP.fromInt(18) },
    [PLAYER_FORM.MAGNET]: { w: 10, h: 14, wFP: FP.fromInt(10), hFP: FP.fromInt(14) },
};


/* ── tiles (spec §4) ────────────────────────────────────────────────────── */
export const TILE_ID = {
    AIR: 0,
    GROUND: 1,
    BRICK: 2,
    LADDOO_BLOCK: 3,
    PLATFORM: 4,   // one-way
    SPIKE: 5,
    WATER: 6,
    SPENT: 7,   // a bonked '?' block — solid, no more laddoo
};

export const TILE_CHAR = ['.', '#', '=', '?', '-', '^', '~', 'x'];
export const CHAR_TO_TILE = { '.': 0, '#': 1, '=': 2, '?': 3, '-': 4, '^': 5, '~': 6 };

export const isSolid = (id) => id === 1 || id === 2 || id === 3 || id === 7;
export const isOneWay = (id) => id === 4;
export const isHazard = (id) => id === 5;
export const isWater = (id) => id === 6;

/* ── decor variants (spec §5) — seeded per tile, gameplay-irrelevant ────── */
export const DECOR_VARIANTS = [
    'marigold', 'diya', 'cactus', 'palm', 'banner',
    'arch', 'tea', 'snow', 'lamp', 'bunting',
];