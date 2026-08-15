/* src/audio/TablaSynth.js — theka cycles, synthesized bols.
 * Bayan (bass): pitched sine drop. Dayan (treble): resonant noise + tone.
 * Which bols fire is fully determined by level meta (tala + tempo).
 */

export const TALA_TABLE = {
    /* 16 matras — teentaal */
    'teentaal': {
        matras: 16, vibhag: [4, 4, 4, 4],
        bols: ['dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha',
            'dha', 'tin', 'tin', 'ta', 'ta', 'dhin', 'dhin', 'dha'],
    },
    /* 10 matras — jhaptal */
    'jhaptal': {
        matras: 10, vibhag: [2, 3, 2, 3],
        bols: ['dhi', 'na', 'dhi', 'dhi', 'na', 'ti', 'na', 'dhi', 'dhi', 'na'],
    },
    /* 8 matras — adi */
    'adi': {
        matras: 8, vibhag: [4, 2, 2],
        bols: ['dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'ta'],
    },
    /* 7 matras — rupak */
    'rupak': {
        matras: 7, vibhag: [3, 2, 2],
        bols: ['tin', 'tin', 'na', 'dhi', 'na', 'dhi', 'na'],
    },
    /* 8 matras — kaherwa */
    'kaherwa': {
        matras: 8, vibhag: [4, 4],
        bols: ['dha', 'ge', 'na', 'ti', 'na', 'ke', 'dhi', 'na'],
    },
    /* 6 matras — dadra */
    'dadra': {
        matras: 6, vibhag: [3, 3],
        bols: ['dha', 'dhin', 'na', 'dha', 'tin', 'na'],
    },
    /* 9 matras — chartal ki sawari (odd gait for the snow chapter) */
    'chartal-ki-sawari': {
        matras: 9, vibhag: [3, 3, 3],
        bols: ['dha', 'dhi', 'ta', 'dhi', 'ta', 'dha', 'tin', 'ta', 'dha'],
    },
    /* 12 matras — chautal (finale weight) */
    'chautal': {
        matras: 12, vibhag: [4, 4, 4],
        bols: ['dha', 'dha', 'din', 'ta', 'tin', 'ta', 'dha', 'dha', 'din', 'ta', 'tin', 'ta'],
    },
};

const BASS_BOLS = new Set(['dha', 'dhin', 'dhi', 'din', 'ge']);
const TREBLE_BOLS = new Set(['ta', 'tin', 'na', 'ti', 'ke', 'dha', 'dhin', 'dhi', 'din']);

const LOOKAHEAD_S = 0.25;
const TIMER_MS = 90;

export class TablaSynth {
    constructor(engine, meta) {
        this.e = engine;
        this.tala = TALA_TABLE[meta.tala] ?? TALA_TABLE['teentaal'];
        this.beatSec = 60 / (meta.tempo || 96);
        this.matra = 0;
        this.nextTime = 0;
        this.timer = null;
    }

    start() {
        this.nextTime = this.e.now() + 0.12;
        this.timer = setInterval(() => this._scheduleAhead(), TIMER_MS);
    }

    stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }

    _scheduleAhead() {
        while (this.nextTime < this.e.now() + LOOKAHEAD_S) {
            const bol = this.tala.bols[this.matra % this.tala.matras];
            this._playBol(bol, this.nextTime);
            this.nextTime += this.beatSec;
            this.matra += 1;
        }
    }

    _playBol(bol, t) {
        if (BASS_BOLS.has(bol)) this._bayan(t, bol === 'ge' ? 0.9 : 1.0);
        if (TREBLE_BOLS.has(bol)) this._dayan(t, bol);
    }

    /* bayan — the bass drum: pitch drop 170 → 55 Hz */
    _bayan(t, vel) {
        const ctx = this.e.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(170, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.14);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        osc.connect(g).connect(this.e.musicBus);
        osc.start(t);
        osc.stop(t + 0.26);
    }

    /* dayan — the treble drum: resonant tick + filtered noise */
    _dayan(t, bol) {
        const ctx = this.e.ctx;
        const ring = (bol === 'tin' || bol === 'dhin' || bol === 'din' || bol === 'dhi') ? 620 : 480;
        const dur = (bol === 'tin') ? 0.30 : 0.09;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(ring * 1.3, t);
        osc.frequency.exponentialRampToValueAtTime(ring, t + 0.02);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(g).connect(this.e.musicBus);
        osc.start(t);
        osc.stop(t + dur + 0.05);

        // skin slap — short noise burst
        const n = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1800;
        bp.Q.value = 1.2;

        const ng = ctx.createGain();
        ng.gain.value = (bol === 'ke' || bol === 'ti') ? 0.30 : 0.16;

        src.connect(bp).connect(ng).connect(this.e.musicBus);
        src.start(t);
    }
}