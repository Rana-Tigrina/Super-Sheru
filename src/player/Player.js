/* src/player/Player.js — the Sheru shell: owns state, wraps pure logic,
 * and knows how to draw itself. All sim state lives in this.s (FP units).
 */

import { FP, P_STATE } from '../core/constants.js';
import {
    createPlayerState, stepPlayer,
    damagePlayer, applyStompBounce, setCheckpoint, winLevel,
} from './PlayerLogic.js';

export class Player {
    /** spawn: { x, y } in FP px (Level.spawnPoint / Checkpoint.spawn*). */
    constructor(spawn) {
        this.s = createPlayerState(spawn.x, spawn.y);
    }

    step(bits, level, ev) {
        stepPlayer(this.s, bits, level, ev);
    }

    /* thin delegations used by GameScene */
    damage(ev) { damagePlayer(this.s, ev); }
    stompBounce() { applyStompBounce(this.s); }
    setCheckpoint(x, y) { setCheckpoint(this.s, x, y); }
    win() { winLevel(this.s); }

    get dead() { return this.s.state === P_STATE.DEAD; }
    get won() { return this.s.state === P_STATE.WIN; }
    get boxFP() { const s = this.s; return { x: s.x, y: s.y, w: FP.fromInt(s.w), h: FP.fromInt(s.h) }; }

    draw(ctx, sprites, camX, camY, step) {
        const s = this.s;

        /* invulnerability blink */
        if (s.invuln > 0 && s.state !== P_STATE.DEAD && ((step >> 2) & 1)) return;

        let name;
        switch (s.state) {
            case P_STATE.JUMP:
            case P_STATE.FALL:
            case P_STATE.WIN:
                name = 'sheru.jump';
                break;
            case P_STATE.RUN:
            case P_STATE.SKID:
            case P_STATE.STOMP:
                name = ((step >> 3) & 1) ? 'sheru.run0' : 'sheru.run1';
                break;
            default:
                name = 'sheru.idle';
        }

        /* sprite is 16×16, hitbox is 10×14 → centre it */
        const x = FP.toInt(s.x) - camX - 3;
        const y = FP.toInt(s.y) - camY - 2;
        sprites.draw(ctx, name, x, y, s.facing < 0);
    }
}