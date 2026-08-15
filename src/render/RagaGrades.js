/* src/render/RagaGrades.js — one color grade per land (spec §9).
 * Eight grades for eight ragas: dawn · dusk · storm · aarti · mist · stone ·
 * snow · sunrise. Values are RGB triplets consumed by ColorGradePipeline as
 * composite overlays — the SpriteFactory palette lock is never touched.
 */

export const RAGA_GRADES = {
    dawn: {
        label: 'Bhairav · Dawn',
        skyTop: [43, 29, 74], skyBottom: [242, 182, 50],
        sun: [420, 208, 28, [255, 214, 120]],
        tint: [255, 196, 128], tintAlpha: 0.10, mode: 'soft-light',
        vignette: 0.26, weather: 'petals',
    },
    dusk: {
        label: 'Yaman · Dusk',
        skyTop: [58, 26, 80], skyBottom: [224, 112, 90],
        sun: [92, 202, 30, [255, 150, 110]],
        tint: [255, 140, 140], tintAlpha: 0.12, mode: 'soft-light',
        vignette: 0.30, weather: 'dust',
    },
    storm: {
        label: 'Malhar · Storm',
        skyTop: [20, 30, 52], skyBottom: [70, 110, 120],
        sun: null,
        tint: [96, 150, 170], tintAlpha: 0.16, mode: 'multiply',
        vignette: 0.42, weather: 'rain',
    },
    aarti: {
        label: 'Bhairavi · Aarti',
        skyTop: [40, 16, 44], skyBottom: [224, 120, 40],
        sun: [256, 192, 34, [255, 170, 60]],
        tint: [255, 150, 60], tintAlpha: 0.14, mode: 'soft-light',
        vignette: 0.34, weather: 'embers',
    },
    mist: {
        label: 'Desh · Mist',
        skyTop: [90, 110, 96], skyBottom: [206, 220, 200],
        sun: null,
        tint: [170, 214, 176], tintAlpha: 0.10, mode: 'screen',
        vignette: 0.22, weather: 'mist',
    },
    stone: {
        label: 'Khamaj · Stone Noon',
        skyTop: [130, 96, 62], skyBottom: [236, 206, 144],
        sun: [402, 66, 24, [255, 240, 200]],
        tint: [236, 186, 110], tintAlpha: 0.08, mode: 'soft-light',
        vignette: 0.24, weather: null,
    },
    snow: {
        label: 'Malkauns · Snowline',
        skyTop: [16, 16, 44], skyBottom: [120, 140, 200],
        sun: [430, 58, 18, [220, 228, 240]],              // cold moon
        tint: [128, 160, 255], tintAlpha: 0.14, mode: 'multiply',
        vignette: 0.38, weather: 'snow',
    },
    sunrise: {
        label: 'Shankara · Sunrise',
        skyTop: [190, 74, 44], skyBottom: [255, 220, 120],
        sun: [256, 168, 42, [255, 230, 140]],
        tint: [255, 180, 90], tintAlpha: 0.12, mode: 'overlay',
        vignette: 0.28, weather: 'spray',
    },
};

export function gradeFor(name) {
    return RAGA_GRADES[name] ?? RAGA_GRADES.dawn;
}