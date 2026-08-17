/* src/data/WeatherConfig.js — Environmental weather and atmospheric particle presets. */

export const WEATHER_TYPE = {
    CLEAR: 'clear',
    MONSOON: 'monsoon',       // Heavy rain + ripples (Kerala)
    SANDSTORM: 'sandstorm',   // Desert dust + wind streaks (Rajasthan)
    SNOW: 'snow',             // Gentle snowfall (Himalayas)
    PETALS: 'petals',         // Floating marigold / rose petals (Varanasi / Sun Temple)
    EMBERS: 'embers',         // Floating temple diya embers (Hampi)
};

export const WEATHER_CONFIG = {
    [WEATHER_TYPE.CLEAR]: {
        type: 'clear',
        particleCount: 0,
    },
    [WEATHER_TYPE.MONSOON]: {
        type: 'monsoon',
        particleCount: 48,
        speedX: -2.5,
        speedY: 7.0,
        color: '#4a8fd9',
        splashOnGround: true,
    },
    [WEATHER_TYPE.SANDSTORM]: {
        type: 'sandstorm',
        particleCount: 36,
        speedX: -4.5,
        speedY: 0.8,
        color: '#e0c088',
        splashOnGround: false,
    },
    [WEATHER_TYPE.SNOW]: {
        type: 'snow',
        particleCount: 32,
        speedX: -0.6,
        speedY: 1.4,
        color: '#faf6ef',
        splashOnGround: false,
    },
    [WEATHER_TYPE.PETALS]: {
        type: 'petals',
        particleCount: 20,
        speedX: -1.2,
        speedY: 0.9,
        color: '#ffb632',
        splashOnGround: false,
    },
    [WEATHER_TYPE.EMBERS]: {
        type: 'embers',
        particleCount: 16,
        speedX: 0.4,
        speedY: -1.2,
        color: '#ff8c28',
        splashOnGround: false,
    },
};
