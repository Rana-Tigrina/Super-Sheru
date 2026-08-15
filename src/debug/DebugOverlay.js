/* src/debug/DebugOverlay.js — toggle with Backquote (`).
 * Shows the fixed-step clock, FP readouts, and raw hitboxes — the GRD
 * "trust but verify" panel (spec §11).
 */

import { FP, P_STATE } from '../core/constants.js';

const STATE_NAMES = Object.keys(P_STATE);   // insertion order = numeric value
const PANEL = 'rgba(24,16,34,0.72)';
const TEXT = '#f5e6c8';
const GOLD = '#f2b632';
const BOX = 'rgba(200,56,60,0.9)';

export class DebugOverlay {
    constructor() {
        this.enabled = false;
        this._key = (e) => {
            if (e.code === 'Backquote' && !e.repeat) this.enabled = !this.enabled;
        };
        window.addEventListener('keydown', this._key);
    }

    destroy() {
        window.removeEventListener('keydown', this._key);
    }

    /** scene: a GameScene (guarded — works with any scene shape). */
    draw(ctx, scene) {
        if (!this.enabled || !scene || !scene.player) return;

        const p = scene.player.s;
        const camX = scene.camX ?? 0;
        const camY = scene.camY ?? 0;

        /* ── readout panel ── */
        const lines = [
            `step   ${scene.stepCount ?? 0}`,
            `pos    ${FP.toNumber(p.x).toFixed(1)},${FP.toNumber(p.y).toFixed(1)}`,
            `fp     ${p.x},${p.y}`,
            `vel    ${FP.toNumber(p.vx).toFixed(2)},${FP.toNumber(p.vy).toFixed(2)}`,
            `state  ${STATE_NAMES[p.state] ?? p.state} ${p.onGround ? '(gnd)' : '(air)'}`,
            `inv    ${p.invuln}   lives ${p.lives}`,
            `enemies ${scene.enemies?.filter((e) => e.alive).length ?? 0}`,
            `chakras ${scene.chakras?.list.length ?? 0}`,
        ];

        ctx.fillStyle = PANEL;
        ctx.fillRect(4, 24, 150, lines.length * 10 + 8);
        ctx.font = '8px "Courier New", monospace';
        ctx.textAlign = 'left';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillStyle = i === 0 ? GOLD : TEXT;
            ctx.fillText(lines[i], 8, 34 + i * 10);
        }

        /* ── hitboxes ── */
        ctx.strokeStyle = BOX;
        ctx.lineWidth = 1;

        const rect = (xFP, yFP, wFP, hFP) => {
            ctx.strokeRect(
                FP.toNumber(xFP) - camX + 0.5,
                FP.toNumber(yFP) - camY + 0.5,
                FP.toNumber(wFP), FP.toNumber(hFP),
            );
        };

        rect(p.x, p.y, FP.fromInt(p.w), FP.fromInt(p.h));

        for (const e of scene.enemies ?? []) {
            if (!e.alive) continue;
            const b = e.boxFP;
            rect(b.x, b.y, b.w, b.h);
        }
        for (const c of scene.chakras?.list ?? []) {
            const b = c.boxFP;
            rect(b.x, b.y, b.w, b.h);
        }
        const f = scene.level?.flag;
        if (f) rect(f.boxX, f.boxY, f.boxW, f.boxH);
    }
}