/* src/enemies/FloaterEnemyLogic.js — pure floater simulation.
 * Hover = fixed-point sine LUT (constants.js FP.sin): integer phase advances
 * every step, so every machine renders the identical path (spec §5).
 */

import { FP, PHYS } from '../core/constants.js';

export function createFloaterState(tx, ty, ampTiles, phase) {
    return {
        baseX: FP.fromInt(tx * 16 + 1),
        baseY: FP.fromInt(ty * 16 + 3),
        x: FP.fromInt(tx * 16 + 1),
        y: FP.fromInt(ty * 16 + 3),
        w: PHYS.FLOATER_W, h: PHYS.FLOATER_H,
        ampFP: FP.fromInt((ampTiles ?? 2) * 16),
        phase: (phase ?? 0) & 255,
        phaseSpeed: 2,                // full bob ≈ 128 steps ≈ 2.1 s
        alive: true,
        squash: 0,
    };
}

export function stepFloater(e) {
    if (!e.alive) { e.squash++; return; }

    e.phase = (e.phase + e.phaseSpeed) & 255;

    /* vertical bob ± amp tiles */
    const offY = FP.mul(e.ampFP, FP.sin(e.phase));
    /* gentle ±6px horizontal drift, quarter-phase offset */
    const offX = FP.mul(FP.fromInt(6), FP.sin((e.phase + 64) & 255));

    e.x = e.baseX + offX;
    e.y = e.baseY + offY;
}