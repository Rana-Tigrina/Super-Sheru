#!/usr/bin/env node
/* tests/autopilot.mjs — the GRD autopilot.
 * A robust heuristic controller that walks Sheru rightward through any chapter:
 * gap/hazard/bridge/wall lookahead, hop-over enemies, chakra throws,
 * stall-escape scripts. Used by tools/grd-solver.mjs (proofs) and
 * tests/generate-all-ghosts.mjs (ghosts).
 */

import { createSimulation, stepSimulation } from '../src/verification/FixedStepVerifier.js';
import { FP, BTN, isSolid, isOneWay } from '../src/core/constants.js';

const RIGHT = BTN.RIGHT, LEFT = BTN.LEFT, JUMP = BTN.JUMP, RUN = BTN.RUN, THROW = BTN.THROW;

/** Raw per-step bit stream → run-length {t,b} entries. */
export function collapseBits(stream) {
    const out = [];
    let cur = -1;
    for (let t = 0; t < stream.length; t++) {
        if (stream[t] !== cur) { out.push({ t, b: stream[t] }); cur = stream[t]; }
    }
    return out;
}

export function autopilotLevel(levelJson, opts = {}) {
    const { style = 0, maxSteps = 14000, spawnId = 'entry' } = opts;
    const sim = createSimulation(levelJson, spawnId);
    const stream = [];
    const ctx = {
        style,
        jumping: 0,
        jumpRun: false,
        maxX: -1,
        stall: 0,
        escape: 0,
        lastLives: sim.player.s.lives,
    };

    let t = 0;
    for (; t < maxSteps; t++) {
        if (sim.result !== 'playing') break;
        const bits = decide(sim, ctx);
        stream.push(bits);
        stepSimulation(sim, bits);

        const p = sim.player.s;
        if (p.lives < ctx.lastLives || p.x < ctx.maxX - FP.fromInt(64)) {
            ctx.lastLives = p.lives;
            ctx.maxX = p.x;
            ctx.stall = 0;
            ctx.escape = 0;
            ctx.jumping = 0;
        } else if (p.x > ctx.maxX) {
            ctx.maxX = p.x;
            ctx.stall = 0;
        } else {
            ctx.stall++;
        }
    }

    return {
        result: sim.result,
        steps: t,
        laddoos: sim.player.s.laddoos,
        inputs: collapseBits(stream),
    };
}

function decide(sim, ctx) {
    const p = sim.player.s;
    const level = sim.level;

    /* stall escape */
    if (ctx.stall > 100 && ctx.escape <= 0) ctx.escape = 24;
    if (ctx.escape > 0) {
        ctx.escape--;
        ctx.jumping = 0;
        return ctx.escape > 12 ? LEFT : (RIGHT | JUMP | RUN);
    }

    const alwaysRun = (ctx.style % 2) === 1;
    const holdLong = 14 + Math.floor(ctx.style / 2) * 3;
    const holdShort = 8 + (ctx.style % 2) * 2;

    /* in-flight jump continuation */
    if (ctx.jumping > 0) {
        ctx.jumping--;
        return RIGHT | JUMP | (ctx.jumpRun ? RUN : 0);
    }

    const footRow = FP.floorInt(p.y + FP.fromInt(p.h) - 1) >> 4;
    const colFront = FP.floorInt(p.x + FP.fromInt(p.w)) >> 4;

    const support = (c) => {
        for (let r = footRow; r <= footRow + 3; r++) {
            const id = level.tileAt(c, r);
            if (isSolid(id) || isOneWay(id)) return true;
        }
        return false;
    };

    /* 1. Throw chakra at enemies ahead when grounded */
    if (p.onGround) {
        for (const e of level.enemies) {
            if (!e.alive) continue;
            const dx = e.s.x - p.x;
            if (dx > FP.fromInt(16) && dx < FP.fromInt(90) && FP.abs(e.s.y - p.y) < FP.fromInt(24)) {
                return RIGHT | RUN | THROW;
            }
        }
    }

    /* 2. Gaps / Hazards / Water Lookahead */
    if (!support(colFront + 1)) {
        ctx.jumping = holdLong;
        ctx.jumpRun = true;
        return RIGHT | JUMP | RUN;
    }

    /* 3. Spikes */
    for (let d = 0; d <= 4; d++) {
        if (level.isHazardAt(colFront + d, footRow)) {
            ctx.jumping = holdLong;
            ctx.jumpRun = true;
            return RIGHT | JUMP | RUN;
        }
    }

    /* 4. Pipe avoidance */
    for (const pipe of level.pipes) {
        if (pipe.target) {
            const dist = pipe.tx - colFront;
            if (dist >= 0 && dist <= 4) {
                ctx.jumping = holdLong + 6;
                ctx.jumpRun = true;
                return RIGHT | JUMP | RUN;
            }
        }
    }

    /* 5. Walls / Stairs / Platforms ahead */
    if (level.isSolidAt(colFront + 1, footRow) || level.isSolidAt(colFront + 1, footRow - 1)) {
        ctx.jumping = holdLong;
        ctx.jumpRun = true;
        return RIGHT | JUMP | RUN;
    }

    for (let d = 1; d <= 4; d++) {
        const c = colFront + d;
        for (let r = footRow - 1; r >= Math.max(0, footRow - 3); r--) {
            if (isSolid(level.tileAt(c, r)) || isOneWay(level.tileAt(c, r))) {
                ctx.jumping = holdShort;
                ctx.jumpRun = true;
                return RIGHT | JUMP | RUN;
            }
        }
        if (ctx.jumping > 0) break;
    }

    /* 6. Enemy hop */
    for (const e of level.enemies) {
        if (!e.alive) continue;
        const dx = e.s.x - p.x;
        if (dx > 0 && dx < FP.fromInt(36) && FP.abs(e.s.y - p.y) < FP.fromInt(24)) {
            ctx.jumping = holdShort;
            ctx.jumpRun = true;
            return RIGHT | JUMP | RUN;
        }
    }

    return RIGHT | (alwaysRun ? RUN : 0);
}