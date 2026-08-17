/* src/data/PowerUpData.js — Power-up definitions & configurations. */

export const POWER_UP_TYPE = {
    SMALL: 'small',
    SUPER: 'super',         // Desi Ghee / Modak: +1 hit, breaks bricks, royal pagri
    INVINCIBLE: 'kavach',   // Sudarshan Kavach: 12s (720 ticks), +40% speed, defeats enemies
    FIRE: 'fire',           // Agni Chakra (Phase 3 placeholder)
    GLIDE: 'glide',         // Mayur Feather (Phase 3 placeholder)
    MAGNET: 'magnet',       // Attracts laddoos (Phase 3 placeholder)
};

export const POWER_UP_CONFIG = {
    [POWER_UP_TYPE.SMALL]: {
        id: 'small',
        name: 'Chhota Sheru',
        width: 12,
        height: 14,
        speedBonusFP: 0,
        canBreakBricks: false,
        duration: Infinity,
    },
    [POWER_UP_TYPE.SUPER]: {
        id: 'super',
        name: 'Super Sheru',
        width: 14,
        height: 24,
        speedBonusFP: 0,
        canBreakBricks: true,
        duration: Infinity,
    },
    [POWER_UP_TYPE.INVINCIBLE]: {
        id: 'kavach',
        name: 'Sudarshan Kavach',
        width: 12,
        height: 14,
        speedBonusFP: 0x00006666, // +40% speed in Q16.16
        canBreakBricks: false,
        duration: 720, // 12 seconds @ 60 FPS
        invincible: true,
        contactLethal: true,
    },
};
