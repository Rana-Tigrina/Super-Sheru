/* src/enemies/FloaterEnemy.js — floater shell (state + draw). */

import { FP } from '../core/constants.js';
import { createFloaterState, stepFloater } from './FloaterEnemyLogic.js';

export class FloaterEnemy {
  constructor(ent) {
    this.s = createFloaterState(ent.tx, ent.ty, ent.amp, ent.phase);
    this.kind = 'floater';
  }

  get alive() { return this.s.alive; }
  get boxFP() { const s = this.s; return { x: s.x, y: s.y, w: FP.fromInt(s.w), h: FP.fromInt(s.h) }; }

  step(_level) { stepFloater(this.s); }   // floaters ignore terrain

  squash() {
    if (!this.s.alive) return;
    this.s.alive = false;
    this.s.squash = 0;
  }

  draw(ctx, sprites, camX, camY, step) {
    const s = this.s;
    const x = FP.toInt(s.x) - camX - 1;
    const y = FP.toInt(s.y) - camY - 3;

    if (!s.alive) {
      if (s.squash < 12) sprites.draw(ctx, 'puff', x + 4, y + 2);
      return;
    }
    sprites.draw(ctx, ((step >> 3) & 1) ? 'floater.1' : 'floater.0', x, y);
  }
}