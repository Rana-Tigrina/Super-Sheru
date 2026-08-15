/* src/ui/HUD.js — laddoo counter, lives, chapter title, pause/mute badges.
 * Drawn LAST (after the color grade) so it stays crisp and ungraded.
 */

import { VIEW } from '../core/constants.js';

const INK = 'rgba(24,16,34,0.85)';
const CREAM = '#f5e6c8';
const GOLD = '#f2b632';

export class HUD {
    /**
     * hud = { sprites, laddoos, par, lives, step, muted, paused,
     *         title, land, titleTimer }
     */
    draw(ctx, hud) {
        const { sprites } = hud;

        /* laddoo counter */
        sprites.draw(ctx, 'laddoo', 8, 7);
        this._text(ctx, `${hud.laddoos}/${hud.par}`, 20, 14, CREAM);

        /* lives (mini Sheru heads, right edge) */
        const head = sprites.get('sheru.idle');
        if (head) {
            for (let i = 0; i < hud.lives; i++) {
                ctx.drawImage(head, 0, 0, 16, 16, VIEW.W - 18 - i * 13, 6, 11, 11);
            }
        }

        /* chapter title fade-in/out */
        if (hud.title && hud.titleTimer > 0) {
            const a = Math.min(1, hud.titleTimer / 40);
            this._text(ctx, `अध्याय ${hud.chapter ?? ''} · ${hud.title}`, VIEW.W / 2, 64, `rgba(242,182,50,${a})`, 'center');
            this._text(ctx, hud.land ?? '', VIEW.W / 2, 76, `rgba(245,230,200,${a * 0.8})`, 'center');
        }

        /* state badges */
        if (hud.muted) this._text(ctx, 'MUTED', VIEW.W - 8, VIEW.H - 8, GOLD, 'right');
        if (hud.paused) {
            ctx.fillStyle = 'rgba(13,10,20,0.55)';
            ctx.fillRect(0, 0, VIEW.W, VIEW.H);
            this._text(ctx, 'PAUSED', VIEW.W / 2, VIEW.H / 2 - 6, GOLD, 'center');
            this._text(ctx, 'P resume · M mute · R restart', VIEW.W / 2, VIEW.H / 2 + 8, CREAM, 'center');
        }
    }

    _text(ctx, str, x, y, color, align = 'left') {
        ctx.font = '8px "Courier New", monospace';
        ctx.textAlign = align;
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = INK;
        ctx.fillText(str, x + 1, y + 1);
        ctx.fillStyle = color;
        ctx.fillText(str, x, y);
    }
}