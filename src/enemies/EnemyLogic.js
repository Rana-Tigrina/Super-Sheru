/* src/enemies/EnemyLogic.js — WalkerEnemyLogic.
 * Pure walker simulation: gravity, patrol, wall/hazard turns, ledge turns.
 * Integer FP only. The squash/death visual is a render-side timer.
 */

import { FP, PHYS, PHYS_FP, isSolid, isHazard, isWater } from '../core/constants.js';

export const WALKER_SPEED = FP.fromNumber(0.55);
const TURN_COOLDOWN = 12;

export function createWalkerState(tx, ty, dir) {
    return {
        /* entity ty = the tile row the feet occupy */
        x: FP.fromInt(tx * 16 + 2),
        y: FP.fromInt((ty + 1) * 16 - PHYS.ENEMY_H),
        vx: 0, vy: 0,
        w: PHYS.ENEMY_W, h: PHYS.ENEMY_H,
        dir: dir >= 0 ? 1 : -1,
        onGround: false,
        alive: true,
        squash: 0,
        turnCooldown: 0,
    };
}

function flip(e) {
    e.dir = -e.dir;
    e.turnCooldown = TURN_COOLDOWN;
}

function blocked(id) {
    return isSolid(id) || isHazard(id) || isWater(id);
}

export function stepWalker(e, level) {
    if (!e.alive) { e.squash++; return; }
    if (e.turnCooldown > 0) e.turnCooldown--;

    const wF = FP.fromInt(e.w);
    const hF = FP.fromInt(e.h);

    /* ── gravity + vertical ── */
    e.vy = FP.clamp(e.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
    e.y += e.vy;
    e.onGround = false;

    if (e.vy >= 0) {
        const ty = FP.floorInt(e.y + hF - 1) >> 4;
        const x0 = FP.floorInt(e.x) >> 4;
        const x1 = FP.floorInt(e.x + wF - 1) >> 4;
        let landed = false;
        for (let tx = x0; tx <= x1; tx++) {
            if (isSolid(level.tileAt(tx, ty))) { landed = true; break; }
        }
        if (landed) {
            e.y = FP.fromInt(ty * 16) - hF;
            e.vy = 0;
            e.onGround = true;
        }
    }

    /* ── horizontal patrol ── */
    const prevX = e.x;
    e.x += FP.mul(FP.fromInt(e.dir), WALKER_SPEED);

    if (e.x < 0) { e.x = 0; flip(e); }
    else if (e.x + wF > FP.fromInt(level.pxW)) { e.x = FP.fromInt(level.pxW) - wF; flip(e); }

    /* wall / hazard / water in front → turn */
    const y0 = FP.floorInt(e.y) >> 4;
    const y1 = FP.floorInt(e.y + hF - 1) >> 4;
    for (let ty = y0; ty <= y1; ty++) {
        const tx = e.dir > 0 ? (FP.floorInt(e.x + wF - 1) >> 4) : (FP.floorInt(e.x) >> 4);
        if (blocked(level.tileAt(tx, ty))) { e.x = prevX; flip(e); break; }
    }

    /* ledge probe: no floor ahead → turn (walkers never fall off shelves) */
    if (e.onGround && e.turnCooldown === 0) {
        const probeX = e.dir > 0 ? (FP.floorInt(e.x + wF + FP.fromInt(1)) >> 4) : (FP.floorInt(e.x - FP.fromInt(2)) >> 4);
        const probeY = FP.floorInt(e.y + hF + FP.fromInt(2)) >> 4;
        if (!isSolid(level.tileAt(probeX, probeY))) {
            flip(e);
        }
    }
}