/* src/render/ParticleEngine.js — Max Juice particle systems.
 * ────────────────────────────────────────────────────────────────────────────
 * Implements high-production particle effects for game feel:
 *   - Sparkle trails (running, invincibility)
 *   - Landing dust clouds
 *   - Brick shatter debris
 *   - Laddoo collection sparkles
 *   - Enemy stomp bursts
 *   - Power-up transformation glows
 *   - Chakra fire trails
 */

import { VIEW, FP, TILE } from '../core/constants.js';

const W = VIEW.W;
const H = VIEW.H;

/** Particle types with visual properties. */
const PARTICLE_TYPES = {
    sparkle: {
        color: '#ffd94a',
        size: [2, 4],
        life: [15, 25],
        gravity: 0,
        fade: true,
    },
    dust: {
        color: ['#c8c4d8', '#e4ecf5', '#faf6ef'],
        size: [3, 6],
        life: [10, 20],
        gravity: -0.05,
        fade: true,
    },
    debris: {
        color: ['#b56a3c', '#8f4a2a', '#e0c088'],
        size: [2, 5],
        life: [20, 35],
        gravity: 0.15,
        fade: false,
    },
    ember: {
        color: ['#ffd94a', '#ff8c28', '#d9383c'],
        size: [1, 3],
        life: [15, 30],
        gravity: -0.1,
        fade: true,
    },
    petal: {
        color: ['#ffb632', '#f08aa0', '#e85a7a'],
        size: [2, 4],
        life: [30, 50],
        gravity: 0.02,
        fade: true,
    },
    star: {
        color: ['#ffffff', '#ffd94a', '#f2b632'],
        size: [3, 6],
        life: [20, 40],
        gravity: -0.08,
        fade: true,
    },
    smoke: {
        color: ['#c8c4d8', '#8f84a8'],
        size: [4, 8],
        life: [15, 25],
        gravity: -0.05,
        fade: true,
    },
};

/** Single particle instance. */
class Particle {
    constructor(x, y, type) {
        const def = PARTICLE_TYPES[type] || PARTICLE_TYPES.sparkle;
        
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Random velocity in all directions
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1; // Slight upward bias
        
        // Size variation
        const sizeRange = def.size[1] - def.size[0];
        this.size = def.size[0] + Math.random() * sizeRange;
        this.initialSize = this.size;
        
        // Life
        const lifeRange = def.life[1] - def.def?.life?.[0] || def.life[0];
        this.life = def.life[0] + Math.random() * (def.life[1] - def.life[0]);
        this.maxLife = this.life;
        
        // Color
        if (Array.isArray(def.color)) {
            this.color = def.color[Math.floor(Math.random() * def.color.length)];
        } else {
            this.color = def.color;
        }
        
        this.gravity = def.gravity || 0;
        this.fade = def.fade !== false;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        this.rotation += this.rotationSpeed;
        
        if (this.fade) {
            this.size = this.initialSize * (this.life / this.maxLife);
        }
        
        return this.life > 0 && this.size > 0.5;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        // Draw based on particle type
        switch (this.type) {
            case 'sparkle':
                this._drawSparkle(ctx);
                break;
            case 'star':
                this._drawStar(ctx);
                break;
            default:
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        ctx.restore();
    }

    _drawSparkle(ctx) {
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    _drawStar(ctx) {
        const s = this.size;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * s;
            const y = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}

/** Particle emitter for continuous effects. */
class Emitter {
    constructor(x, y, type, rate = 2, lifetime = Infinity) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.rate = rate;
        this.lifetime = lifetime;
        this.age = 0;
        this.active = true;
        this.particles = [];
    }

    update() {
        if (!this.active) return false;
        
        this.age++;
        if (this.age >= this.lifetime) {
            this.active = false;
        }
        
        // Spawn new particles
        if (this.active && this.age % this.rate === 0) {
            this.particles.push(new Particle(this.x, this.y, this.type));
        }
        
        // Update existing particles
        this.particles = this.particles.filter(p => p.update());
        
        return this.active || this.particles.length > 0;
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }

    stop() {
        this.active = false;
    }
}

/** Main particle engine managing all effects. */
export class ParticleEngine {
    constructor() {
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 500;
    }

    /** Clear all particles. */
    clear() {
        this.particles = [];
        this.emitters = [];
    }

    /** Spawn a burst of particles at position. */
    burst(x, y, type, count = 8) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                this.particles.push(new Particle(x, y, type));
            }
        }
    }

    /** Create a continuous emitter. */
    emit(x, y, type, rate = 2, lifetime = 60) {
        const emitter = new Emitter(x, y, type, rate, lifetime);
        this.emitters.push(emitter);
        return emitter;
    }

    /** Effect: Running dust trail. */
    runDust(x, y, facing) {
        const dir = facing < 0 ? 1 : -1;
        this.burst(x + dir * 8, y + 12, 'dust', 2);
    }

    /** Effect: Landing impact dust cloud. */
    landDust(x, y) {
        this.burst(x, y + 14, 'dust', 12);
    }

    /** Effect: Brick block shatter. */
    brickShatter(x, y) {
        this.burst(x + 8, y + 8, 'debris', 16);
        this.burst(x + 8, y + 8, 'dust', 8);
    }

    /** Effect: Laddoo collection sparkle. */
    laddooCollect(x, y) {
        this.burst(x + 4, y + 4, 'sparkle', 8);
        this.burst(x + 4, y + 4, 'star', 4);
    }

    /** Effect: Enemy stomp burst. */
    enemyStomp(x, y) {
        this.burst(x + 8, y + 8, 'smoke', 10);
        this.burst(x + 8, y + 12, 'dust', 6);
    }

    /** Effect: Power-up transformation. */
    powerUpTransform(x, y) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.burst(x, y, 'sparkle', 12);
                this.burst(x, y, 'star', 8);
            }, i * 100);
        }
    }

    /** Effect: Invincibility star trail. */
    invincibilityTrail(x, y) {
        this.burst(x, y, 'sparkle', 2);
        this.burst(x, y, 'star', 1);
    }

    /** Effect: Chakra fire trail. */
    chakraTrail(x, y) {
        this.burst(x, y, 'ember', 2);
        this.burst(x, y, 'sparkle', 1);
    }

    /** Effect: Hurt/damage flash. */
    hurtFlash(x, y) {
        this.burst(x, y, 'sparkle', 6);
        this.burst(x, y, 'smoke', 4);
    }

    /** Effect: Checkpoint activation. */
    checkpointActivate(x, y) {
        this.burst(x, y - 20, 'sparkle', 20);
        this.burst(x, y - 20, 'star', 12);
        this.burst(x, y - 20, 'ember', 8);
    }

    /** Effect: Flag celebration. */
    flagCelebrate(x, y) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.burst(x + (Math.random() - 0.5) * 40, y - 30, 'sparkle', 8);
                this.burst(x + (Math.random() - 0.5) * 40, y - 30, 'star', 6);
                this.burst(x + (Math.random() - 0.5) * 40, y - 30, 'petal', 4);
            }, i * 150);
        }
    }

    /** Effect: Death explosion. */
    deathExplosion(x, y) {
        this.burst(x, y, 'smoke', 20);
        this.burst(x, y, 'debris', 12);
        this.burst(x, y, 'sparkle', 8);
    }

    /** Effect: Pipe warp swirl. */
    pipeWarp(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = x + Math.cos(angle) * 20;
            const py = y + Math.sin(angle) * 20;
            this.burst(px, py, 'smoke', 2);
        }
    }

    /** Update all particles and emitters. */
    update() {
        // Update individual particles
        this.particles = this.particles.filter(p => p.update());
        
        // Update emitters
        this.emitters = this.emitters.filter(e => e.update());
    }

    /** Draw all particles. */
    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
        for (const e of this.emitters) {
            e.draw(ctx);
        }
    }

    /** Get active particle count for debugging. */
    getActiveCount() {
        return this.particles.length + 
               this.emitters.reduce((sum, e) => sum + e.particles.length, 0);
    }
}
