/* src/enemies/ArmoredRakshasa.js — Heavy armored enemy with frontal shield.
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontal attacks bounce/repel. Vulnerable to stomps from above or rear attacks.
 */

import { BaseEnemy, ENEMY_STATE } from './BaseEnemy.js';
import { FP } from '../core/constants.js';

export class ArmoredRakshasa extends BaseEnemy {
    constructor(xFP, yFP) {
        super(xFP, yFP, 'rakshasa', {
            width: 14,
            height: 14,
            speedFP: 0x00005ccd, // 0.36 px/step (heavy plodding march)
            hp: 2,
            armoredFront: true,
        });
    }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.s.alive && !this.s.squashed) return;
        const sx = FP.toInt(this.s.x) - camX;
        const sy = FP.toInt(this.s.y) - camY;

        // Base walker body + metallic shield representation
        const frame = (step >> 4) & 1;
        sprites.draw(ctx, `walker.${frame}`, sx, sy, this.s.facing > 0);

        // Shield plate on front
        ctx.save();
        ctx.fillStyle = '#8f84a8'; // slate bronze shield
        const shieldX = sx + (this.s.facing > 0 ? 11 : 0);
        ctx.fillRect(shieldX, sy + 2, 3, 10);
        ctx.restore();
    }
}
