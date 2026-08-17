/* src/data/BlockData.js — Interactive block schemas and configurations. */

export const BLOCK_TYPE = {
    MYSTERY_VAULT: 'mystery_vault',   // Royal Peetal Mystery Vault (?)
    MITHAI_BOX: 'mithai_box',         // Mithai Multihit Box (up to 10 laddoos)
    TERRACOTTA_BRICK: 'brick',        // Terracotta / Sandstone Brick (recoil small, break super)
    SOLID_BLOCK: 'solid',             // Solid stone / tile
};

export const BLOCK_CONFIG = {
    [BLOCK_TYPE.MYSTERY_VAULT]: {
        id: 'mystery_vault',
        name: 'Royal Peetal Mystery Vault',
        maxHits: 1,
        bounceHeight: 4,              // px bounce curve
        bounceDuration: 8,            // frames
        spentTile: 0x05,              // Spent block sprite
    },
    [BLOCK_TYPE.MITHAI_BOX]: {
        id: 'mithai_box',
        name: 'Mithai Multihit Box',
        maxHits: 10,
        bounceHeight: 4,
        bounceDuration: 6,
        spentTile: 0x05,
    },
    [BLOCK_TYPE.TERRACOTTA_BRICK]: {
        id: 'brick',
        name: 'Terracotta Brick',
        breakableBySuper: true,
        recoilOnSmall: true,
        shatterPieces: 4,
    },
};
