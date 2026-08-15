/* src/weapons/Chakra.js — chakra shell (state + draw). */

import { FP } from '../core/constants.js';
import { createChakraState, stepChakra, chakraHitEnemy } from './ChakraLogic.js';

export class Chakra {
    constructor(xFP, yFP, dir) {
        this.s = createChakraState(xFP, yFP, dir);
    }

    get alive() { return this.s.alive; }
    get boxFP() { const s = this.s; return { x: s.x, y: s.y, w: FP.fromInt(s.w), h: FP.fromInt(s.h) }; }

    step(level, ev) { stepChakra(this.s, level, ev); }

    /** Returns true while the disc survives (pierce budget left). */
    onHitEnemy() { return chakraHitEnemy(this.s); }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.s.alive) return;
        const frame = ((step >> 2) & 1) ? 'chakra.1' : 'chakra.0';
        sprites.draw(ctx, frame, FP.toInt(this.s.x) - camX, FP.toInt(this.s.y) - camY);
    }
}