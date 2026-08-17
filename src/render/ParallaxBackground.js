/* src/render/ParallaxBackground.js — Multi-layer Indian landmark backgrounds.
 * ────────────────────────────────────────────────────────────────────────────
 * Implements 5-layer parallax scrolling per chapter:
 *   Layer 0: Gradient Sky + Sun/Moon (0.0x scroll)
 *   Layer 1: Distant Mountains/City Horizon (0.15x scroll)
 *   Layer 2: Iconic Landmark (0.35x scroll)
 *   Layer 3: Foreground Ambience (0.65x scroll)
 *   Layer 4: Playfield (1.0x scroll - handled by GameScene)
 *   Layer 5: Weather & Light Particles (overlay)
 */

import { VIEW, FP } from '../core/constants.js';
import { gradeFor } from './RagaGrades.js';

const W = VIEW.W;
const H = VIEW.H;

/** Chapter landmark definitions with parallax layers. */
export const CHAPTER_BACKGROUNDS = {
    ch1_01: {
        name: 'Punjab · Sarson Fields',
        grade: 'dawn',
        sky: { top: [43, 29, 74], bottom: [255, 182, 50] },
        sun: { x: 420, y: 208, r: 32, color: [255, 220, 140] },
        layers: {
            distant: { type: 'mountains', color: '#2d1a4a', scroll: 0.15 },
            landmark: { type: 'goldenTemple', scroll: 0.35 },
            foreground: { type: 'mustardFields', scroll: 0.65 },
        },
        weather: 'petals',
        landmarks: ['harmandirSahib', 'tubeWell', 'dhaba'],
    },
    ch2_01: {
        name: 'Jaipur · Pink City',
        grade: 'dusk',
        sky: { top: [68, 26, 50], bottom: [234, 102, 70] },
        sun: { x: 92, y: 202, r: 34, color: [255, 160, 120] },
        layers: {
            distant: { type: 'desertHills', color: '#4a2a1a', scroll: 0.15 },
            landmark: { type: 'hawaMahal', scroll: 0.35 },
            foreground: { type: 'pinkArches', scroll: 0.65 },
        },
        weather: 'dust',
        landmarks: ['hawaMahal', 'amberFort', 'brassLanterns'],
    },
    ch3_01: {
        name: 'Mumbai · Monsoon Docks',
        grade: 'storm',
        sky: { top: [15, 25, 45], bottom: [60, 100, 110] },
        sun: null,
        layers: {
            distant: { type: 'seaLink', color: '#1a2a3a', scroll: 0.15 },
            landmark: { type: 'gatewayOfIndia', scroll: 0.35 },
            foreground: { type: 'neonHoards', scroll: 0.65 },
        },
        weather: 'rain',
        landmarks: ['gateway', 'seaLink', 'localTrain'],
    },
    ch4_01: {
        name: 'Kashi · Varanasi Ghats',
        grade: 'aarti',
        sky: { top: [35, 12, 40], bottom: [234, 110, 30] },
        sun: { x: 256, y: 192, r: 38, color: [255, 180, 70] },
        layers: {
            distant: { type: 'templeSpires', color: '#3a1a2a', scroll: 0.15 },
            landmark: { type: 'ghats', scroll: 0.35 },
            foreground: { type: 'dhuniFires', scroll: 0.65 },
        },
        weather: 'embers',
        landmarks: ['ghatSteps', 'diyas', 'templeBells'],
    },
    ch5_01: {
        name: 'Assam · Tea Gardens',
        grade: 'mist',
        sky: { top: [80, 100, 86], bottom: [196, 210, 190] },
        sun: null,
        layers: {
            distant: { type: 'kazirangaHills', color: '#2a4a3a', scroll: 0.15 },
            landmark: { type: 'teaEstates', scroll: 0.35 },
            foreground: { type: 'bambooMachan', scroll: 0.65 },
        },
        weather: 'mist',
        landmarks: ['teaTerraces', 'hornbills', 'morningFog'],
    },
    ch6_01: {
        name: 'Hampi · Deccan Stones',
        grade: 'stone',
        sky: { top: [120, 86, 52], bottom: [246, 216, 154] },
        sun: { x: 402, y: 66, r: 28, color: [255, 245, 210] },
        layers: {
            distant: { type: 'boulderMonoliths', color: '#5a4a3a', scroll: 0.15 },
            landmark: { type: 'stoneChariot', scroll: 0.35 },
            foreground: { type: 'granitePillars', scroll: 0.65 },
        },
        weather: null,
        landmarks: ['vittalaChariot', 'virupakshaGopuram', 'sunFlare'],
    },
    ch7_01: {
        name: 'Himalaya · Snowline',
        grade: 'snow',
        sky: { top: [12, 12, 40], bottom: [110, 130, 190] },
        sun: { x: 430, y: 58, r: 22, color: [210, 220, 240] },
        layers: {
            distant: { type: 'nandaDevi', color: '#1a2a4a', scroll: 0.15 },
            landmark: { type: 'monastery', scroll: 0.35 },
            foreground: { type: 'prayerFlags', scroll: 0.65 },
        },
        weather: 'snow',
        landmarks: ['trishulPeak', 'gompas', 'prayerFlags'],
    },
    ch8_01: {
        name: 'Kanyakumari · Sun Coast',
        grade: 'sunrise',
        sky: { top: [180, 64, 34], bottom: [255, 230, 130] },
        sun: { x: 256, y: 168, r: 46, color: [255, 240, 150] },
        layers: {
            distant: { type: 'oceanHorizon', color: '#2a4a5a', scroll: 0.15 },
            landmark: { type: 'vivekanandaRock', scroll: 0.35 },
            foreground: { type: 'palmSilhouettes', scroll: 0.65 },
        },
        weather: 'spray',
        landmarks: ['rockMemorial', 'thiruvalluvarStatue', 'sunriseGlow'],
    },
};

/** Deterministic particle system for weather effects. */
class WeatherParticles {
    constructor(type, count = 42) {
        this.type = type;
        this.count = count;
        this.seed = 12345; // deterministic seed
    }

    draw(ctx, step, width = W, height = H) {
        const kind = this.type;
        if (!kind) return;

        switch (kind) {
            case 'rain': {
                ctx.strokeStyle = 'rgba(200,220,240,0.35)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i < this.count; i++) {
                    const x = ((i * 97 + step * 7) % (width + 40)) - 20;
                    const y = ((i * 61 + step * 13) % (height + 24)) - 12;
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - 3, y + 10);
                }
                ctx.stroke();
                break;
            }
            case 'snow': {
                ctx.fillStyle = 'rgba(248,244,236,0.85)';
                for (let i = 0; i < this.count; i++) {
                    const y = ((i * 53 + step * (1 + (i % 2))) % (height + 8)) - 4;
                    const sway = FP.toInt(FP.mul(FP.fromInt(6), FP.sin((step + i * 17) & 255)));
                    const x = ((i * 89 + (step >> 1)) % (width + 16)) - 8;
                    ctx.fillRect(x + sway, y, 2, 2);
                }
                break;
            }
            case 'embers': {
                ctx.fillStyle = 'rgba(255,178,60,0.7)';
                for (let i = 0; i < (this.count >> 1); i++) {
                    const y = height - ((i * 67 + step * 2) % (height + 24));
                    const sway = FP.toInt(FP.mul(FP.fromInt(8), FP.sin((step + i * 29) & 255)));
                    const x = ((i * 113) % width) + sway;
                    ctx.fillRect(x, y, 1, 2);
                }
                break;
            }
            case 'petals': {
                ctx.fillStyle = 'rgba(242,182,50,0.65)';
                for (let i = 0; i < (this.count >> 1); i++) {
                    const y = ((i * 71 + step) % (height + 16)) - 8;
                    const sway = FP.toInt(FP.mul(FP.fromInt(10), FP.sin((step + i * 23) & 255)));
                    const x = ((i * 101 + (step >> 1)) % (width + 24)) - 12;
                    ctx.fillRect(x + sway, y, 2, 2);
                }
                break;
            }
            case 'dust': {
                ctx.fillStyle = 'rgba(216,176,120,0.4)';
                for (let i = 0; i < (this.count >> 1); i++) {
                    const x = ((i * 107 + step) % (width + 20)) - 10;
                    const y = (i * 67) % height;
                    ctx.fillRect(x, y, 2, 1);
                }
                break;
            }
            case 'mist': {
                ctx.fillStyle = 'rgba(230,236,228,0.16)';
                for (let b = 0; b < 3; b++) {
                    const drift = ((step * (b + 1)) % (width + 160)) - 160;
                    ctx.fillRect(drift, 96 + b * 64, 320, 18);
                }
                break;
            }
            case 'spray': {
                ctx.fillStyle = 'rgba(248,244,236,0.5)';
                for (let i = 0; i < (this.count >> 2); i++) {
                    const t = (i * 57 + step * 3) % 90;
                    const x = (i * 131) % width;
                    const y = height - 6 - ((t * t) >> 4) % 40;
                    ctx.fillRect(x, y, 1, 1);
                }
                break;
            }
        }
    }
}

/** Parallax layer renderer for each chapter. */
export class ParallaxBackground {
    constructor(chapterId) {
        this.chapterId = chapterId;
        this.config = CHAPTER_BACKGROUNDS[chapterId] ||
            CHAPTER_BACKGROUNDS[chapterId?.replace('_bonus', '_01')] ||
            CHAPTER_BACKGROUNDS.ch1_01;
        this.skyCanvas = document.createElement('canvas');
        this.skyCanvas.width = W;
        this.skyCanvas.height = H;
        this.landmarkCanvas = document.createElement('canvas');
        this.landmarkCanvas.width = W * 2;
        this.landmarkCanvas.height = H;
        this.foregroundCanvas = document.createElement('canvas');
        this.foregroundCanvas.width = W * 2;
        this.foregroundCanvas.height = H;
        this.weather = new WeatherParticles(this.config.weather);
        
        this._buildSky();
        this._buildLandmarks();
        this._buildForeground();
    }

    _rgb(c, a = 1) {
        return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    }

    _buildSky() {
        const ctx = this.skyCanvas.getContext('2d');
        const { sky, sun } = this.config;
        
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, this._rgb(sky.top));
        grad.addColorStop(1, this._rgb(sky.bottom));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        
        if (sun) {
            const rg = ctx.createRadialGradient(sun.x, sun.y, 2, sun.x, sun.y, sun.r);
            rg.addColorStop(0, this._rgb(sun.color, 0.9));
            rg.addColorStop(1, this._rgb(sun.color, 0));
            ctx.fillStyle = rg;
            ctx.fillRect(sun.x - sun.r, sun.y - sun.r, sun.r * 2, sun.r * 2);
        }
    }

    _buildLandmarks() {
        const ctx = this.landmarkCanvas.getContext('2d');
        const type = this.config.layers.landmark.type;
        
        // Draw landmark silhouettes based on chapter
        this._drawLandmark(ctx, type, 0, 0);
        this._drawLandmark(ctx, type, W, 0); // Repeat for seamless scroll
    }

    _drawLandmark(ctx, type, offsetX, offsetY) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        switch (type) {
            case 'goldenTemple':
                // Harmandir Sahib silhouette with dome
                ctx.fillStyle = '#f2b632';
                ctx.beginPath();
                ctx.moveTo(50, H - 40);
                ctx.lineTo(80, H - 100);
                ctx.arc(100, H - 100, 20, Math.PI, 0);
                ctx.lineTo(130, H - 40);
                ctx.fill();
                ctx.fillStyle = '#ffd94a';
                ctx.beginPath();
                ctx.arc(100, H - 110, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'hawaMahal':
                // Palace of Winds with jharokhas
                ctx.fillStyle = '#e85a7a';
                for (let i = 0; i < 5; i++) {
                    const x = 40 + i * 24;
                    ctx.fillRect(x, H - 80, 18, 60);
                    ctx.fillStyle = '#f08aa0';
                    for (let j = 0; j < 3; j++) {
                        ctx.fillRect(x + 3, H - 75 + j * 18, 12, 12);
                    }
                    ctx.fillStyle = '#e85a7a';
                }
                break;
                
            case 'gatewayOfIndia':
                // Gateway arch silhouette
                ctx.fillStyle = '#e0c088';
                ctx.beginPath();
                ctx.moveTo(60, H - 20);
                ctx.lineTo(60, H - 100);
                ctx.quadraticCurveTo(100, H - 140, 140, H - 100);
                ctx.lineTo(140, H - 20);
                ctx.fill();
                ctx.fillStyle = '#f5e6c8';
                ctx.fillRect(90, H - 90, 20, 70);
                break;
                
            case 'ghats':
                // Ganga ghat steps
                ctx.fillStyle = '#b56a3c';
                for (let i = 0; i < 8; i++) {
                    const y = H - 30 - i * 8;
                    const w = 120 - i * 10;
                    ctx.fillRect(40 + i * 5, y, w, 4);
                }
                // Temple spire
                ctx.fillStyle = '#ff8c28';
                ctx.beginPath();
                ctx.moveTo(180, H - 40);
                ctx.lineTo(190, H - 90);
                ctx.lineTo(200, H - 40);
                ctx.fill();
                break;
                
            case 'teaEstates':
                // Terraced tea gardens
                ctx.fillStyle = '#6fb54a';
                for (let i = 0; i < 6; i++) {
                    const y = H - 40 - i * 12;
                    ctx.fillRect(30 + i * 15, y, 100, 6);
                }
                ctx.fillStyle = '#1a5c2e';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(50 + i * 20, H - 50, 8, 20);
                }
                break;
                
            case 'stoneChariot':
                // Vittala stone chariot
                ctx.fillStyle = '#e0c088';
                ctx.fillRect(50, H - 60, 80, 40);
                ctx.fillStyle = '#f5e6c8';
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(65 + i * 18, H - 15, 10, Math.PI, 0);
                    ctx.fill();
                }
                break;
                
            case 'monastery':
                // Buddhist Gompa
                ctx.fillStyle = '#a82836';
                ctx.fillRect(60, H - 70, 60, 50);
                ctx.fillStyle = '#f2b632';
                ctx.beginPath();
                ctx.moveTo(70, H - 70);
                ctx.lineTo(90, H - 100);
                ctx.lineTo(110, H - 70);
                ctx.fill();
                // Prayer flags
                ctx.strokeStyle = '#e85a7a';
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(50, H - 50 - i * 8);
                    ctx.lineTo(130, H - 50 - i * 8);
                    ctx.stroke();
                }
                break;
                
            case 'vivekanandaRock':
                // Rock memorial silhouette
                ctx.fillStyle = '#8f4a2a';
                ctx.beginPath();
                ctx.moveTo(40, H - 20);
                ctx.lineTo(60, H - 80);
                ctx.lineTo(100, H - 90);
                ctx.lineTo(140, H - 70);
                ctx.lineTo(160, H - 20);
                ctx.fill();
                ctx.fillStyle = '#f2b632';
                ctx.fillRect(85, H - 85, 30, 15);
                break;
        }
        
        ctx.restore();
    }

    _buildForeground() {
        const ctx = this.foregroundCanvas.getContext('2d');
        const type = this.config.layers.foreground.type;
        
        this._drawForeground(ctx, type, 0, 0);
        this._drawForeground(ctx, type, W, 0);
    }

    _drawForeground(ctx, type, offsetX, offsetY) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        switch (type) {
            case 'mustardFields':
                // Floating mustard petals
                ctx.fillStyle = '#ffb632';
                for (let i = 0; i < 20; i++) {
                    ctx.fillRect(i * 30, H - 10 - (i % 5) * 8, 3, 3);
                }
                break;
                
            case 'pinkArches':
                // Terracotta archways
                ctx.fillStyle = '#e85a7a';
                for (let i = 0; i < 4; i++) {
                    const x = 30 + i * 35;
                    ctx.beginPath();
                    ctx.arc(x + 15, H - 20, 15, Math.PI, 0);
                    ctx.fill();
                }
                break;
                
            case 'neonHoards':
                // Neon city hoardings
                ctx.fillStyle = '#007a8f';
                ctx.fillRect(20, H - 50, 40, 30);
                ctx.fillStyle = '#ff8c28';
                ctx.fillRect(80, H - 60, 50, 40);
                ctx.fillStyle = '#e85a7a';
                ctx.fillRect(150, H - 45, 35, 25);
                break;
                
            case 'dhuniFires':
                // Sacred fire embers
                ctx.fillStyle = '#ffd94a';
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    ctx.arc(40 + i * 15, H - 5 - (i % 3) * 4, 3 + (i % 2), 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'bambooMachan':
                // Bamboo watchtower
                ctx.fillStyle = '#9fad3b';
                ctx.fillRect(50, H - 60, 6, 60);
                ctx.fillRect(80, H - 60, 6, 60);
                ctx.fillRect(50, H - 60, 36, 4);
                break;
                
            case 'granitePillars':
                // Carved stone pillars
                ctx.fillStyle = '#8f84a8';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(40 + i * 40, H - 80, 12, 80);
                }
                break;
                
            case 'prayerFlags':
                // Fluttering Tibetan flags
                const colors = ['#e85a7a', '#f2b632', '#6fb54a', '#4a8fd9', '#a82836'];
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = colors[i];
                    ctx.fillRect(20 + i * 25, H - 40 - (i % 3) * 10, 20, 12);
                }
                break;
                
            case 'palmSilhouettes':
                // Palm tree silhouettes
                ctx.fillStyle = '#1a2a3a';
                for (let i = 0; i < 3; i++) {
                    const x = 50 + i * 50;
                    ctx.fillRect(x, H - 70, 4, 70);
                    ctx.beginPath();
                    ctx.arc(x + 2, H - 75, 20, Math.PI, 0);
                    ctx.fill();
                }
                break;
        }
        
        ctx.restore();
    }

    /** Layer 0: Sky (0.00x) */
    drawSky(ctx, camX = 0, step = 0) {
        ctx.drawImage(this.skyCanvas, 0, 0);
    }

    /** Layer 1: Distant mountains/horizon (0.15x) */
    drawDistant(ctx, camX = 0, step = 0) {
        if (!this.config.layers.distant) return;
        const distantX = -(camX * 0.15) % W;
        ctx.fillStyle = this.config.layers.distant.color;
        this._drawDistantMountains(ctx, distantX, H - 60);
        this._drawDistantMountains(ctx, distantX + W, H - 60);
        this._drawDistantMountains(ctx, distantX - W, H - 60);
    }

    /** Layer 2: Landmark (0.35x) */
    drawLandmarks(ctx, camX = 0, step = 0) {
        const landmarkX = -(camX * 0.35) % W;
        ctx.drawImage(this.landmarkCanvas, landmarkX, 0);
        ctx.drawImage(this.landmarkCanvas, landmarkX + W, 0);
        ctx.drawImage(this.landmarkCanvas, landmarkX - W, 0);
    }

    /** Layer 3: Foreground ambience (0.65x) */
    drawForeground(ctx, camX = 0, step = 0) {
        const fgX = -(camX * 0.65) % W;
        ctx.drawImage(this.foregroundCanvas, fgX, 0);
        ctx.drawImage(this.foregroundCanvas, fgX + W, 0);
        ctx.drawImage(this.foregroundCanvas, fgX - W, 0);
    }

    /** Layer 5: Weather particles */
    drawWeather(ctx, step = 0) {
        this.weather.draw(ctx, step);
    }

    /** Draw all parallax layers at once. */
    draw(ctx, camX, step) {
        this.drawSky(ctx, camX, step);
        this.drawDistant(ctx, camX, step);
        this.drawLandmarks(ctx, camX, step);
        this.drawForeground(ctx, camX, step);
        this.drawWeather(ctx, step);
    }

    _drawDistantMountains(ctx, offsetX, baseY) {
        ctx.save();
        ctx.translate(offsetX, 0);
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= W; x += 20) {
            const y = baseY - 20 - Math.sin(x * 0.1) * 15 - Math.cos(x * 0.05) * 10;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, baseY);
        ctx.fill();
        ctx.restore();
    }

    /** Get weather type for this chapter. */
    getWeatherType() {
        return this.config.weather;
    }
}
