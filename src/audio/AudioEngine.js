/* src/audio/AudioEngine.js — WebAudio hub.
 * GRD note (spec §1.6): audio NEVER influences simulation. It is synthesized
 * live from level meta (raga/tempo/tala) and may simply not exist if the
 * browser refuses AudioContext — the game still runs identically.
 */

import { RagaSynth } from './RagaSynth.js';
import { TablaSynth } from './TablaSynth.js';
import { SFX } from './SFX.js';

const MASTER_VOL = 0.8;
const MUSIC_VOL = 0.5;
const SFX_VOL = 0.9;
const DUCK_VOL = 0.15;

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.musicBus = null;
        this.sfxBus = null;
        this.muted = false;
        this.music = null;          // { raga, tabla }
        this.sfx = null;
    }

    get ready() { return this.ctx !== null; }

    /** Must be called from a user gesture (keydown/pointerdown — main.js wires it). */
    unlock() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext ?? window.webkitAudioContext;
        if (!AC) return;                        // no audio device → silent, still deterministic

        this.ctx = new AC();

        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : MASTER_VOL;
        this.master.connect(this.ctx.destination);

        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = MUSIC_VOL;
        this.musicBus.connect(this.master);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = SFX_VOL;
        this.sfxBus.connect(this.master);

        this.sfx = new SFX(this);
    }

    /** M mute — returns the new muted state (HUD shows the icon). */
    toggleMute() {
        this.muted = !this.muted;
        if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOL;
        return this.muted;
    }

    now() { return this.ctx ? this.ctx.currentTime : 0; }

    /** Start the chapter's raga + tabla from level meta. */
    startMusic(meta) {
        this.stopMusic();
        if (!this.ready) return;
        const raga = new RagaSynth(this, meta);
        const tabla = new TablaSynth(this, meta);
        raga.start();
        tabla.start();
        this.music = { raga, tabla };
    }

    stopMusic() {
        if (!this.music) return;
        this.music.raga.stop();
        this.music.tabla.stop();
        this.music = null;
    }

    /** Lower music while paused / during dialog moments. */
    duck(on) {
        if (this.musicBus) this.musicBus.gain.value = on ? DUCK_VOL : MUSIC_VOL;
    }
}