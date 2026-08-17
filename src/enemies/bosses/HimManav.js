/* src/enemies/bosses/HimManav.js — Himalaya Boss: Snowline Yeti.
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-Phase Encounter:
 *   Phase 1: Rolling ice boulder throw & ground stomp.
 *   Phase 2: Heavy charging rush into arena walls (causing stun).
 *   Phase 3: Frantic blizzard stomps with ceiling icicle drops.
 */

import { FP, PHYS, PHYS_FP } from '../../core/constants.js';

export class HimManav {
    constructor(xFP, yFP) {
        this.name = 'Him-Manav';
        this.title = 'Beast of the Snowline';
        this.x = xFP;
        this.y = yFP;
        this.vx = 0;
        this.vy = 0;
        this.w = 32;
        this.h = 32;
        this.wFP = FP.fromInt(32);
        this.hFP = FP.fromInt(32);

        this.hp = 3;
        this.maxHp = 3;
        this.phase = 1;
        this.state = 'idle'; // idle | boulder | charge | stunned | dead
        this.timer = 0;
        this.facing = -1;
        this.vulnerable = false;
        this.alive = true;
        this.boulders = []; // [ { x, y, vx, alive } ]
    }

    get boxFP() {
        return { x: this.x, y: this.y, w: this.wFP, h: this.hFP };
    }

    takeDamage() {
        if (!this.vulnerable) return false;
        this.hp--;
        this.vulnerable = false;
        if (this.hp <= 0) {
            this.state = 'dead';
            this.alive = false;
        } else {
            this.phase = 4 - this.hp;
            this.state = 'idle';
            this.timer = 0;
        }
        return true;
    }

    step(level, playerState, ev) {
        if (!this.alive) return;
        this.timer++;

        this.vy = FP.clamp(this.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
        this.x += this.vx;
        this.y += this.vy;

        // Ground collision
        const groundY = FP.floorInt(this.y + this.hFP) >> 4;
        const midX = FP.floorInt(this.x + FP.fromInt(this.w >> 1)) >> 4;
        if (level.isSolidAt(midX, groundY)) {
            this.y = FP.fromInt(groundY * 16 - this.h);
            this.vy = 0;
        }

        // State machine
        switch (this.state) {
            case 'idle':
                this.vx = 0;
                this.vulnerable = false;
                this.facing = (playerState.x < this.x) ? -1 : 1;
                if (this.timer > (70 - this.phase * 15)) {
                    this.state = this.phase > 1 ? 'charge' : 'boulder';
                    this.timer = 0;
                }
                break;

            case 'boulder':
                if (this.timer === 20) {
                    // Toss ice boulder
                    this.boulders.push({
                        x: this.x + (this.facing > 0 ? this.wFP : -FP.fromInt(12)),
                        y: this.y + FP.fromInt(8),
                        vx: this.facing * FP.fromNumber(2.4),
                        alive: true,
                    });
                }
                if (this.timer > 50) {
                    this.state = 'idle';
                    this.timer = 0;
                }
                break;

            case 'charge':
                this.vx = this.facing * FP.fromNumber(2.8 + this.phase * 0.4);
                if (this.timer > 80) {
                    // Stunned after heavy charge
                    this.state = 'stunned';
                    this.timer = 0;
                    this.vx = 0;
                    this.vulnerable = true;
                }
                break;

            case 'stunned':
                this.vx = 0;
                this.vulnerable = true;
                if (this.timer > 110) {
                    this.state = 'idle';
                    this.timer = 0;
                    this.vulnerable = false;
                }
                break;
        }

        // Update active ice boulders
        for (let i = this.boulders.length - 1; i >= 0; i--) {
            const b = this.boulders[i];
            b.x += b.vx;
            const bTx = FP.floorInt(b.x) >> 4;
            const bTy = FP.floorInt(b.y) >> 4;
            if (level.isSolidAt(bTx, bTy)) {
                this.boulders.splice(i, 1);
            }
        }
    }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.alive && ((step >> 2) & 1)) return;

        const sx = FP.toInt(this.x) - camX;
        const sy = FP.toInt(this.y) - camY;

        ctx.save();
        // White / Ivory Fur Body
        ctx.fillStyle = this.vulnerable ? '#c8c4d8' : '#faf6ef';
        ctx.fillRect(sx, sy, this.w, this.h);

        // Face & horns
        ctx.fillStyle = '#1a3a6f'; // deep blue face
        ctx.fillRect(sx + (this.facing > 0 ? 18 : 4), sy + 6, 10, 10);

        // Eyes
        ctx.fillStyle = '#ffd94a';
        ctx.fillRect(sx + (this.facing > 0 ? 22 : 6), sy + 8, 2, 2);

        // Ice boulders
        for (const b of this.boulders) {
            const bx = FP.toInt(b.x) - camX;
            const by = FP.toInt(b.y) - camY;
            ctx.fillStyle = '#e4ecf5';
            ctx.fillRect(bx, by, 10, 10);
            ctx.fillStyle = '#4a8fd9';
            ctx.fillRect(bx + 2, by + 2, 6, 6);
        }

        ctx.restore();
    }
}
