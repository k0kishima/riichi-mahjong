import { describe, expect, test } from "vitest";
import { detectAgari } from "../src/agari";
import { mpszStringToHaiCounts } from "../src/hai";
import type { GameRules } from "../src/types/game";
import { type HandConfig, YakuName } from "../src/types/yaku";

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
	uraDoraTiles: [],
});

const createGameRules = (): GameRules => ({
	hasAkaDora: false,
	hasKuitan: true,
});

describe("detectAgari", () => {
	test("Tanyao Hand (Simple) + Sanshoku", () => {
		// 234m 234p 234s 888s 66p (Win on 6p)
		// 888s is a triplet, so No Pinfu.
		// 234m, 234p, 234s -> Sanshoku Doujun!
		const hand = mpszStringToHaiCounts("234m234p234s888s66p");
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 14, config, rules); // 14 is 6p

		expect(yakuList.length).toBeGreaterThan(0);
		expect(yakuList.sort()).toEqual(["SanshokuDoujun", "Tanyao"]);
	});

	test("Pinfu Hand (Simple) + Iipeiko", () => {
		// 123m 456p 789s 23m 99p. Win 1m (0).
		// 123m + 123m (from 23m+1m) -> Iipeiko!
		const hand = mpszStringToHaiCounts("123m456p789s23m99p1m"); // Added 1m to complete
		const config = createConfig();
		config.jikaze = 28; // South (Head is 9p, safe)
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 0, config, rules); // 0 is 1m

		expect(yakuList.sort()).toEqual(["Iipeiko", "Pinfu"]);
	});

	test("Tanyao + Pinfu Hand", () => {
		// 234m 345p 456s 67p 22s. Win 8p.
		const hand = mpszStringToHaiCounts("234m345p456s67p22s8p"); // Added 8p
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 16, config, rules); // 16 is 8p

		// Should return Tanyao + Pinfu
		expect(yakuList.sort()).toEqual(["Pinfu", "Tanyao"]);
	});

	test("Yakuhai Hand (White Dragon)", () => {
		const hand = mpszStringToHaiCounts("123m456p789s11z555z");
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 31, config, rules);
		expect(yakuList.sort()).toEqual(["Haku"]);
	});

	test("No Yaku (Yaku Nashi)", () => {
		// Changed hand to avoid Sanshoku/Iipeiko
		// 123m 456p 789s 999m 11z
		const hand = mpszStringToHaiCounts("123m456p789s999m11z");
		const config = createConfig();
		config.jikaze = 28; // South
		config.bakaze = 28; // South
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 0, config, rules);

		// Should return empty list because no valid yaku found
		expect(yakuList).toHaveLength(0);
	});

	test("Riichi Hand + Sanshoku", () => {
		// Riichi + Tanyao + Sanshoku
		const hand = mpszStringToHaiCounts("234m234p234s66p888s");
		const config = createConfig();
		config.isRiichi = true;
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 14, config, rules);
		expect(yakuList.sort()).toEqual(["Riichi", "SanshokuDoujun", "Tanyao"]);
	});

	test("Menzen Tsumo Hand + Iipeiko", () => {
		// Tsumo + Pinfu + Iipeiko
		const hand = mpszStringToHaiCounts("123m456p789s23m99p1m");
		const config = createConfig();
		config.isTsumo = true;
		config.jikaze = 28; // South
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 0, config, rules); // Win on 1m
		expect(yakuList.sort()).toEqual(["Iipeiko", "MenzenTsumo", "Pinfu"]);
	});

	test("Riichi + Ippatsu + Tsumo Hand + Sanshoku", () => {
		// Riichi + Ippatsu + Tsumo + Tanyao + Sanshoku
		const hand = mpszStringToHaiCounts("234m234p234s66p888s");
		const config = createConfig();
		config.isRiichi = true;
		config.isIppatsu = true;
		config.isTsumo = true;
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 14, config, rules);
		expect(yakuList.sort()).toEqual([
			"Ippatsu",
			"MenzenTsumo",
			"Riichi",
			"SanshokuDoujun",
			"Tanyao",
		]);
	});

	test("detects Chinitsu correctly", () => {
		// Chinitsu Manzu Closed
		// 123m 456m 789m 222m 55m (14 tiles)
		const config = createConfig();
		config.isTsumo = true;
		const rules = createGameRules();
		const counts = mpszStringToHaiCounts("12345678922255m");
		const winTile = 4; // 5m

		const yakuList = detectAgari(counts, winTile, config, rules);

		// At least one interpretation should be Chinitsu + Tsumo
		expect(yakuList).toContain(YakuName.Chinitsu);
		expect(yakuList).toContain(YakuName.MenzenTsumo);
	});

	test("detects Honitsu correctly", () => {
		// Honitsu Manzu + Honors
		const config = createConfig();
		const rules = createGameRules();
		const counts = mpszStringToHaiCounts("123456789m11122z");
		const winTile = 27; // 1z

		const yakuList = detectAgari(counts, winTile, config, rules);

		// Should detect Honitsu
		expect(yakuList).toContain(YakuName.Honitsu);
		// Should NOT be Chinitsu anywhere
		expect(yakuList).not.toContain(YakuName.Chinitsu);
	});
	test("detects Sankantsu", () => {
		// 3 Quads.
		// Needs MentsuType.Kantsu. decomposeHand handles Kantsu if counts[i] >= 4?
		// Current decomposeHand prioritizes (tries) Koutsu then Shuntsu.
		// It does NOT automatically form Kantsu unless we add logic or pass fixed Kantsu.
		// Ideally, for closed hand, we treat 4 tiles as Kantsu only if declared?
		// "Concealed Kong" must be declared.
		// For Agari detection on purely "counts", we usually treat 4 identical tiles as "3 + 1" or "2 + 2" or "Kantsu (if flag)".
		// Since `decomposeHand` doesn't support "Guessing Kantsu" (it assumes Kantsu are passed as fixed melds or explicitly formed if logic changed).
		// My `decomposeHand` tries Koutsu (3).
		// If I pass `fixedMelds` with Kantsu, it should work.
		// Let's assume the user has declared Ankan/Minkan.

		const config = createConfig();
		const rules = createGameRules();

		const kantsu1: import("../src/types/yaku").Mentsu = {
			type: "kantsu",
			tiles: [0, 0, 0, 0],
			isOpen: false,
		};
		const kantsu2: import("../src/types/yaku").Mentsu = {
			type: "kantsu",
			tiles: [9, 9, 9, 9],
			isOpen: false,
		};
		const kantsu3: import("../src/types/yaku").Mentsu = {
			type: "kantsu",
			tiles: [18, 18, 18, 18],
			isOpen: false,
		};

		// Hand: 1111m 1111p 1111s 22z (Head).
		// Kantsu passed as fixed (though Ankan is "fixed" in structure).

		// Remaining hand: 22z.
		const handStr = "22z";
		const _counts = mpszStringToHaiCounts(handStr); // only 2 tiles left effectively?
		// Wait, detectAgari expects full counts?
		// "haiCounts" + "melds" -> decomposeHand combines them?
		// decomposeHand(haiCounts, winTile, fixedMelds).
		// Logic: finds head from counts...
		// If fixedMelds has 3, need 1 more from counts.
		// If I pass 22z in counts, it finds head 22z.
		// Total mentsu = 3 (fixed) + 0 (found) = 3? Invalid.
		// Need 4 mentsu.
		// Hand: 3 Kantsu + 1 Shuntsu/Koutsu + Head.
		// Let's add 1 Shuntsu [1,2,3]m.
		// 123m 22z.

		const counts2 = mpszStringToHaiCounts("123m22z");
		const yakuList = detectAgari(counts2, 0, config, rules, [
			kantsu1,
			kantsu2,
			kantsu3,
		]);

		expect(yakuList).toContain(YakuName.Sankantsu);
	});

	test("detects Sanshoku Doukou", () => {
		// 222m 222p 222s 888s 99p.
		const handStr = "222m222p222s888s99p";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.SanshokuDoukou);
		expect(yakuList).toContain(YakuName.Toitoi); // All Pon implies Toitoi
	});

	test("detects Chiitoitsu correctly", () => {
		// Use a hand that CANNOT be interpreted as Ryanpeiko
		// 11 11 33 55 77 99 m 22 p
		// This is 4 of 1m -> Chiitoitsu allows 4 of same if they are distinct pairs?
		// Standard rule: 4 of same tile is NOT 2 pairs for Chiitoitsu.
		// So use 11 33 55 77 99 m 22 44 p.
		const config = createConfig();
		const rules = createGameRules();
		const handStr = "1133557799m2244p";
		const counts = mpszStringToHaiCounts(handStr);
		// Win tile 2p (index 10)

		const yakuList = detectAgari(counts, 10, config, rules);
		expect(yakuList).toContain(YakuName.Chiitoitsu);
		expect(yakuList).not.toContain(YakuName.Ryanpeiko);
	});

	test("detects Kokushi Musou correctly", () => {
		// 19m 19p 19s 1234567z + 1m (Pair 1m)
		const config = createConfig();
		const rules = createGameRules();
		const handStr = "19m19p19s1234567z1m";
		const counts = mpszStringToHaiCounts(handStr);
		// Win tile 1m (0)

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.KokushiMusou);
	});

	test("detects Chanta", () => {
		// 123m 789p 123s 999s 11z.
		// Terminal/Honor in every block. Contains sequence.
		const handStr = "123m789p123s999s11z";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 27, config, rules); // Win on 11z (index 27)
		expect(yakuList).toContain(YakuName.Chanta);
		expect(yakuList).not.toContain(YakuName.Junchan);
	});

	test("detects Junchan", () => {
		// 123m 789p 123s 999s 11p. (No honors).
		const handStr = "123m789p123s999s11p";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 9, config, rules); // Win on 11p (index 9)
		expect(yakuList).toContain(YakuName.Junchan);
		expect(yakuList).not.toContain(YakuName.Chanta);
	});

	test("detects Honroto", () => {
		// 111m 999p 111s 999s 11z.
		// All Terminals/Honors. No Sequence.
		// Toitoi (2) + Honroto (2) + Yakuhai (1) + ...
		const handStr = "111m999p111s999s11z";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Honroto);
		expect(yakuList).toContain(YakuName.Toitoi);
	});

	test("detects Shosangen", () => {
		// 555z 666z 77z 123m 456p.
		// White+Green Triples. Red Pair.
		const handStr = "123m456p555z666z77z";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Shosangen);
	});

	test("detects Suuankou", () => {
		// 111m 333m 555p 777s 99s. Closed. Tsumo.
		const handStr = "111m333m555p777s99s";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		config.isTsumo = true;
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Suuankou);
	});

	test("detects Daisangen", () => {
		// 555z 666z 777z 123m 99p.
		const handStr = "123m555z666z777z99p";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Daisangen);
	});

	test("detects Tsuiso", () => {
		// 111z 222z 333z 444z 55z.
		const handStr = "111z222z333z444z55z";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Tsuiso);
	});

	test("detects Chuuren Poutou", () => {
		// 1112345678999m + 1m.
		const handStr = "11112345678999m";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.ChuurenPoutou);
	});
});
