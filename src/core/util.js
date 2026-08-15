/* src/core/util.js — tiny deterministic helpers shared by sim, solver, tests.
 * GRD note: everything here is pure integer math. No RNG, no floats-as-state.
 */

/**
 * Axis-aligned overlap test. Works with raw px OR Q16.16 values, as long as
 * both boxes use the same scale. (a: top-left origin, w/h positive.)
 */
export function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
}

/* ── FNV-1a 32-bit — the project's canonical hasher (spec §7 inputHash) ── */
export const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function fnv1aByte(h, byte) {
    h ^= byte & 0xff;
    return Math.imul(h, FNV_PRIME) >>> 0;
}

/** Fold a 32-bit integer into a running hash. Deterministic, order-sensitive. */
export function combineHashes(a, b) {
    let h = Math.imul((a >>> 0) ^ FNV_OFFSET, FNV_PRIME) >>> 0;
    const v = b >>> 0;
    h = fnv1aByte(h, v & 0xff);
    h = fnv1aByte(h, (v >>> 8) & 0xff);
    h = fnv1aByte(h, (v >>> 16) & 0xff);
    h = fnv1aByte(h, (v >>> 24) & 0xff);
    return h >>> 0;
}

/** Hash an entire proof/ghost input vector: FNV over (t, b) pairs in order. */
export function hashInputVector(inputs) {
    let h = FNV_OFFSET;
    for (let i = 0; i < inputs.length; i++) {
        h = combineHashes(h, inputs[i].t >>> 0);
        h = combineHashes(h, inputs[i].b & 0xff);
    }
    return h >>> 0;
}

/**
 * Per-tile decor seed (spec §5). Stable forever for a given (tx, ty, variant)
 * → decor sway/flip/detail never changes between runs or machines.
 */
export function decorHash(tx, ty, variant = 0) {
    const mixed = ((tx * 374761393) + (ty * 668265263)) >>> 0;
    return combineHashes(combineHashes(0x9e3779b9, mixed), (variant + 1) >>> 0);
}

/** Integer clamp (works in px or FP units). */
export function clampInt(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

/** Tile-space → pixel-space helpers (tile origin). */
export const tileToPx = (t) => t * 16;   // TILE is a constant 16 by spec §4