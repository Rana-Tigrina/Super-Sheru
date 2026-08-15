/* src/render/RagaGrades.js — one color grade per land (spec §9).
 * Eight grades for eight ragas: dawn · dusk · storm · aarti · mist · stone ·
 * snow · sunrise. Values are RGB triplets consumed by ColorGradePipeline as
 * composite overlays — the SpriteFactory palette lock is never touched.
 */

export const RAGA_GRADES = {
    dawn: {
        label: 'Bhairav · Punjab Dawn',
        skyTop: [43, 29, 74], skyBottom: [255, 182, 50],
        sun: [420, 208, 32, [255, 220, 140]],
        tint: [255, 200, 140], tintAlpha: 0.12, mode: 'soft-light',
        vignette: 0.28, weather: 'petals',
    },
    dusk: {
        label: 'Yaman · Rajasthan Dusk',
        skyTop: [68, 26, 50], skyBottom: [234, 102, 70],
        sun: [92, 202, 34, [255, 160, 120]],
        tint: [255, 150, 150], tintAlpha: 0.14, mode: 'soft-light',
        vignette: 0.32, weather: 'dust',
    },
    storm: {
        label: 'Malhar · Kerala Monsoon',
        skyTop: [15, 25, 45], skyBottom: [60, 100, 110],
        sun: null,
        tint: [86, 140, 160], tintAlpha: 0.18, mode: 'multiply',
        vignette: 0.44, weather: 'rain',
    },
    aarti: {
        label: 'Bhairavi · Varanasi Aarti',
        skyTop: [35, 12, 40], skyBottom: [234, 110, 30],
        sun: [256, 192, 38, [255, 180, 70]],
        tint: [255, 160, 70], tintAlpha: 0.16, mode: 'soft-light',
        vignette: 0.36, weather: 'embers',
    },
    mist: {
        label: 'Desh · Assam Mist',
        skyTop: [80, 100, 86], skyBottom: [196, 210, 190],
        sun: null,
        tint: [160, 204, 166], tintAlpha: 0.12, mode: 'screen',
        vignette: 0.24, weather: 'mist',
    },
    stone: {
        label: 'Khamaj · Madhya Stone',
        skyTop: [120, 86, 52], skyBottom: [246, 216, 154],
        sun: [402, 66, 28, [255, 245, 210]],
        tint: [246, 196, 120], tintAlpha: 0.10, mode: 'soft-light',
        vignette: 0.26, weather: null,
    },
    snow: {
        label: 'Malkauns · Himalayan Snow',
        skyTop: [12, 12, 40], skyBottom: [110, 130, 190],
        sun: [430, 58, 22, [210, 220, 240]],
        tint: [118, 150, 245], tintAlpha: 0.16, mode: 'multiply',
        vignette: 0.40, weather: 'snow',
    },
    sunrise: {
        label: 'Shankara · Kanyakumari Sunrise',
        skyTop: [180, 64, 34], skyBottom: [255, 230, 130],
        sun: [256, 168, 46, [255, 240, 150]],
        tint: [255, 190, 100], tintAlpha: 0.14, mode: 'overlay',
        vignette: 0.30, weather: 'spray',
    },
};

export function gradeFor(name) {
    return RAGA_GRADES[name] ?? RAGA_GRADES.dawn;
}