/* src/level/MacroLevelLoader.js — JSON → runnable level.
 * Parses the grd2/level schema (spec §5), validates dimensions/chars,
 * instantiates entities: Laddoo, Flag, PipeTrigger, Checkpoint, decor,
 * and the enemy shells. All positions are Q16.16 FP.
 */

import {
    TILE, TILE_ID, CHAR_TO_TILE, PHYS, FP, DECOR_VARIANTS,
    isSolid, isOneWay, isHazard, isWater,
} from '../core/constants.js';
import { decorHash } from '../core/util.js';
import { WalkerEnemy } from '../enemies/WalkerEnemy.js';
import { FloaterEnemy } from '../enemies/FloaterEnemy.js';

export const PIPE_FADE_STEPS = 30;   // warp lock after entering a pipe

/* ══ entity classes ══════════════════════════════════════════════════════ */

export class Laddoo {
    constructor(tx, ty) {
        this.kind = 'laddoo';
        this.x = FP.fromInt(tx * TILE + 4);
        this.y = FP.fromInt(ty * TILE + 4);
        this.w = FP.fromInt(8);
        this.h = FP.fromInt(8);
        this.taken = false;
        this.phase = decorHash(tx, ty, 7) & 255;
    }
    draw(ctx, sprites, camX, camY, step) {
        if (this.taken) return;
        const bob = FP.toInt(FP.mul(FP.fromInt(2), FP.sin((this.phase + (step >> 1)) & 255)));
        sprites.draw(ctx, 'laddoo', FP.toInt(this.x) - camX, FP.toInt(this.y) - camY + bob);
    }
}

export class AncientSeal {
    constructor(tx, ty, index = 0) {
        this.kind = 'seal';
        this.index = index;
        this.x = FP.fromInt(tx * TILE + 2);
        this.y = FP.fromInt(ty * TILE + 2);
        this.w = FP.fromInt(12);
        this.h = FP.fromInt(12);
        this.taken = false;
    }
    draw(ctx, sprites, camX, camY, step) {
        if (this.taken) return;
        const bob = FP.toInt(FP.mul(FP.fromInt(3), FP.sin((step * 3) & 255)));
        const x = FP.toInt(this.x) - camX;
        const y = FP.toInt(this.y) - camY + bob;
        ctx.save();
        ctx.fillStyle = '#ffd94a'; // gold
        ctx.beginPath();
        ctx.arc(x + 6, y + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff8c28'; // saffron border
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

export class Flag {
    constructor(tx, ty) {
        this.kind = 'flag';
        this.tx = tx; this.ty = ty;
        this.x = FP.fromInt(tx * TILE + 8);            // pole centre
        this.baseY = FP.fromInt((ty + 1) * TILE);      // ground line
        this.boxX = this.x - FP.fromInt(6);
        this.boxY = this.baseY - FP.fromInt(24);
        this.boxW = FP.fromInt(12);
        this.boxH = FP.fromInt(24);
    }
    draw(ctx, sprites, camX, camY) {
        sprites.draw(ctx, 'flag', FP.toInt(this.x) - camX - 8, FP.toInt(this.baseY) - camY - 16);
    }
}

export class PipeTrigger {
    constructor(ent) {
        this.kind = 'pipe';
        this.tx = ent.tx; this.ty = ent.ty;
        this.x = FP.fromInt(ent.tx * TILE);
        this.y = FP.fromInt(ent.ty * TILE);
        this.w = ent.w * TILE;                          // px (2 tiles = 32)
        this.h = ent.h * TILE;
        this.wF = FP.fromInt(this.w);
        this.hF = FP.fromInt(this.h);
        this.target = ent.target;
        this.spawn = ent.spawn ?? 'entry';
        this.used = false;
    }
    draw(ctx, sprites, camX, camY) {
        const x = FP.toInt(this.x) - camX;
        const y = FP.toInt(this.y) - camY;
        const top = sprites.get('pipe.top');
        const body = sprites.get('pipe.body');
        if (top) ctx.drawImage(top, x, y, this.w, 8);
        if (body) {
            for (let yy = y + 8; yy < y + this.h; yy += 8) {
                ctx.drawImage(body, x, yy, this.w, Math.min(8, y + this.h - yy));
            }
        }
    }
}

export class Checkpoint {
    constructor(tx, ty) {
        this.kind = 'checkpoint';
        this.tx = tx; this.ty = ty;
        this.x = FP.fromInt(tx * TILE);
        this.y = FP.fromInt((ty + 1) * TILE - 16);
        this.w = FP.fromInt(16);
        this.h = FP.fromInt(16);
        this.active = false;
        /* where Sheru reappears if he falls */
        this.spawnX = FP.fromInt(tx * TILE + 3);
        this.spawnY = FP.fromInt((ty + 1) * TILE - PHYS.PLAYER_H);
    }
    draw(ctx, sprites, camX, camY) {
        const name = this.active ? 'checkpoint.on' : 'checkpoint.off';
        sprites.draw(ctx, name, FP.toInt(this.x) - camX, FP.toInt(this.y) - camY + 2);
    }
}

export class Decor {
    constructor(ent) {
        this.kind = 'decor';
        this.variant = ent.variant;
        this.x = ent.tx * TILE;
        this.groundY = (ent.ty + 1) * TILE;
        this.seed = decorHash(ent.tx, ent.ty, Math.max(0, DECOR_VARIANTS.indexOf(ent.variant))) & 255;
    }
    draw(ctx, sprites, camX, camY, step) {
        const cv = sprites.get('decor.' + this.variant);
        if (!cv) return;
        const sway = FP.toInt(FP.mul(FP.fromInt(1), FP.sin((this.seed + (step >> 2)) & 255)));
        ctx.drawImage(cv, this.x - camX + sway, this.groundY - camY - cv.height);
    }
}

/* ══ the level ═══════════════════════════════════════════════════════════ */

export class Level {
    constructor(json) {
        this.meta = json.meta;
        this.par = json.par ?? { laddoos: 0 };
        this.w = json.size.w;
        this.h = json.size.h;
        this.pxW = this.w * TILE;
        this.pxH = this.h * TILE;

        /* ── tile grid ── */
        this.grid = new Uint8Array(this.w * this.h);
        const rows = json.tiles.rows;
        if (rows.length !== this.h) {
            throw new Error(`level ${this.meta.id}: expected ${this.h} rows, got ${rows.length}`);
        }
        for (let y = 0; y < this.h; y++) {
            const row = rows[y];
            if (row.length !== this.w) {
                throw new Error(`level ${this.meta.id}: row ${y} width ${row.length} != ${this.w}`);
            }
            for (let x = 0; x < this.w; x++) {
                const id = CHAR_TO_TILE[row[x]];
                if (id === undefined) {
                    throw new Error(`level ${this.meta.id}: bad tile char '${row[x]}' at ${x},${y}`);
                }
                this.grid[y * this.w + x] = id;
            }
        }

        /* ── entities ── */
        this.enemies = [];
        this.laddoos = [];
        this.seals = [];
        this.checkpoints = [];
        this.pipes = [];
        this.decors = [];
        this.flag = null;

        for (const ent of json.entities ?? []) {
            switch (ent.type) {
                case 'laddoo': this.laddoos.push(new Laddoo(ent.tx, ent.ty)); break;
                case 'seal': this.seals.push(new AncientSeal(ent.tx, ent.ty, ent.index ?? this.seals.length)); break;
                case 'walker': this.enemies.push(new WalkerEnemy(ent)); break;
                case 'floater': this.enemies.push(new FloaterEnemy(ent)); break;
                case 'checkpoint': this.checkpoints.push(new Checkpoint(ent.tx, ent.ty)); break;
                case 'flag': this.flag = new Flag(ent.tx, ent.ty); break;
                case 'pipe': this.pipes.push(new PipeTrigger(ent)); break;
                case 'decor': this.decors.push(new Decor(ent)); break;
            }
        }

        /* ── spawns ── */
        this.spawns = new Map();
        for (const sp of json.spawns ?? []) {
            this.spawns.set(sp.id, {
                x: FP.fromInt(sp.tx * TILE + 3),
                y: FP.fromInt((sp.ty + 1) * TILE - PHYS.PLAYER_H),
            });
        }
        if (!this.spawns.size) throw new Error(`level ${this.meta.id}: no spawns`);
    }

    /* tile queries (out of bounds: side walls solid, sky open, void open) */
    tileAt(tx, ty) {
        if (tx < 0 || tx >= this.w) return TILE_ID.BRICK;
        if (ty < 0 || ty >= this.h) return TILE_ID.AIR;
        return this.grid[ty * this.w + tx];
    }
    isSolidAt(tx, ty) { return isSolid(this.tileAt(tx, ty)); }
    isOneWayAt(tx, ty) { return isOneWay(this.tileAt(tx, ty)); }
    isHazardAt(tx, ty) { return isHazard(this.tileAt(tx, ty)); }
    isWaterAt(tx, ty) { return isWater(this.tileAt(tx, ty)); }

    /** '?' → spent. Returns true if a laddoo was released. */
    bonkBlock(tx, ty) {
        if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return false;
        const i = ty * this.w + tx;
        if (this.grid[i] !== TILE_ID.LADDOO_BLOCK) return false;
        this.grid[i] = TILE_ID.SPENT;
        return true;
    }

    spawnPoint(id = 'entry') {
        const sp = this.spawns.get(id) ?? this.spawns.values().next().value;
        return { x: sp.x, y: sp.y };
    }
}

/** Validate + build. Throws loud errors in dev if a level file is malformed. */
export function loadLevel(json) {
    if (!json || json.format !== 'grd2/level') {
        throw new Error('loadLevel: not a grd2/level document');
    }
    return new Level(json);
}