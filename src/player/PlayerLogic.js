/* src/player/PlayerLogic.js — pure, deterministic Sheru simulation.
 * GRD: integer FP only, no audio, no rendering, no RNG. GameScene passes an
 * `events` object each step and consumes flags (jump/bonk/hurt/shatter/…) for SFX.
 */

import {
    FP, PHYS, PHYS_FP, P_STATE, PLAYER_FORM, FORM_DIMS, BTN, TILE_ID,
    isSolid, isOneWay, isHazard, isWater,
} from '../core/constants.js';

const LAND_VY = FP.fromNumber(4.5);   // fall speed that plays the "land" thud
const HURT_STEPS = 26;                // hurt-lock duration
const KAVACH_SPEED_MULT = FP.fromNumber(1.4); // 40% speed boost during Sudarshan Kavach

export function createPlayerState(xFP, yFP) {
    return {
        x: xFP, y: yFP, vx: 0, vy: 0,
        w: PHYS.PLAYER_W, h: PHYS.PLAYER_H,
        form: PLAYER_FORM.SMALL,
        kavachTimer: 0,
        transformTimer: 0,
        facing: 1,
        onGround: false,
        coyote: 0, jumpBuffer: 0, jumpHeld: false, airJumped: false,
        state: P_STATE.FALL, stateTimer: 0,
        invuln: 0,
        lives: 3, laddoos: 0,
        checkpointX: xFP, checkpointY: yFP,
    };
}

/* ── tile collision helpers ─────────────────────────────────────────────── */

function moveX(s, level) {
    s.x += s.vx;

    const maxX = FP.fromInt(level.pxW - s.w);
    if (s.x < 0) { s.x = 0; s.vx = 0; }
    else if (s.x > maxX) { s.x = maxX; s.vx = 0; }

    if (s.vx === 0) return;

    const wF = FP.fromInt(s.w);
    const hF = FP.fromInt(s.h);
    const y0 = FP.floorInt(s.y) >> 4;
    const y1 = FP.floorInt(s.y + hF - 1) >> 4;

    for (let ty = y0; ty <= y1; ty++) {
        if (s.vx > 0) {
            const tx = FP.floorInt(s.x + wF - 1) >> 4;
            if (level.isSolidAt(tx, ty)) { s.x = FP.fromInt(tx * 16) - wF; s.vx = 0; break; }
        } else {
            const tx = FP.floorInt(s.x) >> 4;
            if (level.isSolidAt(tx, ty)) { s.x = FP.fromInt((tx + 1) * 16); s.vx = 0; break; }
        }
    }
}

function moveY(s, level, ev) {
    const prevBottom = s.y + FP.fromInt(s.h);
    s.y += s.vy;

    const wF = FP.fromInt(s.w);
    const hF = FP.fromInt(s.h);
    const x0 = FP.floorInt(s.x + FP.fromInt(1)) >> 4;       // 1–2 px forgiveness inset
    const x1 = FP.floorInt(s.x + wF - FP.fromInt(2)) >> 4;

    s.onGround = false;

    if (s.vy >= 0) {
        const ty = FP.floorInt(s.y + hF - 1) >> 4;
        let landed = false;
        for (let tx = x0; tx <= x1; tx++) {
            const id = level.tileAt(tx, ty);
            if (isSolid(id)) { landed = true; break; }
            if (isOneWay(id) && prevBottom <= FP.fromInt(ty * 16)) { landed = true; break; }
        }
        if (landed) {
            s.y = FP.fromInt(ty * 16) - hF;
            if (s.vy > LAND_VY) ev.land = true;
            s.vy = 0;
            s.onGround = true;
        }
    } else {
        const ty = FP.floorInt(s.y) >> 4;
        for (let tx = x0; tx <= x1; tx++) {
            const id = level.tileAt(tx, ty);
            if (isSolid(id)) {
                s.y = FP.fromInt((ty + 1) * 16);
                s.vy = 0;
                if (id === TILE_ID.LADDOO_BLOCK && level.bonkBlock(tx, ty)) {
                    ev.bonk = { tx, ty };
                } else if (id === TILE_ID.BRICK) {
                    if (s.form === PLAYER_FORM.SUPER) {
                        level.setTile(tx, ty, TILE_ID.AIR);
                        ev.shatter = { tx, ty };
                    } else {
                        ev.bonk = { tx, ty };
                    }
                }
                break;
            }
        }
    }
}

function touchesHazard(s, level) {
    const x0 = FP.floorInt(s.x + FP.fromInt(3)) >> 4;
    const x1 = FP.floorInt(s.x + FP.fromInt(s.w - 3)) >> 4;
    const y0 = FP.floorInt(s.y + FP.fromInt(3)) >> 4;
    const y1 = FP.floorInt(s.y + FP.fromInt(s.h - 1)) >> 4;
    for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
            if (isHazard(level.tileAt(tx, ty))) return true;
        }
    }
    return false;
}

function touchesWater(s, level) {
    const ty = FP.floorInt(s.y + FP.fromInt(s.h - 2)) >> 4;
    const xs = [2, s.w >> 1, s.w - 2];
    for (let i = 0; i < xs.length; i++) {
        const tx = FP.floorInt(s.x + FP.fromInt(xs[i])) >> 4;
        if (isWater(level.tileAt(tx, ty))) return true;
    }
    return false;
}

function applyFriction(s) {
    const f = PHYS_FP.FRICTION;
    if (s.vx > 0) s.vx = Math.max(0, s.vx - f);
    else if (s.vx < 0) s.vx = Math.min(0, s.vx + f);
}

/* ── the step ───────────────────────────────────────────────────────────── */

export function stepPlayer(s, bits, level, ev) {
    if (s.invuln > 0) s.invuln--;
    if (s.kavachTimer > 0) s.kavachTimer--;
    if (s.transformTimer > 0) s.transformTimer--;
    s.stateTimer++;

    const left = !!(bits & BTN.LEFT);
    const right = !!(bits & BTN.RIGHT);
    const jump = !!(bits & BTN.JUMP);
    const run = !!(bits & BTN.RUN);

    /* DEAD: simple pop-and-fall; GameScene watches stateTimer. */
    if (s.state === P_STATE.DEAD) {
        s.vy = FP.clamp(s.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
        s.y += s.vy;
        return;
    }

    /* WIN: victory slide, no input. */
    if (s.state === P_STATE.WIN) {
        applyFriction(s);
        s.vy = FP.clamp(s.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
        moveX(s, level);
        moveY(s, level, ev);
        return;
    }

    const hurtLock = s.state === P_STATE.HURT && s.stateTimer < HURT_STEPS;

    /* horizontal speed with optional Kavach 40% boost */
    let maxSpd = run ? PHYS_FP.MAX_RUN : PHYS_FP.MAX_WALK;
    if (s.kavachTimer > 0) {
        maxSpd = FP.mul(maxSpd, KAVACH_SPEED_MULT);
    }
    const acc = s.onGround ? (run ? PHYS_FP.RUN_ACC : PHYS_FP.WALK_ACC) : PHYS_FP.AIR_ACC;

    if (!hurtLock) {
        if (left && !right) { s.vx = FP.clamp(s.vx - acc, -maxSpd, maxSpd); s.facing = -1; }
        else if (right && !left) { s.vx = FP.clamp(s.vx + acc, -maxSpd, maxSpd); s.facing = 1; }
        else if (s.onGround) applyFriction(s);
    } else if (s.onGround) {
        applyFriction(s);
    }

    /* jump buffer + coyote time */
    if (jump && !s.jumpHeld) s.jumpBuffer = PHYS.JUMP_BUFFER_STEPS;
    else if (s.jumpBuffer > 0) s.jumpBuffer--;
    s.jumpHeld = jump;

    if (s.onGround) s.coyote = PHYS.COYOTE_STEPS;
    else if (s.coyote > 0) s.coyote--;

    if (!hurtLock && s.jumpBuffer > 0 && (s.onGround || s.coyote > 0)) {
        s.vy = PHYS_FP.JUMP_V;
        s.onGround = false;
        s.coyote = 0;
        s.jumpBuffer = 0;
        s.airJumped = true;
        ev.jump = true;
    }

    /* hold = higher */
    if (s.airJumped && !jump && s.vy < 0) {
        s.vy = FP.mul(s.vy, PHYS_FP.JUMP_CUT);
        s.airJumped = false;
    }

    /* gravity + integrate */
    s.vy = FP.clamp(s.vy + PHYS_FP.GRAVITY, -PHYS_FP.MAX_FALL, PHYS_FP.MAX_FALL);
    moveX(s, level);
    moveY(s, level, ev);

    /* fell out of the world (bottomless gaps) */
    if (s.y > FP.fromInt(level.pxH + 24)) {
        ev.pit = true;
        s.lives--;
        if (s.lives <= 0) killPlayer(s, ev);
        else respawnAtCheckpoint(s, ev);
        return;
    }

    /* tile hazards */
    if (touchesHazard(s, level)) damagePlayer(s, ev);
    if (s.state !== P_STATE.DEAD && touchesWater(s, level)) drownPlayer(s, ev);

    /* animation state machine */
    if (s.state === P_STATE.HURT) {
        if (s.stateTimer >= HURT_STEPS) s.state = s.onGround ? P_STATE.IDLE : P_STATE.FALL;
    } else if (s.state === P_STATE.STOMP) {
        if (s.onGround) s.state = P_STATE.IDLE;
    } else {
        if (!s.onGround) {
            s.state = s.vy < 0 ? P_STATE.JUMP : P_STATE.FALL;
        } else if (s.vx !== 0) {
            const skidding = FP.sign(s.vx) !== s.facing && FP.abs(s.vx) > PHYS_FP.MAX_WALK;
            s.state = skidding ? P_STATE.SKID : P_STATE.RUN;
        } else {
            s.state = P_STATE.IDLE;
        }
    }
}

/* ── outcomes & power-ups ────────────────────────────────────────────────── */

export function transformPlayer(s, form, ev) {
    if (form === PLAYER_FORM.SUPER) {
        if (s.form !== PLAYER_FORM.SUPER) {
            const diffH = FORM_DIMS[PLAYER_FORM.SUPER].h - s.h;
            s.y -= FP.fromInt(diffH); // offset position up so feet stay anchored
            s.w = FORM_DIMS[PLAYER_FORM.SUPER].w;
            s.h = FORM_DIMS[PLAYER_FORM.SUPER].h;
            s.form = PLAYER_FORM.SUPER;
            s.transformTimer = 30;
            if (ev) ev.transform = { form: PLAYER_FORM.SUPER };
        }
    } else if (form === PLAYER_FORM.SMALL) {
        if (s.form !== PLAYER_FORM.SMALL) {
            s.w = FORM_DIMS[PLAYER_FORM.SMALL].w;
            s.h = FORM_DIMS[PLAYER_FORM.SMALL].h;
            s.form = PLAYER_FORM.SMALL;
            s.transformTimer = 30;
            if (ev) ev.transform = { form: PLAYER_FORM.SMALL };
        }
    }
}

export function activateKavach(s, durationTicks = 720, ev) {
    s.kavachTimer = durationTicks;
    if (ev) ev.kavach = true;
}

export function damagePlayer(s, ev) {
    if (s.invuln > 0 || s.kavachTimer > 0 || s.state === P_STATE.DEAD ||
        s.state === P_STATE.WIN || s.state === P_STATE.HURT) return;

    /* Super Sheru absorbs hit and transforms down to Small Sheru */
    if (s.form === PLAYER_FORM.SUPER) {
        transformPlayer(s, PLAYER_FORM.SMALL, ev);
        s.invuln = PHYS.INVULN_STEPS * 2;
        ev.hurt = true;
        s.state = P_STATE.HURT;
        s.stateTimer = 0;
        s.vx = FP.mul(PHYS_FP.HURT_KNOCK_X, FP.fromInt(-s.facing));
        s.vy = PHYS_FP.HURT_POP_Y;
        s.onGround = false;
        return;
    }

    s.lives--;
    ev.hurt = true;

    if (s.lives <= 0) { killPlayer(s, ev); return; }

    s.state = P_STATE.HURT;
    s.stateTimer = 0;
    s.invuln = PHYS.INVULN_STEPS;
    s.vx = FP.mul(PHYS_FP.HURT_KNOCK_X, FP.fromInt(-s.facing));
    s.vy = PHYS_FP.HURT_POP_Y;
    s.onGround = false;
}

export function killPlayer(s, ev) {
    s.state = P_STATE.DEAD;
    s.stateTimer = 0;
    s.vx = 0;
    s.vy = PHYS_FP.HURT_POP_Y;
    ev.dead = true;
}

export function drownPlayer(s, ev) {
    ev.splash = true;
    s.lives--;
    if (s.lives <= 0) { killPlayer(s, ev); return; }
    respawnAtCheckpoint(s, ev);
}

export function respawnAtCheckpoint(s, ev) {
    s.x = s.checkpointX;
    s.y = s.checkpointY;
    s.vx = 0;
    s.vy = 0;
    s.onGround = false;
    s.form = PLAYER_FORM.SMALL;
    s.w = PHYS.PLAYER_W;
    s.h = PHYS.PLAYER_H;
    s.kavachTimer = 0;
    s.state = P_STATE.FALL;
    s.stateTimer = 0;
    s.invuln = PHYS.INVULN_STEPS;
    ev.respawn = true;
}

export function setCheckpoint(s, xFP, yFP) {
    s.checkpointX = xFP;
    s.checkpointY = yFP;
}

export function applyStompBounce(s) {
    s.vy = PHYS_FP.STOMP_BOUNCE;
    s.state = P_STATE.STOMP;
    s.stateTimer = 0;
    s.onGround = false;
    s.airJumped = false;
}

export function winLevel(s) {
    if (s.state === P_STATE.DEAD) return;
    s.state = P_STATE.WIN;
    s.stateTimer = 0;
}