/* src/scenes/EndingScene.js — समाप्त. The eight lands, one sunrise. */

import { VIEW, ENGINE_VERSION } from '../core/constants.js';
import { SpriteFactory } from '../art/SpriteFactory.js';
import { ColorGradePipeline } from '../render/ColorGradePipeline.js';

const GOLD = '#f2b632';
const CREAM = '#f5e6c8';
const INK = 'rgba(24,16,34,0.9)';

const LANDS = [
    ['Punjab · Sarson Fields', 'Bhairav'],
    ['Jaipur · Rose Gates', 'Yaman'],
    ['Mumbai · Monsoon Docks', 'Miyan ki Malhar'],
    ['Kashi · Ganga Ghats', 'Bhairavi'],
    ['Assam · Tea Gardens', 'Desh'],
    ['Hampi · Deccan Stones', 'Khamaj'],
    ['Himalaya · Snowline', 'Malkauns'],
    ['Kanyakumari · Sun Coast', 'Shankara'],
];

export class EndingScene {
    constructor(app) {
        this.app = app;
        this.id = 'ending';
        this.t = 0;
    }

    enter() {
        if (!this.app.sprites) this.app.sprites = new SpriteFactory();
        if (!this.app.grade) this.app.grade = new ColorGradePipeline();
        this.app.grade.setGrade('sunrise');
        this.app.audio?.stopMusic();
        this.app.audio?.sfx?.flag();
    }

    exit() { }
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

        const sp = this.app.sprites;
        if (sp) {
            for (let i = 0; i < W / 16; i++) sp.draw(ctx, 'tile.ground', i * 16, H - 32);
            sp.draw(ctx, 'flag', W - 96, H - 64);
            const sheru = sp.get('sheru.idle');
            if (sheru) ctx.drawImage(sheru, 72, H - 64, 32, 32);
        }

        this._text(ctx, 'समाप्त', W / 2, 52, 34, GOLD);
        this._text(ctx, 'THE EIGHT LANDS ARE SAFE · धन्यवाद', W / 2, 74, 10, CREAM);

        const reveal = Math.floor(this.t / 30);
        for (let i = 0; i < LANDS.length && i < reveal; i++) {
            this._text(ctx, `✦ ${LANDS[i][0]} — raga ${LANDS[i][1]}`, W / 2, 100 + i * 14, 8, CREAM);
        }

        if (this.t > 260 && (this.t % 64) < 42) {
            this._text(ctx, 'ENTER ↩ TITLE', W / 2, H - 44, 10, GOLD);
        }

        this._text(ctx, `GRD v${ENGINE_VERSION} · fixed-step physics · ghost-tested 8/8`, W / 2, H - 8, 7, 'rgba(245,230,200,0.5)');
        this.app.grade.apply(ctx);
    }
}