/* src/enemies/bosses/KalaYantra.js — Jaipur Boss: Mechanical Palace Guardian.
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-Phase Encounter:
 *   Phase 1: Rotating gear charges across Amer Fort arena.
 *   Phase 2: Steam exhaust ground slam shockwaves.
 *   Phase 3: Overheated frantic rage with exposed glowing core.
 */

import { FP, PHYS, PHYS_FP } from '../../core/constants.js';

export class KalaYantra {
    constructor(xFP, yFP) {
        this.name = 'Kala Yantra';
        this.title = 'Ancient Guardian of Amer Fort';
        this.x = xFP;
        this.y = yFP;
        this.vx = 0;
        this.vy = 0;
        this.w = 28;
        this.h = 28;
        this.wFP = FP.fromInt(28);
        this.hFP = FP.fromInt(28);

        this.hp = 3;
        this.maxHp = 3;
        this.phase = 1;
        this.state = 'idle'; // idle | charge | jump | overheat | dead
        this.timer = 0;
        this.facing = -1;
        this.vulnerable = false;
        this.alive = true;
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
            this.state = 'jump';
            this.vy = -FP.fromNumber(5.5);
            this.timer = 0;
        }
        return true;
    }

    step(level, playerState, ev) {
        if (!this.alive) return;
        this.timer++;

        // Basic physics
        this.vy = FP.clamp(this.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
        this.x += this.vx;
        this.y += this.vy;

        // Ground check
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
                if (this.timer > (60 - this.phase * 12)) {
                    this.state = 'charge';
                    this.timer = 0;
                    this.facing = (playerState.x < this.x) ? -1 : 1;
                    this.vx = this.facing * FP.fromNumber(1.8 + this.phase * 0.5);
                }
                break;

            case 'charge':
                if (this.timer > 90) {
                    this.state = 'overheat';
                    this.timer = 0;
                    this.vx = 0;
                    this.vulnerable = true; // Open window for Sheru to strike!
                }
                break;

            case 'overheat':
                this.vx = 0;
                this.vulnerable = true;
                if (this.timer > 100) {
                    this.state = 'idle';
                    this.timer = 0;
                    this.vulnerable = false;
                }
                break;

            case 'jump':
                if (this.timer > 40 && this.vy === 0) {
                    this.state = 'idle';
                    this.timer = 0;
                }
                break;
        }
    }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.alive && ((step >> 2) & 1)) return; // death blinking

        const sx = FP.toInt(this.x) - camX;
        const sy = FP.toInt(this.y) - camY;

        ctx.save();
        // Brass metallic body
        ctx.fillStyle = this.vulnerable ? '#d9383c' : '#b56a3c'; // red overheat or bronze
        ctx.fillRect(sx, sy, this.w, this.h);

        // Core jewel
        ctx.fillStyle = this.vulnerable ? '#ffd94a' : '#2fb58f'; // glowing gold or teal core
        ctx.fillRect(sx + 8, sy + 8, 12, 12);

        // Gear cogs
        ctx.fillStyle = '#8f84a8';
        const cogOffset = (step * 2) % 8;
        ctx.fillRect(sx - 2, sy + 6 + (cogOffset % 12), 3, 4);
        ctx.fillRect(sx + this.w - 1, sy + 6 + ((8 - cogOffset) % 12), 3, 4);

        ctx.restore();
    }
}
