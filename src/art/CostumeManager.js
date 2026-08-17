/* src/art/CostumeManager.js — Cosmetic costumes and accessory overlays.
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 *   - Saffron Royal (Classic)
 *   - Maratha Peshwa (Crimson & Gold cape)
 *   - Himalayan Winter (Navy & Fur trim)
 *   - Strict palette compliance with locked colors
 */

import { COSTUMES } from '../data/ProgressionManager.js';

export class CostumeManager {
    /** Draw cosmetic costume accessory over Sheru's base sprite. */
    static drawAccessory(ctx, sprites, costumeId, x, y, facing = 1, isSuper = false, step = 0) {
        if (costumeId === COSTUMES.MARATHA) {
            // Peshwa crimson sash & gold shoulder guard
            ctx.save();
            ctx.fillStyle = '#a82836'; // crimson
            ctx.fillRect(x + (facing > 0 ? 3 : 7), y + (isSuper ? 6 : 4), 3, 5);
            ctx.fillStyle = '#ffd94a'; // gold flame
            ctx.fillRect(x + (facing > 0 ? 3 : 7), y + (isSuper ? 5 : 3), 4, 2);
            ctx.restore();
        } else if (costumeId === COSTUMES.HIMALAYAN) {
            // Himalayan winter navy cape with fur trim
            ctx.save();
            ctx.fillStyle = '#2d4a8f'; // indigo
            ctx.fillRect(x + (facing > 0 ? 1 : 9), y + (isSuper ? 7 : 5), 4, 7);
            ctx.fillStyle = '#faf6ef'; // white fur
            ctx.fillRect(x + (facing > 0 ? 2 : 8), y + (isSuper ? 6 : 4), 4, 2);
            ctx.restore();
        }
    }
}
