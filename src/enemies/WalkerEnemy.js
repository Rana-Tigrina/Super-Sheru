/* src/enemies/WalkerEnemy.js — walker shell (state + draw). */

import { FP } from '../core/constants.js';
import { createWalkerState, stepWalker } from './EnemyLogic.js';

export class WalkerEnemy {
    constructor(ent) {
        this.s = createWalkerState(ent.tx, ent.ty, ent.dir ?? -1);
        this.kind = 'walker';
    }

    get alive() { return this.s.alive; }
    get boxFP() { const s = this.s; return { x: s.x, y: s.y, w: FP.fromInt(s.w), h: FP.fromInt(s.h) }; }

    step(level) { stepWalker(this.s, level); }

    squash() {
        if (!this.s.alive) return;
        this.s.alive = false;
        this.s.squash = 0;
    }

    draw(ctx, sprites, camX, camY, step) {
        const s = this.s;
        const x = FP.toInt(s.x) - camX - 2;
        const y = FP.toInt(s.y) - camY - 4;

        if (!s.alive) {
            if (s.squash < 12) sprites.draw(ctx, 'puff', x + 4, y + 6);
            return;
        }
        sprites.draw(ctx, ((step >> 4) & 1) ? 'walker.1' : 'walker.0', x, y, s.dir > 0);
    }
}