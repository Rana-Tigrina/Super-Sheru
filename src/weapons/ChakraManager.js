/* src/weapons/ChakraManager.js — throw policy + active-disc bookkeeping.
 * Spec §6: RUN must be held, max 2 airborne, 20-step cooldown.
 */

import { FP, PHYS, BTN } from '../core/constants.js';
import { Chakra } from './Chakra.js';

export class ChakraManager {
    constructor() {
        this.list = [];
        this.cooldown = 0;
    }

    reset() {
        this.list.length = 0;
        this.cooldown = 0;
    }

    /** player: Player shell. throwPressed: rising edge of the THROW bit. */
    tryThrow(player, bits, throwPressed, ev) {
        if (!throwPressed) return false;
        if (!(bits & BTN.RUN)) return false;          // chakra only while running
        if (this.cooldown > 0) return false;
        if (this.list.length >= PHYS.CHAKRA_MAX) return false;

        const s = player.s;
        const x = s.x + (s.facing > 0 ? FP.fromInt(s.w) : FP.fromInt(-8));
        const y = s.y + FP.fromInt(3);

        this.list.push(new Chakra(x, y, s.facing));
        this.cooldown = PHYS.CHAKRA_COOLDOWN;
        ev.throw = true;
        return true;
    }

    step(level, ev) {
        if (this.cooldown > 0) this.cooldown--;
        for (const c of this.list) c.step(level, ev);
        if (this.list.some((c) => !c.alive)) {
            this.list = this.list.filter((c) => c.alive);
        }
    }
}