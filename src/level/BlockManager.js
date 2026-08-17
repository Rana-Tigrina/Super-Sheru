/* src/level/BlockManager.js — Interactive block framework.
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages dynamic block behaviors:
 *   - Royal Peetal Mystery Vaults (?): Bounce curve, rising item spawn, spent transition.
 *   - Mithai Multihit Boxes: Up to 10 laddoos with progressive tactile recoil.
 *   - Terracotta / Sandstone Bricks: Recoil on Small Sheru, shatter on Super Sheru.
 */

import { TILE_ID, FP } from '../core/constants.js';

export class BlockManager {
    constructor(level) {
        this.level = level;
        this.bouncingBlocks = new Map(); // key: `${tx},${ty}` -> { timer, maxTimer, tileId, offsetY }
        this.multiHitCounts = new Map(); // key: `${tx},${ty}` -> remainingHits
        this.debrisParticles = [];       // [ { x, y, vx, vy, life, maxLife } ]
        this.risingItems = [];           // [ { x, y, vy, sprite, timer } ]
    }

    /** Reset state on level load. */
    reset() {
        this.bouncingBlocks.clear();
        this.multiHitCounts.clear();
        this.debrisParticles.length = 0;
        this.risingItems.length = 0;
    }

    /** Handle underside collision with a block. Returns event descriptor if interaction occurred. */
    hitBlock(tx, ty, isSuper = false) {
        const id = this.level.tileAt(tx, ty);
        const key = `${tx},${ty}`;

        if (this.bouncingBlocks.has(key)) return null; // already in bounce animation

        if (id === TILE_ID.LADDOO_BLOCK) {
            // Mystery Vault: starts bounce and pops out rising laddoo item
            this.bouncingBlocks.set(key, { timer: 8, maxTimer: 8, tileId: TILE_ID.SPENT });
            this.level.setTile(tx, ty, TILE_ID.SPENT);
            this._spawnRisingItem(tx * 16 + 4, ty * 16, 'laddoo');
            return { type: 'vault', tx, ty, item: 'laddoo' };
        }

        if (id === TILE_ID.BRICK) {
            if (isSuper) {
                // Super Sheru shatters brick into 4 angular physics shards
                this.level.setTile(tx, ty, TILE_ID.AIR);
                this._spawnBrickDebris(tx * 16 + 8, ty * 16 + 8);
                return { type: 'shatter', tx, ty };
            } else {
                // Small Sheru bonk recoil
                this.bouncingBlocks.set(key, { timer: 6, maxTimer: 6, tileId: TILE_ID.BRICK });
                return { type: 'recoil', tx, ty };
            }
        }

        return null;
    }

    /** Spawn 4 angular debris pieces flying outwards. */
    _spawnBrickDebris(cx, cy) {
        const velocities = [
            { vx: -1.8, vy: -3.8 },
            { vx: 1.8, vy: -3.8 },
            { vx: -1.2, vy: -2.2 },
            { vx: 1.2, vy: -2.2 },
        ];
        for (const v of velocities) {
            this.debrisParticles.push({
                x: cx,
                y: cy,
                vx: v.vx,
                vy: v.vy,
                life: 30,
                maxLife: 30,
            });
        }
    }

    /** Spawn rising collectable item out of the top of the block. */
    _spawnRisingItem(x, y, sprite = 'laddoo') {
        this.risingItems.push({
            x,
            y,
            vy: -3.4,
            sprite,
            timer: 20,
        });
    }

    /** Step active block animations, rising items, and debris physics. */
    update() {
        // Update bouncing blocks
        for (const [key, block] of this.bouncingBlocks.entries()) {
            block.timer--;
            // Sinusoidal bounce offset: peak -4px at middle
            const progress = 1 - (block.timer / block.maxTimer);
            block.offsetY = -Math.sin(progress * Math.PI) * 4;

            if (block.timer <= 0) {
                this.bouncingBlocks.delete(key);
            }
        }

        // Update rising items
        for (let i = this.risingItems.length - 1; i >= 0; i--) {
            const item = this.risingItems[i];
            item.y += item.vy;
            item.vy += 0.22; // decelerate upward velocity
            item.timer--;
            if (item.timer <= 0) {
                this.risingItems.splice(i, 1);
            }
        }

        // Update debris particles
        for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
            const p = this.debrisParticles[i];
            p.vy += 0.28; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.debrisParticles.splice(i, 1);
            }
        }
    }

    /** Render bouncing blocks, rising items, and flying debris fragments. */
    draw(ctx, sprites, camX, camY) {
        // Draw bouncing blocks
        for (const [key, block] of this.bouncingBlocks.entries()) {
            const [tx, ty] = key.split(',').map(Number);
            const x = tx * 16 - camX;
            const y = ty * 16 - camY + (block.offsetY | 0);

            const spriteName = block.tileId === TILE_ID.SPENT ? 'tile.spent' : 'tile.brick';
            sprites.draw(ctx, spriteName, x, y);
        }

        // Draw rising items
        for (const item of this.risingItems) {
            const x = (item.x - camX) | 0;
            const y = (item.y - camY) | 0;
            sprites.draw(ctx, item.sprite, x, y);
        }

        // Draw debris fragments
        for (const p of this.debrisParticles) {
            const x = (p.x - camX) | 0;
            const y = (p.y - camY) | 0;
            sprites.draw(ctx, 'debris.brick', x, y);
        }
    }
}
