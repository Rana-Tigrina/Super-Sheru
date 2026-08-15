/* src/render/ColorGradePipeline.js — per-chapter sky + weather + grade.
 * Sky & vignette are pre-rendered once per grade into offscreen canvases;
 * weather particles are positioned with pure integer math of the step clock
 * → deterministic visuals, zero per-frame gradient cost (spec §9).
 */

import { VIEW, FP } from '../core/constants.js';
import { gradeFor } from './RagaGrades.js';

const W = VIEW.W;
const H = VIEW.H;
const N = 42;                       // weather particle count

export class ColorGradePipeline {
    constructor() {
        this.grade = null;
        this.skyCanvas = null;
        this.vignetteCanvas = null;
        this.setGrade('dawn');
    }

    setGrade(name) {
        this.grade = gradeFor(name);
        this._buildSky();
        this._buildVignette();
    }

    _rgb(c, a = 1) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

    _buildSky() {
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const g = cv.getContext('2d');

        const grad = g.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, this._rgb(this.grade.skyTop));
        grad.addColorStop(1, this._rgb(this.grade.skyBottom));
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);

        if (this.grade.sun) {
            const [sx, sy, sr, sc] = this.grade.sun;
            const rg = g.createRadialGradient(sx, sy, 2, sx, sy, sr);
            rg.addColorStop(0, this._rgb(sc, 0.9));
            rg.addColorStop(1, this._rgb(sc, 0));
            g.fillStyle = rg;
            g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
        }
        this.skyCanvas = cv;
    }

    _buildVignette() {
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const g = cv.getContext('2d');
        const rad = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.98);
        rad.addColorStop(0, 'rgba(8,6,12,0)');
        rad.addColorStop(1, `rgba(8,6,12,${this.grade.vignette})`);
        g.fillStyle = rad;
        g.fillRect(0, 0, W, H);
        this.vignetteCanvas = cv;
    }

    /** Draw behind the world. */
    drawSky(ctx) {
        ctx.drawImage(this.skyCanvas, 0, 0);
    }

    /** Deterministic weather, drawn above the world, below the grade tint. */
    drawWeather(ctx, step) {
        const kind = this.grade.weather;
        if (!kind) return;

        switch (kind) {
            case 'rain': {
                ctx.strokeStyle = 'rgba(200,220,240,0.35)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i < N; i++) {
                    const x = ((i * 97 + step * 7) % (W + 40)) - 20;
                    const y = ((i * 61 + step * 13) % (H + 24)) - 12;
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - 3, y + 10);
                }
                ctx.stroke();
                break;
            }
            case 'snow': {
                ctx.fillStyle = 'rgba(248,244,236,0.85)';
                for (let i = 0; i < N; i++) {
                    const y = ((i * 53 + step * (1 + (i % 2))) % (H + 8)) - 4;
                    const sway = FP.toInt(FP.mul(FP.fromInt(6), FP.sin((step + i * 17) & 255)));
                    const x = ((i * 89 + (step >> 1)) % (W + 16)) - 8;
                    ctx.fillRect(x + sway, y, 2, 2);
                }
                break;
            }
            case 'embers': {
                ctx.fillStyle = 'rgba(255,178,60,0.7)';
                for (let i = 0; i < (N >> 1); i++) {
                    const y = H - ((i * 67 + step * 2) % (H + 24));
                    const sway = FP.toInt(FP.mul(FP.fromInt(8), FP.sin((step + i * 29) & 255)));
                    const x = ((i * 113) % W) + sway;
                    ctx.fillRect(x, y, 1, 2);
                }
                break;
            }
            case 'petals': {
                ctx.fillStyle = 'rgba(242,182,50,0.65)';
                for (let i = 0; i < (N >> 1); i++) {
                    const y = ((i * 71 + step) % (H + 16)) - 8;
                    const sway = FP.toInt(FP.mul(FP.fromInt(10), FP.sin((step + i * 23) & 255)));
                    const x = ((i * 101 + (step >> 1)) % (W + 24)) - 12;
                    ctx.fillRect(x + sway, y, 2, 2);
                }
                break;
            }
            case 'dust': {
                ctx.fillStyle = 'rgba(216,176,120,0.4)';
                for (let i = 0; i < (N >> 1); i++) {
                    const x = ((i * 107 + step) % (W + 20)) - 10;
                    const y = (i * 67) % H;
                    ctx.fillRect(x, y, 2, 1);
                }
                break;
            }
            case 'mist': {
                ctx.fillStyle = 'rgba(230,236,228,0.16)';
                for (let b = 0; b < 3; b++) {
                    const drift = ((step * (b + 1)) % (W + 160)) - 160;
                    ctx.fillRect(drift, 96 + b * 64, 320, 18);
                }
                break;
            }
            case 'spray': {
                ctx.fillStyle = 'rgba(248,244,236,0.5)';
                for (let i = 0; i < (N >> 2); i++) {
                    const t = (i * 57 + step * 3) % 90;
                    const x = (i * 131) % W;
                    const y = H - 6 - ((t * t) >> 4) % 40;
                    ctx.fillRect(x, y, 1, 1);
                }
                break;
            }
        }
    }

    /** Final pass after the world: raga tint + vignette. */
    apply(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.grade.mode;
        ctx.fillStyle = this._rgb(this.grade.tint, this.grade.tintAlpha);
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        ctx.drawImage(this.vignetteCanvas, 0, 0);
    }
}