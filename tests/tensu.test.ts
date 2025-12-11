import { describe, expect, test } from "vitest";
import { calculateFu } from "../src/tensu/fu";
import { calculateTensu } from "../src/tensu/score";
import { type AgariConfig, type TehaiStructure, MentsuType, type Mentsu, type Jantou } from "../src/types/yaku";

import type { GameRules } from "../src/types/game";

// Helper to create basic structure
const createStructure = (
    mentsu: Mentsu[],
    jantou: Jantou,
    agariHai: number
): TehaiStructure => ({
    mentsu,
    jantou,
    machi: [agariHai],
    agariHai
});

const createConfig = (overrides?: Partial<AgariConfig>): AgariConfig => ({
    isTsumo: false, // Default Ron
    isRiichi: false,
    isIppatsu: false,
    isRinshan: false,
    isChankan: false,
    isHaitei: false,
    isHoutei: false,
    isDoubleRiichi: false,
    isTenhou: false,
    isChiihou: false,
    isOya: false, // Default Non-Dealer
    bakaze: 27, // East
    jikaze: 27, // East (Dealer default)
    doraTiles: [],
    uraDoraTiles: [],
    ...overrides,
});

const createGameRules = (overrides?: Partial<GameRules>): GameRules => ({
    hasKuitan: true,
    hasAkaDora: false,
    ...overrides
});

const mShuntsu = (tiles: number[], isOpen = false): Mentsu => ({ type: MentsuType.Shuntsu, tiles, isOpen });
const mKoutsu = (tiles: number[], isOpen = false): Mentsu => ({ type: MentsuType.Koutsu, tiles, isOpen });
const mToitsu = (tiles: number[]): Mentsu => ({ type: MentsuType.Toitsu, tiles, isOpen: false });
const jantou = (tiles: number[]): Jantou => ({ tiles });

describe("calculateFu", () => {
    test("Chiitoitsu is always 25 Fu", () => {
        // 6 Toitsu + 1 Jantou structure for Chiitoitsu representation
        const structure = createStructure(
            [mToitsu([0, 0]), mToitsu([1, 1]), mToitsu([2, 2]), mToitsu([3, 3]), mToitsu([4, 4]), mToitsu([5, 5])],
            jantou([6, 6]),
            6
        );
        const config = createConfig();
        expect(calculateFu(structure, config, createGameRules())).toBe(25);
    });

    test("Menzen Ron (Base 30 -> 40 if any addon, else 30? No, straight 30 min)", () => {
        // Menzen Ron Pinfu-like: Base 30 (20+10). Addons 0. -> 30.
        // 123m 456m 789m 23p 88s. Win 1p/4p on 23p(Ryanmen).
        // Jantou 88s (Simple).
        const structure = createStructure(
            [mShuntsu([0, 1, 2]), mShuntsu([3, 4, 5]), mShuntsu([6, 7, 8]), mShuntsu([9, 10, 11])], // 123m, 456m, 789m, 123p (Wait, need proper blocks)
            jantou([25, 25]), // 8s
            9 // 1p (Low end of 123p? No, let's say we had 23p wait 1p. 1p is edge? No, 23wait 1/4 is Ryanmen)
        );
        // Let's refine structure: 23p waiting for 1p. (Ryanmen). Agari 1p.
        // Mentsu is 123p.
        // Wait type calculation in Fu logic: 123p win on 1p -> Side wait -> 0 Fu.
        const config = createConfig({ isTsumo: false }); // Ron

        // Pinfu Structure: No Fu.
        // Base 20 + Menzen 10 = 30.
        // Addons: Shuntsu=0, Jantou(8s)=0, Machi(Ryanmen)=0.
        // Total 30.
        expect(calculateFu(structure, config, createGameRules())).toBe(30);
    });

    test("Menzen Tsumo Pinfu (20 Fu - Note: calculateFu logic might return 22 rounded to 30?)", () => {
        // If we strictly follow the logic: Base 20 + Tsumo 2 + Addons 0 = 22 -> 30.
        // Pinfu Tsumo 20 is a rule exception handled outside usually.
        // Our calculateFu implementation adds +2 for Tsumo.
        const structure = createStructure(
            [mShuntsu([0, 1, 2]), mShuntsu([3, 4, 5]), mShuntsu([6, 7, 8]), mShuntsu([9, 10, 11])],
            jantou([25, 25]),
            9
        );
        const config = createConfig({ isTsumo: true });

        // Calculates 22 -> 30.
        expect(calculateFu(structure, config, createGameRules())).toBe(30);
    });

    test("Open Hand Kuitan (30 Fu min)", () => {
        // Open Pinfu-like: Base 20. No Menzen bonus. 
        // Addons 0.
        // Rounded to 30?
        // Logic: Round(20) -> 20. Special check returns 30.
        const structure = createStructure(
            [mShuntsu([0, 1, 2], true), mShuntsu([3, 4, 5]), mShuntsu([6, 7, 8]), mShuntsu([9, 10, 11])],
            jantou([25, 25]),
            9
        );
        const config = createConfig({ isTsumo: false });
        expect(calculateFu(structure, config, createGameRules())).toBe(30);
    });

    test("Koutsu & Machi Fu", () => {
        // Closed Koutsu Yaochu (8 Fu) + Kanchan (+2 Fu) + Menzen Ron (+10) + Base (20)
        // 111z (East) Closed -> 8 Fu.
        // 24m Win 3m -> Kanchan 2 Fu.
        // Total: 20 + 10 + 8 + 2 = 40.
        // const structure = createStructure(...) - Unused logic illustration only

        // Clean structure:
        // Koutsu 111z (East)
        // Shuntsu 123m (Win on 3m, was 24? No, Kanchan is 13 wait 2. 24 wait 3.)
        // Let's say Shuntsu is [1,2,3] (2m,3m,4m indices). Win on 3 (4m).
        // Wait was 2m,4m wait 3m. Kanchan.
        // Indices: 1,3 wait 2.

        const struct = createStructure(
            [
                mKoutsu([27, 27, 27], false), // East Closed (8 Fu)
                mShuntsu([1, 2, 3]), // 234m. Win 3m (idx 2).
                mShuntsu([4, 5, 6]),
                mShuntsu([7, 8, 9])
            ],
            jantou([25, 25]),
            2 // 3m. In 234m ([1,2,3]), 3m is idx 2. Is middle? No 1=2m, 2=3m, 3=4m. 3m is middle.
            // Wait, 1,2,3 corresponds to 2m,3m,4m. 3m is index 1.
            // MachiFu logic: if idx == 1 -> Kanchan (+2).
        );

        const config = createConfig({ isTsumo: false });
        // Base 20 + Menzen 10 + Koutsu 8 + Machi 2 = 40.
        expect(calculateFu(struct, config, createGameRules())).toBe(40);
    });
});

describe("calculateTensu", () => {
    test("Mangan (Dealer Ron 12000)", () => {
        // 4 Han 40 Fu -> Mangan?
        // 40 * 2^(2+4) = 40 * 64 = 2560 > 2000. Mangan.
        const res = calculateTensu(4, 40, createConfig({ isOya: true, isTsumo: false }));
        expect(res.total).toBe(12000);
        expect(res.payment.main).toBe(12000);
    });

    test("Haneman (Non-Dealer Tsumo 3000/6000)", () => {
        // 6 Han -> Haneman.
        // Non-Dealer Tsumo.
        // Dealer pays 6000 (2x), Child pays 3000 (1x).
        // Application: Main=6000, Additional=3000.
        const res = calculateTensu(6, 30, createConfig({ isOya: false, isTsumo: true }));
        expect(res.yakuLevel).toBe("haneman");
        expect(res.total).toBe(12000); // 6000 + 3000*2 = 12000
        expect(res.payment.main).toBe(6000);
        expect(res.payment.additional).toBe(3000);
    });
});
