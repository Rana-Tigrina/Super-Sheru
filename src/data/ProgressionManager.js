/* src/data/ProgressionManager.js — Progression, Ancient Seals, and Costume persistence.
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages:
 *   - 3 Ancient Seals per chapter (24 total seals)
 *   - Chapter completion status and best records
 *   - Costume unlocks and selection
 *   - Safe localStorage persistence with in-memory fallback
 */

const STORAGE_KEY = 'super_sheru_progression_v3';

export const COSTUMES = {
    SAFFRON: 'saffron',     // Royal Saffron (Default)
    MARATHA: 'maratha',     // Maratha Peshwa Crimson & Gold (Unlocked @ 6 Seals)
    HIMALAYAN: 'himalayan', // Himalayan Winter Fur Robe (Unlocked @ 15 Seals)
};

export class ProgressionManager {
    constructor() {
        this.data = this._load();
    }

    _defaultData() {
        return {
            seals: {},           // { [chapterId]: [boolean, boolean, boolean] }
            completed: {},       // { [chapterId]: boolean }
            bestTimes: {},       // { [chapterId]: number }
            selectedCostume: COSTUMES.SAFFRON,
        };
    }

    _load() {
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) return { ...this._defaultData(), ...JSON.parse(raw) };
            }
        } catch {
            // fallback to memory
        }
        return this._defaultData();
    }

    save() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            }
        } catch {
            // silent fallback
        }
    }

    /** Record collected seal (index 0, 1, or 2) for a chapter. */
    collectSeal(chapterId, sealIndex) {
        if (!this.data.seals[chapterId]) {
            this.data.seals[chapterId] = [false, false, false];
        }
        this.data.seals[chapterId][sealIndex] = true;
        this.save();
    }

    /** Get seals collected array for chapter: [bool, bool, bool]. */
    getSeals(chapterId) {
        return this.data.seals[chapterId] || [false, false, false];
    }

    /** Total ancient seals collected across all worlds. */
    getTotalSealsCount() {
        let total = 0;
        for (const chapterSeals of Object.values(this.data.seals)) {
            for (const s of chapterSeals) {
                if (s) total++;
            }
        }
        return total;
    }

    /** Mark chapter as completed. */
    completeChapter(chapterId, stepCount) {
        this.data.completed[chapterId] = true;
        const prev = this.data.bestTimes[chapterId];
        if (!prev || stepCount < prev) {
            this.data.bestTimes[chapterId] = stepCount;
        }
        this.save();
    }

    /** List all unlocked costumes based on collected Ancient Seals. */
    getUnlockedCostumes() {
        const total = this.getTotalSealsCount();
        const unlocked = [COSTUMES.SAFFRON];
        if (total >= 6) unlocked.push(COSTUMES.MARATHA);
        if (total >= 15) unlocked.push(COSTUMES.HIMALAYAN);
        return unlocked;
    }

    get selectedCostume() {
        return this.data.selectedCostume || COSTUMES.SAFFRON;
    }

    setCostume(costumeId) {
        if (this.getUnlockedCostumes().includes(costumeId)) {
            this.data.selectedCostume = costumeId;
            this.save();
        }
    }
}

export const progression = new ProgressionManager();
