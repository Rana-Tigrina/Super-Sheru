/* src/enemies/AsuraArcher.js — Ranged lane archer enemy.
 * ─────────────────────────────────────────────────────────────────────────────
 * Charges bow with sparkle telegraph, then fires straight arrow projectile.
 */

import { BaseEnemy, ENEMY_STATE } from './BaseEnemy.js';
import { FP } from '../core/constants.js';

export class AsuraArcher extends BaseEnemy {
    constructor(xFP, yFP) {
        super(xFP, yFP, 'archer', {
            width: 12,
            height: 14,
            speedFP: 0x00003000, // slow patrol
            hp: 1,
        });
        this.arrows = []; // [ { x, y, vx, alive } ]
        this.chargeTimer = 0;
    }

    step(level, playerState) {
        super.step(level, playerState);
        if (!this.s.alive) return;

        // Check if player is on same horizontal plane within 120px
        const distY = Math.abs(FP.toInt(playerState.y) - FP.toInt(this.s.y));
        const distX = (FP.toInt(playerState.x) - FP.toInt(this.s.x)) * this.s.facing;

        if (distY < 24 && distX > 0 && distX < 160) {
            this.chargeTimer++;
            if (this.chargeTimer >= 50) {
                // Fire arrow projectile
                this.arrows.push({
                    x: this.s.x + (this.s.facing > 0 ? FP.fromInt(12) : FP.fromInt(-4)),
                    y: this.s.y + FP.fromInt(6),
                    vx: this.s.facing * FP.fromNumber(3.2),
                    alive: true,
                });
                this.chargeTimer = 0;
            }
        } else {
            this.chargeTimer = 0;
        }

        // Update active arrows
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const a = this.arrows[i];
            a.x += a.vx;
            const tx = FP.floorInt(a.x) >> 4;
            const ty = FP.floorInt(a.y) >> 4;
            if (level.isSolidAt(tx, ty)) {
                this.arrows.splice(i, 1);
            }
        }
    }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.s.alive && !this.s.squashed) return;
        const sx = FP.toInt(this.s.x) - camX;
        const sy = FP.toInt(this.s.y) - camY;

        const frame = (step >> 3) & 1;
        sprites.draw(ctx, `walker.${frame}`, sx, sy, this.s.facing > 0);

        // Draw bow telegraph sparkle when charging
        if (this.chargeTimer > 30) {
            ctx.save();
            ctx.fillStyle = '#ffd94a'; // flame yellow
            ctx.fillRect(sx + (this.s.facing > 0 ? 12 : -2), sy + 5, 2, 2);
            ctx.restore();
        }

        // Draw flying arrows
        for (const a of this.arrows) {
            const ax = FP.toInt(a.x) - camX;
            const ay = FP.toInt(a.y) - camY;
            ctx.save();
            ctx.fillStyle = '#b56a3c'; // terracotta arrow shaft
            ctx.fillRect(ax, ay, 6, 2);
            ctx.fillStyle = '#faf6ef'; // white arrow tip
            ctx.fillRect(a.vx > 0 ? ax + 5 : ax, ay, 2, 2);
            ctx.restore();
        }
    }
}
