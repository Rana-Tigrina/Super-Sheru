/* src/render/Camera.js — Smooth 2D camera with look-ahead and screen shake.
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 *   - Smooth lerp tracking with velocity & facing look-ahead
 *   - Boundary clamping to level dimensions
 *   - Configurable screen shake API
 */

import { VIEW } from '../core/constants.js';

export class Camera {
    constructor(viewW = VIEW.W, viewH = VIEW.H) {
        this.w = viewW;
        this.h = viewH;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lookAheadX = 0;

        // Screen shake
        this.shakeTimer = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    /** Reset camera position directly to target coordinates. */
    reset(targetX, targetY = 0, levelPxW = 4000) {
        this.lookAheadX = 0;
        this.x = Math.max(0, Math.min(targetX - (this.w / 2), levelPxW - this.w));
        this.y = 0;
        this.targetX = this.x;
        this.targetY = this.y;
        this.shakeTimer = 0;
    }

    /** Trigger a screen shake impulse. */
    shake(durationFrames = 8, intensityPx = 3) {
        this.shakeDuration = durationFrames;
        this.shakeTimer = durationFrames;
        this.shakeIntensity = intensityPx;
    }

    /** Update camera position and shake offsets. */
    update(playerX, playerY, facing = 1, vx = 0, levelPxW = 4000) {
        // Horizontal look-ahead: leads forward in movement/facing direction
        const desiredLookAhead = facing * (Math.abs(vx) > 1 ? 24 : 12);
        this.lookAheadX += (desiredLookAhead - this.lookAheadX) * 0.08;

        const desiredX = playerX - (this.w / 2) + this.lookAheadX;
        const maxX = Math.max(0, levelPxW - this.w);

        // Smooth follow (lerp)
        this.x += (desiredX - this.x) * 0.12;
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = 0; // standard 2D platformer horizontal scrolling

        // Update screen shake
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            const progress = this.shakeTimer / this.shakeDuration;
            const amp = this.shakeIntensity * progress;
            this.shakeOffsetX = ((Math.random() * 2 - 1) * amp) | 0;
            this.shakeOffsetY = ((Math.random() * 2 - 1) * amp) | 0;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    /** Effective integer X position for rendering (includes shake). */
    get renderX() {
        return ((this.x | 0) + this.shakeOffsetX);
    }

    /** Effective integer Y position for rendering (includes shake). */
    get renderY() {
        return ((this.y | 0) + this.shakeOffsetY);
    }
}
