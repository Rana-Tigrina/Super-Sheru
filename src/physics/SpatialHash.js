/* src/physics/SpatialHash.js — broad-phase grid for entities (spec §11).
 * All coordinates are Q16.16 FP integers, matching the sim. Used by
 * GameScene to cheaply ask "what is near the player?" each step.
 */

import { FP } from '../core/constants.js';

export class SpatialHash {
    /** cellTiles: cell edge length in tiles (2 ⇒ 32px cells). */
    constructor(cellTiles = 2) {
        this.cellFP = FP.fromInt(cellTiles * 16);
        this.cells = new Map();      // cellKey → Set(obj)
        this.items = new Map();      // obj → [cellKey, …]
        this._stamp = 1;             // query dedupe generation
    }

    clear() {
        this.cells.clear();
        this.items.clear();
    }

    _key(cx, cy) {
        return (cy + 64) * 4096 + (cx + 64);
    }

    _range(x, y, w, h) {
        const c = this.cellFP;
        return {
            x0: Math.floor(x / c),
            y0: Math.floor(y / c),
            x1: Math.floor((x + w - 1) / c),
            y1: Math.floor((y + h - 1) / c),
        };
    }

    insert(obj, x, y, w, h) {
        const r = this._range(x, y, w, h);
        const keys = [];
        for (let cy = r.y0; cy <= r.y1; cy++) {
            for (let cx = r.x0; cx <= r.x1; cx++) {
                const k = this._key(cx, cy);
                let set = this.cells.get(k);
                if (!set) { set = new Set(); this.cells.set(k, set); }
                set.add(obj);
                keys.push(k);
            }
        }
        this.items.set(obj, keys);
    }

    remove(obj) {
        const keys = this.items.get(obj);
        if (!keys) return;
        for (const k of keys) {
            const set = this.cells.get(k);
            if (set) {
                set.delete(obj);
                if (!set.size) this.cells.delete(k);
            }
        }
        this.items.delete(obj);
    }

    update(obj, x, y, w, h) {
        this.remove(obj);
        this.insert(obj, x, y, w, h);
    }

    /** Collect candidate objects whose cells intersect the box. */
    query(x, y, w, h, out = []) {
        const r = this._range(x, y, w, h);
        this._stamp = (this._stamp + 1) | 0;
        for (let cy = r.y0; cy <= r.y1; cy++) {
            for (let cx = r.x0; cx <= r.x1; cx++) {
                const set = this.cells.get(this._key(cx, cy));
                if (!set) continue;
                for (const obj of set) {
                    if (obj.__qh === this._stamp) continue;
                    obj.__qh = this._stamp;
                    out.push(obj);
                }
            }
        }
        return out;
    }
}