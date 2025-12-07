import { detectAgari } from '../src/agari';
import { HandConfig, YakuName } from '../src/types/yaku';
import { GameRules } from '../src/types/game';
import { mpszStringToHaiCounts } from '../src/hai';
import { describe, test, expect } from 'vitest';

// Helper to create basic config
const createConfig = (): HandConfig => ({
    isTsumo: false,
    isRiichi: false,
    isIppatsu: false,
    isRinshan: false,
    isChankan: false,
    isHaitei: false,
    isHoutei: false,
    isDoubleRiichi: false,
    isTenhou: false,
    isChiihou: false,
    bakaze: 27, // East
    jikaze: 27, // East
    doraTiles: [],
    uraDoraTiles: []
});

const createGameRules = (): GameRules => ({
    hasAkaDora: false,
    hasKuitan: true
});

describe('detectAgari', () => {
    test('Tanyao Hand (Simple)', () => {
        // 234m 234p 234s 888s 66p (Win on 6p)
        // 888s is a triplet, so No Pinfu.
        const hand = mpszStringToHaiCounts('234m234p234s888s66p');
        const config = createConfig();
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 14, config, rules); // 14 is 6p

        expect(yakuList.length).toBeGreaterThan(0);
        expect(yakuList.sort()).toEqual(['Tanyao']);
    });

    test('Pinfu Hand (Simple)', () => {
        // 123m 456p 789s 23m 99p. Win 1m (0).
        // Contains Terminals (1m, 9s, 9p), so No Tanyao.
        const hand = mpszStringToHaiCounts('123m456p789s23m99p1m'); // Added 1m to complete
        const config = createConfig();
        config.jikaze = 28; // South (Head is 9p, safe)
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 0, config, rules); // 0 is 1m

        expect(yakuList.sort()).toEqual(['Pinfu']);
    });

    test('Tanyao + Pinfu Hand', () => {
        // 234m 345p 456s 67p 22s. Win 8p.
        const hand = mpszStringToHaiCounts('234m345p456s67p22s8p'); // Added 8p
        const config = createConfig();
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 16, config, rules); // 16 is 8p

        // Should return Tanyao + Pinfu
        expect(yakuList.sort()).toEqual(['Pinfu', 'Tanyao']);
    });

    test('Yakuhai Hand (White Dragon)', () => {
        const hand = mpszStringToHaiCounts('123m456p789s11z555z');
        const config = createConfig();
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 31, config, rules);
        expect(yakuList.sort()).toEqual(['Haku']);
    });

    test('No Yaku (Yaku Nashi)', () => {
        const hand = mpszStringToHaiCounts('123m123p123s999m11z');
        const config = createConfig();
        config.jikaze = 28; // South
        config.bakaze = 28; // South
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 0, config, rules);

        // Should return empty list because no valid yaku found
        expect(yakuList).toHaveLength(0);
    });

    test('Riichi Hand', () => {
        // Riichi + Tanyao
        const hand = mpszStringToHaiCounts('234m234p234s66p888s');
        const config = createConfig();
        config.isRiichi = true;
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 14, config, rules);
        expect(yakuList.sort()).toEqual(['Riichi', 'Tanyao']);
    });

    test('Menzen Tsumo Hand', () => {
        // Tsumo + Pinfu
        const hand = mpszStringToHaiCounts('123m456p789s23m99p1m');
        const config = createConfig();
        config.isTsumo = true;
        config.jikaze = 28; // South
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 0, config, rules); // Win on 1m
        expect(yakuList.sort()).toEqual(['MenzenTsumo', 'Pinfu']);
    });

    test('Riichi + Ippatsu + Tsumo Hand', () => {
        // Riichi + Ippatsu + Tsumo + Tanyao
        const hand = mpszStringToHaiCounts('234m234p234s66p888s');
        const config = createConfig();
        config.isRiichi = true;
        config.isIppatsu = true;
        config.isTsumo = true;
        const rules = createGameRules();

        const yakuList = detectAgari(hand, 14, config, rules);
        expect(yakuList.sort()).toEqual(['Ippatsu', 'MenzenTsumo', 'Riichi', 'Tanyao']);
    });

    test('detects Chinitsu correctly', () => {
        // Chinitsu Manzu Closed
        // 123m 456m 789m 222m 55m (14 tiles)
        const config = createConfig();
        config.isTsumo = true;
        const rules = createGameRules();
        let counts = mpszStringToHaiCounts('12345678922255m');
        let winTile = 4; // 5m

        const yakuList = detectAgari(counts, winTile, config, rules);

        // At least one interpretation should be Chinitsu + Tsumo
        expect(yakuList).toContain(YakuName.Chinitsu);
        expect(yakuList).toContain(YakuName.MenzenTsumo);
    });

    test('detects Honitsu correctly', () => {
        // Honitsu Manzu + Honors
        const config = createConfig();
        const rules = createGameRules();
        let counts = mpszStringToHaiCounts('123456789m11122z');
        let winTile = 27; // 1z

        const yakuList = detectAgari(counts, winTile, config, rules);

        // Should detect Honitsu
        expect(yakuList).toContain(YakuName.Honitsu);
        // Should NOT be Chinitsu anywhere
        expect(yakuList).not.toContain(YakuName.Chinitsu);
    });
});
