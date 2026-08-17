/* src/ui/HUD.js — laddoo counter, seals, lives, boss health, chapter title.
 * Drawn LAST (after the color grade) so it stays crisp and ungraded.
 */

import { VIEW } from '../core/constants.js';

const INK = 'rgba(24,16,34,0.85)';
const CREAM = '#f5e6c8';
const GOLD = '#f2b632';

export class HUD {
    /**
     * hud = { sprites, laddoos, par, lives, step, muted, paused,
     *         title, land, titleTimer, seals, boss }
     */
    draw(ctx, hud) {
        const { sprites } = hud;

        /* laddoo counter */
        sprites.draw(ctx, 'laddoo', 8, 7);
        this._text(ctx, `${hud.laddoos}/${hud.par}`, 20, 14, CREAM);

        /* 3 Ancient Seals of Bharat */
        const seals = hud.seals || [false, false, false];
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.fillStyle = seals[i] ? GOLD : 'rgba(143,132,168,0.4)';
            ctx.strokeStyle = INK;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(80 + i * 11, 11, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        /* lives (mini Sheru heads, right edge) */
        const head = sprites.get('sheru.idle');
        if (head) {
            for (let i = 0; i < hud.lives; i++) {
                ctx.drawImage(head, 0, 0, 16, 16, VIEW.W - 18 - i * 13, 6, 11, 11);
            }
        }

        /* Boss Health Bar */
        if (hud.boss && hud.boss.alive) {
            const barW = 120;
            const barH = 7;
            const barX = (VIEW.W - barW) / 2;
            const barY = 18;

            ctx.save();
            // Boss Title
            this._text(ctx, `${hud.boss.name.toUpperCase()} — ${hud.boss.title}`, VIEW.W / 2, 14, GOLD, 'center');

            // Bar background & border
            ctx.fillStyle = INK;
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
            ctx.fillStyle = '#8f4a2a'; // dark red/brown
            ctx.fillRect(barX, barY, barW, barH);

            // Segments
            const hpRatio = Math.max(0, hud.boss.hp / hud.boss.maxHp);
            ctx.fillStyle = '#ffd94a'; // gold
            ctx.fillRect(barX, barY, barW * hpRatio, barH);
            ctx.restore();
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