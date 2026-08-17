/* src/data/EnemyData.js — Enemy schemas, archetypes, and behaviors. */

export const ENEMY_KIND = {
    WALKER: 'walker',       // Asura ground foot-soldier
    FLOATER: 'floater',     // Aerial Garuda / floating hazard
    HEAVY: 'heavy',         // Armored demon (Phase 3 placeholder)
    RANGED: 'ranged',       // Archer / spellcaster (Phase 3 placeholder)
    BOSS: 'boss',           // Regional boss (Phase 3 placeholder)
};

export const ENEMY_CONFIG = {
    [ENEMY_KIND.WALKER]: {
        kind: 'walker',
        name: 'Asura Foot-Soldier',
        width: 12,
        height: 12,
        speedFP: 0x00008ccd, // 0.55 px/step
        canTurnAtLedges: true,
        stompable: true,
        chakraVulnerable: true,
        score: 100,
    },
    [ENEMY_KIND.FLOATER]: {
        kind: 'floater',
        name: 'Vimana Floater',
        width: 14,
        height: 10,
        ampTiles: 2,
        stompable: true,
        chakraVulnerable: true,
        score: 200,
    },
};
