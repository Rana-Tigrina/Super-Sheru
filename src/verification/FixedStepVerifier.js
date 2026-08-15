/* src/verification/FixedStepVerifier.js — THE GRD oracle.
 * ─────────────────────────────────────────────────────────────────────────
 * createSimulation() + stepSimulation() define the canonical gameplay
 * orchestration. GameScene drives the very same functions, so a proof or
 * ghost that replays here replays identically in the shipped game.
 *
 * Canonical step order (do not reorder — proofs depend on it):
 *   1 player physics   2 chakra throw+move   3 enemies   4 proximity
 *   5 combat           6 chakra kills        7 laddoos   8 checkpoints
 *   9 flag             10 pipes              11 result transitions
 *
 * Node-safe: no DOM, no audio, no floats-in-state.
 */

import { FP, PHYS, BTN, P_STATE, TILE_ID, TILE } from '../core/constants.js';
import { aabb, hashInputVector } from '../core/util.js';
import { resolvePlayerEnemy, CONTACT } from '../core/combat.js';
import { Player } from '../player/Player.js';
import { ChakraManager } from '../weapons/ChakraManager.js';
import { loadLevel } from '../level/MacroLevelLoader.js';
import { SpatialHash } from '../physics/SpatialHash.js';

const QUERY_MARGIN = FP.fromInt(48);

export function createEvents() {
    return {
        jump: false, land: false, bonk: false, laddoo: false,
        hurt: false, dead: false, splash: false, pit: false, respawn: false,
        checkpoint: false, pipe: false, flag: false,
        throw: false, shatter: false, stomp: false, enemyKilled: false,
    };
}

/** Build a headless, fully-wired simulation from a grd2/level document. */
export function createSimulation(levelJson, spawnId = 'entry') {
    const level = loadLevel(levelJson);

    /* Pipes become solid brick in the grid. Entry = land on the pipe mouth
     * (see the landing check in stepSimulation). This keeps warps working
     * with the five-button input set — no DOWN bit exists (spec §1.3). */
    for (const pipe of level.pipes) {
        const tw = pipe.w / TILE, th = pipe.h / TILE;
        for (let ty = pipe.ty; ty < pipe.ty + th; ty++) {
            for (let tx = pipe.tx; tx < pipe.tx + tw; tx++) {
                level.grid[ty * level.w + tx] = TILE_ID.BRICK;
            }
        }
    }

    const player = new Player(level.spawnPoint(spawnId));
    const chakras = new ChakraManager();
    const spatial = new SpatialHash(2);

    for (const l of level.laddoos) spatial.insert(l, l.x, l.y, l.w, l.h);
    for (const e of level.enemies) {
        spatial.insert(e, e.s.x, e.s.y, FP.fromInt(e.s.w), FP.fromInt(e.s.h));
    }

    return {
        level, player, chakras, spatial,
        step: 0,
        prevBits: 0,
        result: 'playing',          // playing | flag | dead | warp
        warpTarget: null,           // { levelId, spawnId }
        near: [],                   // reused query buffer
    };
}

/** Advance exactly one fixed step. Returns the event flags for this step. */
export function stepSimulation(sim, bits) {
    const ev = createEvents();
    const level = sim.level;
    const p = sim.player.s;
    const pwF = FP.fromInt(p.w);
    const phF = FP.fromInt(p.h);
    sim.step++;

    /* 1 — player */
    sim.player.step(bits, level, ev);
    if (ev.bonk) p.laddoos++;                       // '?' blocks pay out directly

    /* 2 — chakras */
    const throwPressed = !!(bits & BTN.THROW) && !(sim.prevBits & BTN.THROW);
    sim.chakras.tryThrow(sim.player, bits, throwPressed, ev);
    sim.chakras.step(level, ev);

    /* 3 — enemies */
    for (const e of level.enemies) {
        if (!e.alive) { sim.spatial.remove(e); continue; }
        e.step(level);
        sim.spatial.update(e, e.s.x, e.s.y, FP.fromInt(e.s.w), FP.fromInt(e.s.h));
    }

    /* 4 — proximity candidates (broad phase) */
    const near = sim.spatial.query(
        p.x - QUERY_MARGIN, p.y - QUERY_MARGIN,
        pwF + 2 * QUERY_MARGIN, phF + 2 * QUERY_MARGIN,
        sim.near,
    );

    /* 5 — pickups & player↔enemy combat */
    for (const obj of near) {
        if (obj.kind === 'laddoo') {
            if (!obj.taken && aabb(p.x, p.y, pwF, phF, obj.x, obj.y, obj.w, obj.h)) {
                obj.taken = true;
                p.laddoos++;
                ev.laddoo = true;
            }
            continue;
        }
        if (obj.kind !== 'walker' && obj.kind !== 'floater') continue;
        if (!obj.alive) continue;

        const e = obj.s;
        const ewF = FP.fromInt(e.w), ehF = FP.fromInt(e.h);
        if (!aabb(p.x, p.y, pwF, phF, e.x, e.y, ewF, ehF)) continue;

        const side =
            (p.vy >= 0 && (p.y + phF) - e.y <= FP.fromInt(7)) ? CONTACT.TOP :
                (p.y >= e.y + ehF - FP.fromInt(4)) ? CONTACT.BOTTOM :
                    CONTACT.SIDE;
        const r = resolvePlayerEnemy(p.state, side, p.vy);
        if (r.killsEnemy) {
            obj.squash();
            sim.player.stompBounce();
            ev.stomp = true;
        } else if (r.action === 'hurt') {
            sim.player.damage(ev);
        }
    }
    sim.near.length = 0;

    /* 6 — chakra kills */
    for (const c of sim.chakras.list) {
        if (!c.alive) continue;
        const b = c.boxFP;
        for (const e of level.enemies) {
            if (!e.alive) continue;
            const eb = e.boxFP;
            if (aabb(b.x, b.y, b.w, b.h, eb.x, eb.y, eb.w, eb.h)) {
                e.squash();
                ev.enemyKilled = true;
                if (!c.onHitEnemy()) ev.shatter = true;
            }
        }
    }

    /* 7 — checkpoints */
    for (const chk of level.checkpoints) {
        if (chk.active) continue;
        if (aabb(p.x, p.y, pwF, phF, chk.x, chk.y, chk.w, chk.h)) {
            chk.active = true;
            sim.player.setCheckpoint(chk.spawnX, chk.spawnY);
            ev.checkpoint = true;
        }
    }

    /* 8 — flag */
    if (sim.result === 'playing' && level.flag) {
        const f = level.flag;
        if (aabb(p.x, p.y, pwF, phF, f.boxX, f.boxY, f.boxW, f.boxH)) {
            sim.player.win();
            ev.flag = true;
            sim.result = 'flag';
        }
    }

    /* 9 — pipes: land on the mouth to warp */
    if (sim.result === 'playing') {
        const bottom = p.y + phF;
        for (const pipe of level.pipes) {
            if (
                p.onGround &&
                FP.abs(bottom - pipe.y) <= 2 &&
                p.x + pwF > pipe.x + 2 &&
                p.x < pipe.x + pipe.wF - 2
            ) {
                sim.result = 'warp';
                sim.warpTarget = { levelId: pipe.target, spawnId: pipe.spawn };
                ev.pipe = true;
                break;
            }
        }
    }

    /* 10 — death animation completes → result */
    if (sim.result === 'playing' &&
        p.state === P_STATE.DEAD &&
        p.stateTimer >= PHYS.RESPAWN_STEPS) {
        sim.result = 'dead';
    }

    sim.prevBits = bits;
    return ev;
}

/* ── proof/ghost replay ─────────────────────────────────────────────────── */

/** Run-length decode: each {t,b} holds b from step t until the next entry. */
export function expandInputs(entries, steps) {
    const out = new Uint8Array(steps);
    for (let i = 0; i < entries.length; i++) {
        const start = Math.max(0, entries[i].t);
        const end = (i + 1 < entries.length) ? entries[i + 1].t : steps;
        const b = entries[i].b & 0xff;
        for (let s = start; s < end && s < steps; s++) out[s] = b;
    }
    return out;
}

/**
 * Replay an input vector (proof or ghost envelope) through the sim.
 * Returns { result, steps, laddoos, lives, hashOk }.
 */
export function runGhostTest(levelJson, proof, opts = {}) {
    const entries = Array.isArray(proof) ? proof : (proof.inputs ?? []);
    const steps = opts.maxSteps ?? proof.steps ?? 20000;
    const vec = expandInputs(entries, steps);
    const sim = createSimulation(levelJson, opts.spawnId ?? proof.spawnId ?? 'entry');

    let t = 0;
    for (; t < steps; t++) {
        stepSimulation(sim, vec[t]);
        if (sim.result !== 'playing') { t++; break; }
    }

    const hashOk = proof.inputHash
        ? (hashInputVector(entries) >>> 0) === (parseInt(proof.inputHash, 16) >>> 0)
        : true;

    return {
        result: sim.result === 'playing' ? 'timeout' : sim.result,
        steps: t,
        laddoos: sim.player.s.laddoos,
        lives: sim.player.s.lives,
        warp: sim.warpTarget,
        hashOk,
    };
}