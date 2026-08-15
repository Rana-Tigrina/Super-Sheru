/* src/audio/SFX.js — one-shot game sounds. Every method is a no-op until
 * AudioEngine.unlock() has succeeded, so headless/silent runs are safe.
 */

export class SFX {
    constructor(engine) {
        this.e = engine;
    }

    /* ── tiny voice builders ──────────────────────────────────────────────── */
    _tone({ type = 'square', f0 = 440, f1 = f0, dur = 0.1, vol = 0.2, delay = 0 }) {
        if (!this.e.ready) return;
        const ctx = this.e.ctx;
        const t = ctx.currentTime + delay;

        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(f0, t);
        if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(g).connect(this.e.sfxBus);
        osc.start(t);
        osc.stop(t + dur + 0.03);
    }

    _noise({ dur = 0.1, vol = 0.2, freq = 1200, type = 'lowpass', delay = 0 }) {
        if (!this.e.ready) return;
        const ctx = this.e.ctx;
        const t = ctx.currentTime + delay;

        const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;

        const g = ctx.createGain();
        g.gain.value = vol;

        src.connect(f).connect(g).connect(this.e.sfxBus);
        src.start(t);
    }

    /* ── the game's vocabulary ────────────────────────────────────────────── */
    jump() {
        this._tone({ type: 'square', f0: 300, f1: 640, dur: 0.12, vol: 0.14 });
    }

    stomp() {
        this._noise({ dur: 0.07, vol: 0.3, freq: 900 });
        this._tone({ type: 'sine', f0: 180, f1: 65, dur: 0.12, vol: 0.3 });
    }

    laddoo() {
        this._tone({ type: 'sine', f0: 880, dur: 0.07, vol: 0.18 });
        this._tone({ type: 'sine', f0: 1318.5, dur: 0.1, vol: 0.18, delay: 0.06 });
    }

    chakra() {
        this._noise({ dur: 0.09, vol: 0.12, freq: 2400, type: 'highpass' });
        this._tone({ type: 'triangle', f0: 900, f1: 1500, dur: 0.11, vol: 0.1 });
    }

    hurt() {
        this._tone({ type: 'sawtooth', f0: 380, f1: 90, dur: 0.24, vol: 0.22 });
    }

    splash() {
        this._noise({ dur: 0.3, vol: 0.28, freq: 700 });
        this._tone({ type: 'sine', f0: 300, f1: 80, dur: 0.2, vol: 0.12 });
    }

    checkpoint() {
        this._tone({ type: 'sine', f0: 660, dur: 0.25, vol: 0.16 });
        this._tone({ type: 'sine', f0: 990, dur: 0.35, vol: 0.14, delay: 0.12 });
    }

    pipe() {
        this._tone({ type: 'sine', f0: 520, f1: 120, dur: 0.3, vol: 0.2 });
    }

    flag() {
        const arp = [523.25, 659.25, 783.99, 1046.5];
        arp.forEach((f, i) => this._tone({ type: 'square', f0: f, dur: 0.14, vol: 0.14, delay: i * 0.09 }));
    }

    dead() {
        this._tone({ type: 'triangle', f0: 440, f1: 110, dur: 0.5, vol: 0.2 });
        this._tone({ type: 'triangle', f0: 220, f1: 55, dur: 0.5, vol: 0.16, delay: 0.2 });
    }

    pause() {
        this._tone({ type: 'square', f0: 440, dur: 0.05, vol: 0.1 });
    }

    start() {
        this._tone({ type: 'square', f0: 392, dur: 0.09, vol: 0.14 });
        this._tone({ type: 'square', f0: 523.25, dur: 0.09, vol: 0.14, delay: 0.1 });
        this._tone({ type: 'square', f0: 659.25, dur: 0.16, vol: 0.14, delay: 0.2 });
    }
}