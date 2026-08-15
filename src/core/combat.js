/* src/core/combat.js — player ↔ enemy resolution.
 * GRD: pure table lookup on (player_state, contact_side) with one vy sign
 * guard. No RNG, no allocations in the hot path beyond the result record.
 * The unit suite (tests/run-grd-v1-suite.mjs) exercises every row.
 */

import { P_STATE } from './constants.js';

/** Contact side, from the PLAYER's point of view. */
export const CONTACT = { TOP: 0, SIDE: 1, BOTTOM: 2 };

/**
 * Resolution grid — rows indexed by P_STATE, columns by CONTACT.
 *   'S' = stomp (enemy dies, player bounces)
 *   'H' = hurt  (player takes a hit)
 *   '-' = nothing (no interaction)
 */
export const RESOLVE_TABLE = [
  /* IDLE  */ 'SHH',
  /* RUN   */ 'SHH',
  /* SKID  */ 'SHH',
  /* JUMP  */ 'SHH',
  /* FALL  */ 'SHH',
  /* STOMP */ 'S-S',
  /* HURT  */ '---',   // invulnerable frames — upstream guarantees
  /* DEAD  */ '---',
  /* WIN   */ '---',
];

export const OUTCOME_NONE = Object.freeze({ action: 'none', killsEnemy: false, bounce: false });
export const OUTCOME_STOMP = Object.freeze({ action: 'stomp', killsEnemy: true, bounce: true });
export const OUTCOME_HURT = Object.freeze({ action: 'hurt', killsEnemy: false, bounce: false });

/**
 * Resolve a player/enemy contact.
 * @param {number} state  P_STATE of the player this step
 * @param {number} side   CONTACT.* where the player touches the enemy
 * @param {number} vy     player vertical velocity in FP (sign only is used:
 *                        rising through a TOP contact is a bump, not a stomp)
 * @returns {Readonly<{action:'none'|'stomp'|'hurt', killsEnemy:boolean, bounce:boolean}>}
 */
export function resolvePlayerEnemy(state, side, vy) {
    const row = RESOLVE_TABLE[state];
    if (!row) return OUTCOME_NONE;

    let cell = row[side] ?? '-';

    // Ascending past an enemy's top edge is a bump from below → hurt.
    if (cell === 'S' && side === CONTACT.TOP && vy < 0) cell = 'H';

    if (cell === 'S') return OUTCOME_STOMP;
    if (cell === 'H') return OUTCOME_HURT;
    return OUTCOME_NONE;
}