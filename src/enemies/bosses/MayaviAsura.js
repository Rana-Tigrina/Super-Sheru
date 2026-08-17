/* src/enemies/bosses/MayaviAsura.js — Kashi Boss: Mystic Illusionist Sorcerer.
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-Phase Encounter:
 *   Phase 1: Mist teleportation around the Ganga ghats arena.
 *   Phase 2: Mirror clone decoys and floating flame orbs.
 *   Phase 3: Fast teleport barrage with brief vulnerable meditation recovery.
 */

import { FP, PHYS, PHYS_FP } from '../../core/constants.js';

export class MayaviAsura {
    constructor(xFP, yFP) {
        this.name = 'Mayavi Asura';
        this.title = 'Sorcerer of the Ganga Mist';
        this.x = xFP;
        this.y = yFP;
        this.vx = 0;
        this.vy = 0;
        this.w = 24;
        this.h = 28;
        this.wFP = FP.fromInt(24);
        this.hFP = FP.fromInt(28);

        this.hp = 3;
        this.maxHp = 3;
        this.phase = 1;
        this.state = 'idle'; // idle | teleport | flame | vulnerable | dead
        this.timer = 0;
        this.facing = -1;
        this.vulnerable = false;
        this.alive = true;
        this.flames = []; // [ { x, y, vx, vy } ]
        this.teleportLocations = [
            { x: xFP, y: yFP },
            { x: xFP + FP.fromInt(120), y: yFP },
            { x: xFP - FP.fromInt(80), y: yFP },
        ];
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
            this.state = 'teleport';
            this.timer = 0;
        }
        return true;
    }

    step(level, playerState, ev) {
        if (!this.alive) return;
        this.timer++;

        switch (this.state) {
            case 'idle':
                this.vulnerable = false;
                this.facing = (playerState.x < this.x) ? -1 : 1;
                if (this.timer > (60 - this.phase * 10)) {
                    this.state = 'flame';
                    this.timer = 0;
                }
                break;

            case 'flame':
                if (this.timer === 20) {
                    // Cast homing flame orbs
                    this.flames.push({
                        x: this.x + FP.fromInt(12),
                        y: this.y + FP.fromInt(8),
                        vx: this.facing * FP.fromNumber(2.2),
                        vy: 0,
                        alive: true,
                    });
                }
                if (this.timer > 45) {
                    this.state = 'vulnerable';
                    this.timer = 0;
                    this.vulnerable = true; // Meditating recovery state
                }
                break;

            case 'vulnerable':
                this.vulnerable = true;
                if (this.timer > 90) {
                    this.state = 'teleport';
                    this.timer = 0;
                    this.vulnerable = false;
                }
                break;

            case 'teleport':
                if (this.timer === 20) {
                    // Shift position
                    const loc = this.teleportLocations[Math.floor(Math.random() * this.teleportLocations.length)];
                    this.x = loc.x;
                    this.y = loc.y;
                }
                if (this.timer > 40) {
                    this.state = 'idle';
                    this.timer = 0;
                }
                break;
        }

        // Update active flames
        for (let i = this.flames.length - 1; i >= 0; i--) {
            const f = this.flames[i];
            f.x += f.vx;
            const fTx = FP.floorInt(f.x) >> 4;
            const fTy = FP.floorInt(f.y) >> 4;
            if (level.isSolidAt(fTx, fTy)) {
                this.flames.splice(i, 1);
            }
        }
    }

    draw(ctx, sprites, camX, camY, step) {
        if (!this.alive && ((step >> 2) & 1)) return;

        const sx = FP.toInt(this.x) - camX;
        const sy = FP.toInt(this.y) - camY;

        ctx.save();
        if (this.state === 'teleport') {
            // Smoke / mist dissolution effect
            ctx.fillStyle = 'rgba(200, 196, 216, 0.4)';
            ctx.fillRect(sx - 4, sy - 4, this.w + 8, this.h + 8);
        } else {
            // Aubergine / Kumkum Sorcerer Robe
            ctx.fillStyle = this.vulnerable ? '#a82836' : '#2d1a4a';
            ctx.fillRect(sx, sy, this.w, this.h);

            // Mystic headdress
            ctx.fillStyle = '#ffd94a'; // gold flame tiara
            ctx.fillRect(sx + 6, sy - 4, 12, 4);

            // Red tilak
            ctx.fillStyle = '#d9383c';
            ctx.fillRect(sx + 11, sy + 4, 2, 4);
        }

        // Mystic flame orbs
        for (const f of this.flames) {
            const fx = FP.toInt(f.x) - camX;
            const fy = FP.toInt(f.y) - camY;
            ctx.fillStyle = '#ff8c28';
            ctx.fillRect(fx, fy, 8, 8);
            ctx.fillStyle = '#ffd94a';
            ctx.fillRect(fx + 2, fy + 2, 4, 4);
        }

        ctx.restore();
    }
}
