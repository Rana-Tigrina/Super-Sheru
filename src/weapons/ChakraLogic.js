/* src/weapons/ChakraLogic.js — pure chakra disc simulation.
 * Spec §6: flies horizontally, 6-tile life (~23 steps), pierces exactly
 * one enemy (second kill shatters it), shatters on solid terrain.
 */

import { FP, PHYS, PHYS_FP, isSolid, TILE_ID } from '../core/constants.js';

export function createChakraState(xFP, yFP, dir) {
    return {
        x: xFP, y: yFP,
        vx: dir >= 0 ? PHYS_FP.CHAKRA_SPEED : -PHYS_FP.CHAKRA_SPEED,
        w: 8, h: 8,
        life: PHYS.CHAKRA_LIFE,
        pierced: 0,
        alive: true,
        dir: dir >= 0 ? 1 : -1,
    };
}

export function stepChakra(c, level, ev) {
    if (!c.alive) return;

    c.x += c.vx;
    c.life--;

    if (c.life <= 0) { c.alive = false; return; }

    /* leading-edge probe against solid terrain */
    const probeX = c.vx > 0 ? c.x + FP.fromInt(c.w) : c.x - 1;
    const tx = FP.floorInt(probeX) >> 4;
    const ty = FP.floorInt(c.y + FP.fromInt(4)) >> 4;
    const id = level.tileAt(tx, ty);

    if (isSolid(id)) {
        c.alive = false;
        ev.shatter = true;
        /* '?' blocks can be broken from the side by chakra — same bonk path */
        if (id === TILE_ID.LADDOO_BLOCK && level.bonkBlock(tx, ty)) {
            ev.bonk = { tx, ty };
        }
    }
}

/** Register an enemy kill. Returns true if the chakra survives to pierce on. */
export function chakraHitEnemy(c) {
    if (!c.alive) return false;
    c.pierced++;
    if (c.pierced > 1) { c.alive = false; return false; }
    return true;
}