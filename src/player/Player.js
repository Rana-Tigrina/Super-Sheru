/* src/player/Player.js — the Sheru shell: owns state, wraps pure logic,
 * and knows how to draw itself. All sim state lives in this.s (FP units).
 */

import { FP, P_STATE, PLAYER_FORM } from '../core/constants.js';
import {
    createPlayerState, stepPlayer,
    damagePlayer, applyStompBounce, setCheckpoint, winLevel,
    transformPlayer, activateKavach,
} from './PlayerLogic.js';

export class Player {
    /** spawn: { x, y } in FP px (Level.spawnPoint / Checkpoint.spawn*). */
    constructor(spawn) {
        this.s = createPlayerState(spawn.x, spawn.y);
    }

    step(bits, level, ev) {
        stepPlayer(this.s, bits, level, ev);
    }

    /* delegations used by GameScene / Verifier */
    damage(ev) { damagePlayer(this.s, ev); }
    stompBounce() { applyStompBounce(this.s); }
    setCheckpoint(x, y) { setCheckpoint(this.s, x, y); }
    win() { winLevel(this.s); }
    transform(form, ev) { transformPlayer(this.s, form, ev); }
    giveKavach(durationTicks = 720, ev) { activateKavach(this.s, durationTicks, ev); }

    get dead() { return this.s.state === P_STATE.DEAD; }
    get won() { return this.s.state === P_STATE.WIN; }
    get form() { return this.s.form; }
    get isSuper() { return this.s.form === PLAYER_FORM.SUPER; }
    get isKavach() { return this.s.kavachTimer > 0; }
    get boxFP() { const s = this.s; return { x: s.x, y: s.y, w: FP.fromInt(s.w), h: FP.fromInt(s.h) }; }

    draw(ctx, sprites, camX, camY, step) {
        const s = this.s;

        /* invulnerability blink */
        if (s.invuln > 0 && s.state !== P_STATE.DEAD && ((step >> 2) & 1)) return;

        /* transformation flicker */
        if (s.transformTimer > 0 && ((step >> 1) & 1)) return;

        const isSuper = s.form === PLAYER_FORM.SUPER;
        const prefix = isSuper ? 'sheru_super' : 'sheru';

        let name;
        switch (s.state) {
            case P_STATE.JUMP:
            case P_STATE.FALL:
            case P_STATE.WIN:
                name = `${prefix}.jump`;
                break;
            case P_STATE.RUN:
            case P_STATE.SKID:
            case P_STATE.STOMP:
                name = ((step >> 3) & 1) ? `${prefix}.run0` : `${prefix}.run1`;
                break;
            default:
                name = `${prefix}.idle`;
        }

        const x = FP.toInt(s.x) - camX - (isSuper ? 1 : 3);
        const y = FP.toInt(s.y) - camY - (isSuper ? 2 : 2);

        /* Draw Sudarshan Kavach solar aura / rainbow glow */
        if (s.kavachTimer > 0) {
            const auraPhase = (step * 8) % 360;
            const auraGlow = 1.0 + 0.3 * Math.sin(step * 0.2);
            ctx.save();
            ctx.strokeStyle = `hsl(${auraPhase}, 100%, 65%)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const radius = (isSuper ? 14 : 10) * auraGlow;
            ctx.arc(x + 8, y + (isSuper ? 12 : 8), radius, 0, Math.PI * 2);
            ctx.stroke();

            // Sparkle orbits
            const spX = (x + 8 + Math.cos(step * 0.3) * (radius + 2)) | 0;
            const spY = (y + (isSuper ? 12 : 8) + Math.sin(step * 0.3) * (radius + 2)) | 0;
            sprites.draw(ctx, 'sparkle', spX - 4, spY - 4);
            ctx.restore();
        }

        sprites.draw(ctx, name, x, y, s.facing < 0);
    }
}