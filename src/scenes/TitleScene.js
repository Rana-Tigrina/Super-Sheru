/* src/scenes/TitleScene.js — सुपर शेरू title screen (matches the reference
 * poster: eight chapters, controls legend, GRD footer).
 */

import { VIEW, ENGINE_VERSION } from '../core/constants.js';
import { SpriteFactory } from '../art/SpriteFactory.js';
import { ColorGradePipeline } from '../render/ColorGradePipeline.js';

const GOLD = '#f2b632';
const CREAM = '#f5e6c8';
const INK = 'rgba(24,16,34,0.9)';

export class TitleScene {
    constructor(app) {
        this.app = app;
        this.id = 'title';
        this.t = 0;
    }

    enter() {
        if (!this.app.sprites) this.app.sprites = new SpriteFactory();
        if (!this.app.grade) this.app.grade = new ColorGradePipeline();
        this.app.grade.setGrade('dawn');
        this.app.audio?.startMusic({ raga: 'bhairav', grade: 'dawn', tempo: 76, tala: 'teentaal' });
    }

    exit() { this.app.audio?.stopMusic(); }

    step() { this.t++; }

    _text(ctx, str, x, y, size, color, align = 'center') {
        ctx.font = `${size}px "Courier New", monospace`;
        ctx.textAlign = align;
        ctx.fillStyle = INK;
        ctx.fillText(str, x + 1, y + 1);
        ctx.fillStyle = color;
        ctx.fillText(str, x, y);
    }

    render(ctx) {
        const W = VIEW.W, H = VIEW.H;
        this.app.grade.drawSky(ctx);

        /* ground strip */
        const sp = this.app.sprites;
        for (let i = 0; i < W / 16; i++) sp.draw(ctx, 'tile.ground', i * 16, H - 32);

        /* hero, gently bobbing */
        const bob = Math.round(Math.sin(this.t * 0.06) * 3);
        const sheru = sp.get('sheru.idle');
        if (sheru) ctx.drawImage(sheru, 96, H - 64 + bob, 32, 32);
        sp.draw(ctx, 'laddoo', 140, H - 48 - bob);

        /* titles */
        this._text(ctx, 'सुपर शेरू', W / 2, 78, 42, GOLD);
        this._text(ctx, 'SUPER SHERU BROS · आठ अध्याय', W / 2, 102, 12, CREAM);
        this._text(ctx, 'An Indian Platform Quest — Eight lands of Bharat', W / 2, 120, 9, CREAM);
        this._text(ctx, 'every chapter machine-verified winnable before you play it', W / 2, 133, 8, 'rgba(245,230,200,0.7)');
        this._text(ctx, '✦ ✦ ✦ ✦', W / 2, 150, 10, GOLD);

        /* controls legend (verbatim from the poster) */
        const lines = [
            '← → / A D   move        Space / ↑ / Z   jump (hold = higher)',
            'Shift / X   run · throw chakra        P pause · M mute · R restart',
            'touch: ◀ ▶ B A          Enter start',
        ];
        lines.forEach((l, i) => this._text(ctx, l, W / 2, 176 + i * 13, 8, CREAM));

        /* blink */
        if ((this.t % 64) < 42) {
            this._text(ctx, 'PRESS ENTER', W / 2, 232, 12, GOLD);
        }

        this._text(
            ctx,
            `GRD v${ENGINE_VERSION} build · fixed-step physics · module-proven levels · ghost-tested 8/8 · raga & tabla synthesized live`,
            W / 2, H - 8, 7, 'rgba(245,230,200,0.55)',
        );

        this.app.grade.apply(ctx);
    }
}