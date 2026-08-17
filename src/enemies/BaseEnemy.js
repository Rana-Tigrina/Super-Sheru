/* src/enemies/BaseEnemy.js — Base class for extensible enemy archetypes.
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic fixed-point simulation state with modular AI states:
 *   IDLE, PATROL, CHASE, ATTACK, HURT, DEAD.
 */

import { FP, PHYS, PHYS_FP } from '../core/constants.js';

export const ENEMY_STATE = {
    IDLE: 0,
    PATROL: 1,
    CHASE: 2,
    ATTACK: 3,
    HURT: 4,
    DEAD: 5,
};

export class BaseEnemy {
    constructor(xFP, yFP, kind = 'walker', config = {}) {
        this.kind = kind;
        this.s = {
            x: xFP,
            y: yFP,
            vx: config.speedFP || 0x00008ccd, // default 0.55 px/step
            vy: 0,
            w: config.width || 12,
            h: config.height || 12,
            facing: -1,
            state: ENEMY_STATE.PATROL,
            stateTimer: 0,
            hp: config.hp || 1,
            maxHp: config.hp || 1,
            alive: true,
            squashed: false,
            armoredFront: !!config.armoredFront,
        };
    }

    get alive() { return this.s.alive; }
    get x() { return this.s.x; }
    get y() { return this.s.y; }
    get w() { return FP.fromInt(this.s.w); }
    get h() { return FP.fromInt(this.s.h); }
    get boxFP() { return { x: this.s.x, y: this.s.y, w: this.w, h: this.h }; }

    takeDamage(amount = 1) {
        this.s.hp -= amount;
        if (this.s.hp <= 0) {
            this.squash();
        } else {
            this.s.state = ENEMY_STATE.HURT;
            this.s.stateTimer = 15;
        }
    }

    squash() {
        this.s.alive = false;
        this.s.squashed = true;
        this.s.state = ENEMY_STATE.DEAD;
        this.s.stateTimer = 0;
    }

    step(level, playerState) {
        const s = this.s;
        if (!s.alive) return;
        s.stateTimer++;

        // Basic patrol gravity and movement
        s.vy = FP.clamp(s.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
        s.x += (s.facing * s.vx);
        s.y += s.vy;

        // Ground collision
        const ty = FP.floorInt(s.y + FP.fromInt(s.h)) >> 4;
        const tx = FP.floorInt(s.x + FP.fromInt(s.w >> 1)) >> 4;
        if (level.isSolidAt(tx, ty)) {
            s.y = FP.fromInt(ty * 16 - s.h);
            s.vy = 0;
        }

        // Wall turnaround
        const wallTx = FP.floorInt(s.x + (s.facing > 0 ? FP.fromInt(s.w) : 0)) >> 4;
        const midTy = FP.floorInt(s.y + FP.fromInt(s.h >> 1)) >> 4;
        if (level.isSolidAt(wallTx, midTy)) {
            s.facing = -s.facing;
        }
    }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.s.alive && !this.s.squashed) return;
        const sx = FP.toInt(this.s.x) - camX;
        const sy = FP.toInt(this.s.y) - camY;
        const frame = (step >> 3) & 1;
        const spriteName = `${this.kind}.${frame}`;
        sprites.draw(ctx, spriteName, sx, sy, this.s.facing > 0);
    }
}
