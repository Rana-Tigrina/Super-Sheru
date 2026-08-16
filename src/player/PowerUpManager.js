/* src/player/PowerUpManager.js — Indian Power-Up System.
 * ────────────────────────────────────────────────────────────────────────────
 * Implements Mario-style power-up transformations with Indian themes:
 *   - Super Form (Desi Ghee / Kaju Katli): Doubles size, royal turban, breaks bricks
 *   - Invincibility (Sudarshan Kavach): Rainbow aura, 12s invincible, speed boost
 *   - Ranged Power (Agni Chakra): Throws bouncing fire chakras
 *   - Mithai Shower Box: Multi-hit block that showers laddoos
 */

import { FP, PHYS, TILE_ID } from '../core/constants.js';

/** Power-up types with properties. */
export const POWER_UP_TYPES = {
    SUPER: 'super',
    INVINCIBLE: 'invincible',
    CHAKRA: 'chakra',
    MITHAI: 'mithai',
};

/** Power-up configuration. */
const POWER_UP_CONFIG = {
    [POWER_UP_TYPES.SUPER]: {
        duration: Infinity, // Permanent until hit
        sizeMultiplier: 1.5,
        speedBonus: 0,
        canBreakBricks: true,
        extraLives: 1,
        color: '#ff8c28', // Saffron
        glowColor: '#ffd94a',
    },
    [POWER_UP_TYPES.INVINCIBLE]: {
        duration: 720, // 12 seconds at 60 FPS
        sizeMultiplier: 1,
        speedBonus: 0.4, // 40% speed boost
        canBreakBricks: false,
        extraLives: 0,
        color: '#ffffff', // White/rainbow
        glowColor: '#f2b632',
    },
    [POWER_UP_TYPES.CHAKRA]: {
        duration: Infinity,
        sizeMultiplier: 1,
        speedBonus: 0,
        canBreakBricks: false,
        extraLives: 0,
        color: '#d9383c', // Crimson
        glowColor: '#ff8c28',
    },
    [POWER_UP_TYPES.MITHAI]: {
        duration: 0, // Instant effect
        sizeMultiplier: 1,
        speedBonus: 0,
        canBreakBricks: false,
        extraLives: 0,
        color: '#ffb632', // Marigold
        glowColor: '#ffd94a',
    },
};

/** Player power-up state manager. */
export class PowerUpManager {
    constructor(player) {
        this.player = player;
        this.activePowerUps = new Map();
        this.timers = new Map();
        this.mithaiHits = 0;
        this.maxMithaiHits = 10;
    }

    /** Apply a power-up to the player. */
    apply(type) {
        const config = POWER_UP_CONFIG[type];
        if (!config) return false;

        switch (type) {
            case POWER_UP_TYPES.SUPER:
                return this._applySuper(config);
            case POWER_UP_TYPES.INVINCIBLE:
                return this._applyInvincible(config);
            case POWER_UP_TYPES.CHAKRA:
                return this._applyChakra(config);
            case POWER_UP_TYPES.MITHAI:
                return this._applyMithai(config);
            default:
                return false;
        }
    }

    _applySuper(config) {
        const s = this.player.s;
        
        // Already super?
        if (this.activePowerUps.has(POWER_UP_TYPES.SUPER)) {
            return false;
        }

        // Store original size
        s.originalW = s.w;
        s.originalH = s.h;
        
        // Apply size increase
        s.w = Math.floor(s.w * config.sizeMultiplier);
        s.h = Math.floor(s.h * config.sizeMultiplier);
        
        // Mark as super
        this.activePowerUps.set(POWER_UP_TYPES.SUPER, config);
        s.isSuper = true;
        s.hasPagri = true; // Royal turban
        
        return true;
    }

    _applyInvincible(config) {
        const s = this.player.s;
        
        // Extend duration if already active
        if (this.activePowerUps.has(POWER_UP_TYPES.INVINCIBLE)) {
            const timer = this.timers.get(POWER_UP_TYPES.INVINCIBLE);
            if (timer) {
                this.timers.set(POWER_UP_TYPES.INVINCIBLE, config.duration);
            }
            return true;
        }

        this.activePowerUps.set(POWER_UP_TYPES.INVINCIBLE, config);
        this.timers.set(POWER_UP_TYPES.INVINCIBLE, config.duration);
        s.isInvincible = true;
        s.rainbowAura = true;
        
        return true;
    }

    _applyChakra(config) {
        const s = this.player.s;
        
        if (this.activePowerUps.has(POWER_UP_TYPES.CHAKRA)) {
            return false;
        }

        this.activePowerUps.set(POWER_UP_TYPES.CHAKRA, config);
        s.canThrowChakra = true;
        s.chakraGlow = true;
        
        return true;
    }

    _applyMithai(config) {
        // Instant effect - shower laddoos
        this.mithaiHits = 0;
        return true;
    }

    /** Update power-up timers (call each frame). */
    update() {
        for (const [type, timer] of this.timers.entries()) {
            if (timer > 0) {
                this.timers.set(type, timer - 1);
                
                // Check expiration
                if (timer <= 1) {
                    this.remove(type);
                }
            }
        }
    }

    /** Remove a specific power-up. */
    remove(type) {
        const config = POWER_UP_CONFIG[type];
        if (!config) return;

        const s = this.player.s;

        switch (type) {
            case POWER_UP_TYPES.SUPER:
                this._removeSuper(s);
                break;
            case POWER_UP_TYPES.INVINCIBLE:
                this._removeInvincible(s);
                break;
            case POWER_UP_TYPES.CHAKRA:
                this._removeChakra(s);
                break;
        }

        this.activePowerUps.delete(type);
        this.timers.delete(type);
    }

    _removeSuper(s) {
        // Restore original size
        if (s.originalW && s.originalH) {
            s.w = s.originalW;
            s.h = s.originalH;
        }
        s.isSuper = false;
        s.hasPagri = false;
        delete s.originalW;
        delete s.originalH;
    }

    _removeInvincible(s) {
        s.isInvincible = false;
        s.rainbowAura = false;
    }

    _removeChakra(s) {
        s.canThrowChakra = false;
        s.chakraGlow = false;
    }

    /** Remove all power-ups (on death or level complete). */
    removeAll() {
        for (const type of Array.from(this.activePowerUps.keys())) {
            this.remove(type);
        }
        this.mithaiHits = 0;
    }

    /** Hit handler - lose power-ups on damage. */
    onHit() {
        // Lose invincibility first if active
        if (this.activePowerUps.has(POWER_UP_TYPES.INVINCIBLE)) {
            this.remove(POWER_UP_TYPES.INVINCIBLE);
            return false; // Don't take damage during invincibility
        }

        // Lose super form if active
        if (this.activePowerUps.has(POWER_UP_TYPES.SUPER)) {
            this.remove(POWER_UP_TYPES.SUPER);
            return true; // Took the hit but survived
        }

        return false; // No power-ups to lose, will take damage
    }

    /** Check if player can break brick blocks. */
    canBreakBricks() {
        return this.activePowerUps.has(POWER_UP_TYPES.SUPER);
    }

    /** Check if player is invincible. */
    isInvincible() {
        return this.activePowerUps.has(POWER_UP_TYPES.INVINCIBLE);
    }

    /** Check if player can throw chakras. */
    canThrowChakras() {
        return this.activePowerUps.has(POWER_UP_TYPES.CHAKRA);
    }

    /** Get current speed multiplier. */
    getSpeedMultiplier() {
        let multiplier = 1;
        for (const [type, config] of this.activePowerUps.entries()) {
            if (config.speedBonus) {
                multiplier += config.speedBonus;
            }
        }
        return multiplier;
    }

    /** Get visual glow color for rendering. */
    getGlowColor() {
        if (this.activePowerUps.has(POWER_UP_TYPES.INVINCIBLE)) {
            // Rainbow effect for invincibility
            return null; // Special case handled by renderer
        }
        
        for (const [type, config] of this.activePowerUps.entries()) {
            return config.glowColor;
        }
        return null;
    }

    /** Handle mithai box hits. */
    hitMithaiBox() {
        if (this.mithaiHits < this.maxMithaiHits) {
            this.mithaiHits++;
            return this.mithaiHits;
        }
        return 0;
    }

    /** Get remaining invincibility time (in seconds). */
    getInvincibilityTime() {
        const timer = this.timers.get(POWER_UP_TYPES.INVINCIBLE);
        if (timer) {
            return (timer / 60).toFixed(1);
        }
        return 0;
    }

    /** Get active power-up names for HUD. */
    getActiveNames() {
        const names = [];
        for (const type of this.activePowerUps.keys()) {
            switch (type) {
                case POWER_UP_TYPES.SUPER:
                    names.push('Super');
                    break;
                case POWER_UP_TYPES.INVINCIBLE:
                    names.push(`Star (${this.getInvincibilityTime()}s)`);
                    break;
                case POWER_UP_TYPES.CHAKRA:
                    names.push('Chakra');
                    break;
            }
        }
        return names;
    }
}

/** Item/Mystery Block manager. */
export class MysteryBlockManager {
    constructor(level, particleEngine) {
        this.level = level;
        this.particles = particleEngine;
        this.hitBlocks = new Set();
        this.mithaiBoxes = new Map(); // tx,ty -> hits remaining
    }

    /** Handle bumping a mystery block from below. */
    bonkBlock(tx, ty, player) {
        const key = `${tx},${ty}`;
        const tileId = this.level.tileAt(tx, ty);
        
        if (tileId === TILE_ID.LADDOO_BLOCK) {
            // Check if already hit
            if (this.hitBlocks.has(key)) {
                return { type: 'spent', tx, ty };
            }

            // Mark as hit
            this.hitBlocks.add(key);
            
            // Determine what to spawn (random or predetermined)
            const item = this._determineItem(tx, ty);
            
            // Spawn item animation
            this._spawnItemAnimation(tx, ty, item);
            
            return { type: item, tx, ty };
        } else if (tileId === TILE_ID.BRICK) {
            // Check if player is super and can break bricks
            if (player && player.powerUps?.canBreakBricks()) {
                this._breakBrick(tx, ty);
                return { type: 'broken', tx, ty };
            }
            return { type: 'bonk', tx, ty };
        } else if (this.mithaiBoxes.has(key)) {
            // Mithai box - multi-hit
            const hits = this.mithaiBoxes.get(key);
            if (hits > 0) {
                this.mithaiBoxes.set(key, hits - 1);
                this._spawnLaddoo(tx, ty);
                return { type: 'laddoo', tx, ty };
            } else {
                this.hitBlocks.add(key);
                return { type: 'spent', tx, ty };
            }
        }

        return null;
    }

    _determineItem(tx, ty) {
        // Simple deterministic selection based on position
        const hash = (tx * 7 + ty * 13) % 100;
        
        if (hash < 50) {
            return 'laddoo';
        } else if (hash < 70) {
            return 'super';
        } else if (hash < 85) {
            return 'star';
        } else if (hash < 95) {
            return 'chakra';
        } else {
            return 'mithai';
        }
    }

    _spawnItemAnimation(tx, ty, itemType) {
        const x = tx * 16 + 8;
        const y = ty * 16;
        
        // Particle effects based on item type
        switch (itemType) {
            case 'super':
                this.particles.burst(x, y, 'sparkle', 12);
                this.particles.burst(x, y, 'star', 8);
                break;
            case 'star':
                this.particles.burst(x, y, 'sparkle', 16);
                this.particles.burst(x, y, 'star', 12);
                break;
            case 'chakra':
                this.particles.burst(x, y, 'ember', 12);
                this.particles.burst(x, y, 'sparkle', 8);
                break;
            case 'mithai':
                this.particles.burst(x, y, 'sparkle', 20);
                this.particles.burst(x, y, 'petal', 12);
                break;
            default:
                this.particles.burst(x, y, 'sparkle', 8);
        }
    }

    _breakBrick(tx, ty) {
        const x = tx * 16 + 8;
        const y = ty * 16 + 8;
        
        // Shatter particles
        this.particles.brickShatter(x, y);
        
        // Remove brick from level (handled by level system)
        // This would need integration with the level tile system
    }

    _spawnLaddoo(tx, ty) {
        const x = tx * 16 + 8;
        const y = ty * 16;
        
        this.particles.laddooCollect(x, y);
    }

    /** Create a mithai box at position. */
    createMithaiBox(tx, ty, hits = 10) {
        const key = `${tx},${ty}`;
        this.mithaiBoxes.set(key, hits);
    }
}
