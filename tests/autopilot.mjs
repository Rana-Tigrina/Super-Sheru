#!/usr/bin/env node
/* tests/autopilot.mjs — the GRD autopilot.
 * A heuristic controller that walks Sheru rightward through any chapter:
 * gap/wall/spike/water lookahead, hop-over enemies, patience for floaters,
 * stall-escape scripts. Used by tools/grd-solver.mjs (proofs) and
 * tests/generate-all-ghosts.mjs (ghosts).
 */

import { createSimulation, stepSimulation } from '../src/verification/FixedStepVerifier.js';
import { FP, BTN, isSolid, isOneWay } from '../src/core/constants.js';

const RIGHT = BTN.RIGHT, LEFT = BTN.LEFT, JUMP = BTN.JUMP, RUN = BTN.RUN;

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
        jumping: 0, jumpRun: false,
        patience: 0,
        maxX: -1, stall: 0, escape: 0,
    };

    let t = 0;
    for (; t < maxSteps; t++) {
        if (sim.result !== 'playing') break;
        const bits = decide(sim, ctx);
        stream.push(bits);
        stepSimulation(sim, bits);

        if (sim.player.s.x > ctx.maxX) { ctx.maxX = sim.player.s.x; ctx.stall = 0; }
        else ctx.stall++;
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

    /* stall escape: back up, then leap right */
    if (ctx.stall > 90 && ctx.escape <= 0) ctx.escape = 26;
    if (ctx.escape > 0) {
        ctx.escape--;
        ctx.jumping = 0;
        return ctx.escape > 14 ? LEFT : (RIGHT | JUMP);
    }

    const holdLong = 20 + (ctx.style % 2) * 3 + Math.floor(ctx.style / 2);
    const holdShort = 12 + (ctx.style % 2);

    /* finish an in-flight jump hold */
    if (ctx.jumping > 0) {
        ctx.jumping--;
        return RIGHT | JUMP | (ctx.jumpRun ? RUN : 0);
    }

    const footRow = FP.floorInt(p.y + FP.fromInt(p.h) - 1) >> 4;
    const colFront = FP.floorInt(p.x + FP.fromInt(p.w)) >> 4;

    const support = (c) => {
        for (let r = footRow + 1; r <= footRow + 3; r++) {
            const id = level.tileAt(c, r);
            if (isSolid(id) || isOneWay(id)) return true;
        }
        return false;
    };

    /* enemy ahead → throw chakra disc to clear path */
    if (ctx.jumping === 0 && support(colFront + 1)) {
        for (const e of level.enemies) {
            if (!e.alive) continue;
            const dx = e.s.x - (p.x + FP.fromInt(p.w));
            if (dx >= FP.fromInt(20) && dx < FP.fromInt(90) && FP.abs(e.s.y - p.y) < FP.fromInt(24)) {
                return RIGHT | RUN | BTN.THROW;
            }
        }
    }
    for (const e of level.enemies) {
        if (!e.alive || e.kind !== 'floater') continue;
        const dx = e.s.x - p.x;
        if (dx > 0 && dx < FP.fromInt(40) && FP.abs(e.s.y - p.y) < FP.fromInt(22)) {
            ctx.jumping = holdShort; ctx.jumpRun = false;
            return RIGHT | JUMP | RUN;
        }
    }

    /* walkers closing in → hop */
    for (const e of level.enemies) {
        if (!e.alive || e.kind !== 'walker') continue;
        const dx = e.s.x - (p.x + FP.fromInt(p.w));
        if (dx >= 0 && dx < FP.fromInt(32) && FP.abs(e.s.y - p.y) < FP.fromInt(20)) {
            ctx.jumping = holdLong; ctx.jumpRun = true;
            return RIGHT | JUMP | RUN;
        }
    }

    /* spike bed ahead (contiguous, at foot level) */
    let hazardAt = -1, hazardW = 0;
    for (let d = 0; d <= 6; d++) {
        if (level.isHazardAt(colFront + d, footRow)) {
            if (hazardAt < 0) hazardAt = d;
            hazardW++;
        } else if (hazardAt >= 0) break;
    }
    if (hazardAt >= 0 && hazardAt <= 3) {
        ctx.jumping = holdLong;
        ctx.jumpRun = true;
        return RIGHT | JUMP | RUN;
    }

    /* wall ahead (stairs, pillars, pipes) */
    let wall = false, wallH = 0;
    for (let d = 0; d <= 1 && !wall; d++) {
        const c = colFront + d;
        if (level.isSolidAt(c, footRow) || level.isSolidAt(c, footRow - 1)) {
            wall = true;
            for (let r = footRow; r >= footRow - 5; r--) {
                if (level.isSolidAt(c, r)) wallH++;
                else if (wallH > 0) break;
            }
        }
    }
    if (wall) {
        ctx.jumping = wallH >= 2 ? holdLong : holdShort;
        ctx.jumpRun = true;
        return RIGHT | JUMP | RUN;
    }

    /* gap / water ahead */
    if (!support(colFront + 1)) {
        let gapW = 0, water = false, bridge = false;
        for (let c = colFront + 1; c - colFront <= 9 && !support(c); c++) {
            gapW++;
            for (let r = footRow + 1; r <= footRow + 4; r++) if (level.isWaterAt(c, r)) water = true;
            for (let r = footRow - 2; r <= footRow - 1; r++) if (isOneWay(level.tileAt(c, r))) bridge = true;
        }
        ctx.jumping = holdLong;
        ctx.jumpRun = gapW >= 3 || water || bridge;
        return RIGHT | JUMP | (ctx.jumpRun ? RUN : 0);
    }

    return RIGHT;
}