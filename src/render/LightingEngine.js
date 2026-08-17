/* src/render/LightingEngine.js — Dynamic 2D lighting, localized glows, and god rays.
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 *   - Localized radial glow rendering (diyas, lanterns, chakras, laddoos, aura)
 *   - Soft atmospheric haze & sun god rays
 *   - Zero overhead on silent/headless verification runs
 */

import { VIEW } from '../core/constants.js';

export class LightingEngine {
    constructor(w = VIEW.W, h = VIEW.H) {
        this.w = w;
        this.h = h;
        this.lights = []; // [ { x, y, radius, color, intensity } ]
    }

    /** Clear lights array before populating each frame. */
    clear() {
        this.lights.length = 0;
    }

    /** Add a point light source (in screen pixel coordinates). */
    addLight(screenX, screenY, radius, color = '#ffd94a', intensity = 0.4) {
        if (screenX < -radius || screenX > this.w + radius ||
            screenY < -radius || screenY > this.h + radius) return;

        this.lights.push({
            x: screenX | 0,
            y: screenY | 0,
            radius: radius | 0,
            color,
            intensity,
        });
    }

    /** Render all registered localized glows with additive / composite blending. */
    draw(ctx) {
        if (this.lights.length === 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (const light of this.lights) {
            const grad = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            grad.addColorStop(0, light.color);
            grad.addColorStop(0.5, light.color);
            grad.addColorStop(1, 'transparent');

            ctx.globalAlpha = light.intensity;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /** Render subtle ambient atmospheric god rays (e.g. dawn, sunrise, temple light). */
    drawGodRays(ctx, originX, originY, color = 'rgba(255, 220, 140, 0.08)', count = 5, step = 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = color;

        for (let i = 0; i < count; i++) {
            const angleBase = 0.4 + i * 0.22;
            const sway = Math.sin(step * 0.02 + i) * 0.04;
            const angle = angleBase + sway;

            const rayLength = 320;
            const rayWidth = 28 + i * 8;

            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(
                originX + Math.cos(angle - 0.08) * rayLength - rayWidth,
                originY + Math.sin(angle - 0.08) * rayLength
            );
            ctx.lineTo(
                originX + Math.cos(angle + 0.08) * rayLength + rayWidth,
                originY + Math.sin(angle + 0.08) * rayLength
            );
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
