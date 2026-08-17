/* src/data/CollectibleData.js — Collectible items, coins, seals, and power-up pick-ups. */

export const COLLECTIBLE_TYPE = {
    LADDOO: 'laddoo',             // Standard regional laddoo (score & progression)
    MODAK: 'modak',               // Desi Ghee / Modak (triggers Super Sheru)
    KAVACH_STAR: 'kavach_star',   // Sudarshan Star (triggers 12s invincibility)
    ANCIENT_SEAL: 'ancient_seal', // Phase 3 ancient seal artifact (3 per chapter)
};

export const COLLECTIBLE_CONFIG = {
    [COLLECTIBLE_TYPE.LADDOO]: {
        type: 'laddoo',
        name: 'Motichoor Laddoo',
        width: 8,
        height: 8,
        score: 50,
        bobSpeed: 0.15,
        bobAmp: 2,
    },
    [COLLECTIBLE_TYPE.MODAK]: {
        type: 'modak',
        name: 'Royal Modak',
        width: 10,
        height: 10,
        score: 500,
        bobSpeed: 0.2,
        bobAmp: 3,
    },
    [COLLECTIBLE_TYPE.KAVACH_STAR]: {
        type: 'kavach_star',
        name: 'Sudarshan Star',
        width: 10,
        height: 10,
        score: 1000,
        bobSpeed: 0.3,
        bobAmp: 4,
    },
    [COLLECTIBLE_TYPE.ANCIENT_SEAL]: {
        type: 'ancient_seal',
        name: 'Ancient Seal of Bharat',
        width: 12,
        height: 12,
        score: 2000,
        bobSpeed: 0.1,
        bobAmp: 2,
    },
};
