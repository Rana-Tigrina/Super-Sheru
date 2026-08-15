/* src/audio/RagaSynth.js — tanpura drone + raga melody, synthesized live.
 * One instance per chapter, driven by level meta: { raga, tempo }.
 * Note selection uses an integer hash of the beat index — stable forever,
 * and (per GRD) entirely decoupled from the simulation.
 */

export const RAGA_TABLE = {
    /* name                  scale (semitones from Sa)           vadi  base Hz  */
    'bhairav': { label: 'Bhairav', scale: [0, 1, 4, 5, 7, 8, 11, 12], vadi: 4, base: 146.83 }, // D3
    'yaman': { label: 'Yaman', scale: [0, 2, 4, 6, 7, 9, 11, 12], vadi: 7, base: 164.81 }, // E3
    'miyan-ki-malhar': { label: 'Miyan ki Malhar', scale: [0, 2, 5, 6, 7, 8, 11, 12], vadi: 7, base: 130.81 }, // C3
    'bhairavi': { label: 'Bhairavi', scale: [0, 1, 3, 5, 7, 8, 10, 12], vadi: 3, base: 146.83 }, // D3
    'desh': { label: 'Desh', scale: [0, 2, 4, 5, 7, 9, 10, 12], vadi: 7, base: 155.56 }, // Eb3
    'khamaj': { label: 'Khamaj', scale: [0, 4, 5, 7, 9, 10, 11, 12], vadi: 7, base: 164.81 }, // E3
    'malkauns': { label: 'Malkauns', scale: [0, 3, 5, 8, 10, 12], vadi: 5, base: 130.81 }, // C3
    'shankara': { label: 'Shankara', scale: [0, 2, 4, 7, 11, 12], vadi: 7, base: 174.61 }, // F3
};

const LOOKAHEAD_S = 0.30;   // schedule 300 ms ahead
const TIMER_MS = 100;    // scheduler tick

function beatHash(n) {
    let h = (Math.imul(n + 1, 0x9e3779b1) ^ 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
}

export class RagaSynth {
    constructor(engine, meta) {
        this.e = engine;
        this.raga = RAGA_TABLE[meta.raga] ?? RAGA_TABLE['bhairav'];
        this.beatSec = 60 / (meta.tempo || 96);
        this.beat = 0;
        this.nextTime = 0;
        this.timer = null;
        this.droneNodes = [];
        this.degree = this.raga.scale.indexOf(this.raga.vadi);
    }

    start() {
        this._startDrone();
        this.nextTime = this.e.now() + 0.1;
        this.timer = setInterval(() => this._scheduleAhead(), TIMER_MS);
    }

    stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        for (const n of this.droneNodes) {
            try { n.stop(); } catch { /* already stopped */ }
        }
        this.droneNodes = [];
    }

    /* ── tanpura-ish drone: Sa + Pa, slow shimmer ─────────────────────────── */
    _startDrone() {
        const ctx = this.e.ctx;
        const bus = this.e.musicBus;
        const base = this.raga.base;

        for (const [mult, vol] of [[1, 0.055], [1.5, 0.035], [2, 0.02]]) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = base * mult;

            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 700;

            const g = ctx.createGain();
            g.gain.value = vol;

            // slow tremolo — LFO on gain, audio-only
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 0.15 + mult * 0.05;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = vol * 0.4;
            lfo.connect(lfoGain).connect(g.gain);

            osc.connect(lp).connect(g).connect(bus);
            osc.start();
            lfo.start();
            this.droneNodes.push(osc, lfo);
        }
    }

    /* ── melody voice ─────────────────────────────────────────────────────── */
    _scheduleAhead() {
        while (this.nextTime < this.e.now() + LOOKAHEAD_S) {
            const h = beatHash(this.beat);

            if (h % 5 !== 0) {                              // occasional rest
                const hz = this._pickHz(h);
                const dur = (h % 7 === 0) ? this.beatSec * 1.9 : this.beatSec * 0.9;
                this._playNote(hz, this.nextTime, dur, 0.16);
                if (h % 9 === 0) {                            // grace note (gamak touch)
                    this._playNote(hz * 1.0595, this.nextTime - 0.05, 0.05, 0.08);
                }
            }
            this.nextTime += this.beatSec;
            this.beat += 1;
        }
    }

    _pickHz(h) {
        const scale = this.raga.scale;
        // random-walk around the vadi, octave jumps on strong beats
        const drift = ((h >>> 4) % 3) - 1;
        this.degree = ((this.degree + drift) % scale.length + scale.length) % scale.length;
        let semis = scale[this.degree];
        if (this.beat % 8 === 0) semis = this.raga.vadi;  // resolve to vadi each cycle
        if ((h >>> 12) % 6 === 0) semis += 12;            // occasional taar saptak
        return this.raga.base * Math.pow(2, semis / 12);
    }

    _playNote(hz, t, dur, vol) {
        const ctx = this.e.ctx;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(hz * 0.985, t);
        osc.frequency.linearRampToValueAtTime(hz, t + 0.04);   // gentle meend

        const osc2 = ctx.createOscillator();                    // slight detune shimmer
        osc2.type = 'sine';
        osc2.frequency.value = hz * 2.003;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
        g.gain.setValueAtTime(vol, t + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        const g2 = ctx.createGain();
        g2.gain.value = 0.25;

        osc.connect(g);
        osc2.connect(g2).connect(g);
        g.connect(this.e.musicBus);

        osc.start(t); osc.stop(t + dur + 0.05);
        osc2.start(t); osc2.stop(t + dur + 0.05);
    }
}