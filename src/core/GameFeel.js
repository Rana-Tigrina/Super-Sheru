/* src/core/GameFeel.js — Hit-stop, impact feedback, and juiciness triggers.
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 *   - Hit-stop / frame pause manager (micro-pauses on impactful hits)
 *   - Screen shake integration
 *   - Impact feedback dispatch
 */

export class GameFeel {
    constructor(camera = null) {
        this.camera = camera;
        this.hitStopFrames = 0;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    /** Trigger a micro-pause (hit-stop) on impactful game events. */
    hitStop(frames = 3) {
        this.hitStopFrames = Math.max(this.hitStopFrames, frames);
    }

    /** Trigger a camera shake through the registered camera. */
    shake(durationFrames = 8, intensityPx = 3) {
        this.camera?.shake(durationFrames, intensityPx);
    }

    /** Process frame update. Returns true if simulation should advance, false if in hit-stop. */
    update() {
        if (this.hitStopFrames > 0) {
            this.hitStopFrames--;
            return false; // freeze simulation for this tick
        }
        return true; // advance normally
    }

    /** High-level preset: Brick Shatter */
    onBrickShatter() {
        this.hitStop(2);
        this.shake(6, 2);
    }

    /** High-level preset: Enemy Stomp */
    onEnemyStomp() {
        this.hitStop(2);
        this.shake(4, 1.5);
    }

    /** High-level preset: Player Hurt */
    onPlayerHurt() {
        this.hitStop(4);
        this.shake(10, 4);
    }

    /** High-level preset: Power-Up Transformation */
    onTransform() {
        this.hitStop(6);
        this.shake(8, 2.5);
    }
}
