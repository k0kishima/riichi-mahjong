import { describe, expect, test } from "vitest";
import { detectAgari } from "../src/agari";
import { mpszStringToHaiCounts } from "../src/hai";
import type { GameRules } from "../src/types/game";
import {
	type AgariConfig,
	type Mentsu,
	MentsuType,
	YakuName,
} from "../src/types/yaku";

// Helper to create basic config
const createAgariConfig = (): AgariConfig => ({
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
	isOya: false, // Default
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
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 14, config, rules); // 14 is 6p

		expect(yakuList.length).toBeGreaterThan(0);
		expect(yakuList.sort()).toEqual(["SanshokuDoujun", "Tanyao"]);
	});

	test("Pinfu Hand (Simple) + Iipeiko", () => {
		// 123m 456p 789s 23m 99p. Win 1m (0).
		// 123m + 123m (from 23m+1m) -> Iipeiko!
		const hand = mpszStringToHaiCounts("123m456p789s23m99p1m"); // Added 1m to complete
		const config = createAgariConfig();
		config.jikaze = 28; // South (Head is 9p, safe)
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 0, config, rules); // 0 is 1m

		expect(yakuList.sort()).toEqual(["Iipeiko", "Pinfu"]);
	});

	test("Tanyao + Pinfu Hand", () => {
		// 234m 345p 456s 67p 22s. Win 8p.
		const hand = mpszStringToHaiCounts("234m345p456s67p22s8p"); // Added 8p
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 16, config, rules); // 16 is 8p

		// Should return Tanyao + Pinfu
		expect(yakuList.sort()).toEqual(["Pinfu", "Tanyao"]);
	});

	test("Yakuhai Hand (White Dragon)", () => {
		const hand = mpszStringToHaiCounts("123m456p789s11z555z");
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 31, config, rules);
		expect(yakuList.sort()).toEqual(["Haku"]);
	});

	test("No Yaku (Yaku Nashi)", () => {
		// Changed hand to avoid Sanshoku/Iipeiko
		// 123m 456p 789s 999m 11z
		const hand = mpszStringToHaiCounts("123m456p789s999m11z");
		const config = createAgariConfig();
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
		const config = createAgariConfig();
		config.isRiichi = true;
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 14, config, rules);
		expect(yakuList.sort()).toEqual(["Riichi", "SanshokuDoujun", "Tanyao"]);
	});

	test("Menzen Tsumo Hand + Iipeiko", () => {
		// Tsumo + Pinfu + Iipeiko
		const hand = mpszStringToHaiCounts("123m456p789s23m99p1m");
		const config = createAgariConfig();
		config.isTsumo = true;
		config.jikaze = 28; // South
		const rules = createGameRules();

		const yakuList = detectAgari(hand, 0, config, rules); // Win on 1m
		expect(yakuList.sort()).toEqual(["Iipeiko", "MenzenTsumo", "Pinfu"]);
	});

	test("Riichi + Ippatsu + Tsumo Hand + Sanshoku", () => {
		// Riichi + Ippatsu + Tsumo + Tanyao + Sanshoku
		const hand = mpszStringToHaiCounts("234m234p234s66p888s");
		const config = createAgariConfig();
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
		const config = createAgariConfig();
		config.isTsumo = true;
		const rules = createGameRules();
		const counts = mpszStringToHaiCounts("12345678922255m");
		const agariHai = 4; // 5m

		const yakuList = detectAgari(counts, agariHai, config, rules);

		// At least one interpretation should be Chinitsu + Tsumo
		expect(yakuList).toContain(YakuName.Chinitsu);
		expect(yakuList).toContain(YakuName.MenzenTsumo);
	});

	test("detects Honitsu correctly", () => {
		// Honitsu Manzu + Honors
		const config = createAgariConfig();
		const rules = createGameRules();
		const counts = mpszStringToHaiCounts("123456789m11122z");
		const agariHai = 27; // 1z

		const yakuList = detectAgari(counts, agariHai, config, rules);

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

		const config = createAgariConfig();
		const rules = createGameRules();

		const kantsu1: Mentsu = {
			type: MentsuType.Kantsu,
			tiles: [0, 0, 0, 0],
			isOpen: false,
		};
		const kantsu2: Mentsu = {
			type: MentsuType.Kantsu,
			tiles: [9, 9, 9, 9],
			isOpen: false,
		};
		const kantsu3: Mentsu = {
			type: MentsuType.Kantsu,
			tiles: [18, 18, 18, 18],
			isOpen: false,
		};

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
		const config = createAgariConfig();
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
		const config = createAgariConfig();
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
		const config = createAgariConfig();
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
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 27, config, rules); // Win on 11z (index 27)
		expect(yakuList).toContain(YakuName.Chanta);
		expect(yakuList).not.toContain(YakuName.Junchan);
	});

	test("detects Junchan", () => {
		// 123m 789p 123s 999s 11p. (No honors).
		const handStr = "123m789p123s999s11p";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createAgariConfig();
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
		const config = createAgariConfig();
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
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Shosangen);
	});

	test("detects Suuankou", () => {
		// 111m 333m 555p 777s 99s. Closed. Tsumo.
		const handStr = "111m333m555p777s99s";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createAgariConfig();
		config.isTsumo = true;
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Suuankou);
	});

	test("detects Daisangen", () => {
		// 555z 666z 777z 123m 99p.
		const handStr = "123m555z666z777z99p";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Daisangen);
	});

	test("detects Tsuiso", () => {
		// 111z 222z 333z 444z 55z.
		const handStr = "111z222z333z444z55z";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Tsuiso);
	});

	test("detects Chuuren Poutou", () => {
		// 1112345678999m + 1m.
		const handStr = "11112345678999m";
		const counts = mpszStringToHaiCounts(handStr);
		const config = createAgariConfig();
		const rules = createGameRules();

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.ChuurenPoutou);
	});

	// --- Situational Yaku Tests ---

	test("detects Rinshan Kaihou", () => {
		// Rinshan: Win on tile from dead wall after Kan. Counts as Tsumo.
		const config = createAgariConfig();
		config.isRinshan = true;
		config.isTsumo = true; // Rinshan implies Tsumo
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z"; // Valid hand
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Rinshan);
		expect(yakuList).toContain(YakuName.MenzenTsumo); // Usually combined if menzen
	});

	test("detects Chankan", () => {
		// Chankan: Win on tile added to Kong. Counts as Ron.
		const config = createAgariConfig();
		config.isChankan = true;
		config.isTsumo = false;
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Chankan);
	});

	test("detects Haitei (Tsumo)", () => {
		const config = createAgariConfig();
		config.isHaitei = true;
		config.isTsumo = true;
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Haitei);
		expect(yakuList).toContain(YakuName.MenzenTsumo);
	});

	test("detects Houtei (Ron)", () => {
		const config = createAgariConfig();
		config.isHoutei = true;
		config.isTsumo = false;
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Houtei);
	});

	test("detects Double Riichi", () => {
		const config = createAgariConfig();
		config.isDoubleRiichi = true;
		config.isRiichi = true; // Usually both checked in UI, or Double implies Riichi status
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.DoubleRiichi);
		// Should NOT contain Single Riichi (Exclusive)
		expect(yakuList).not.toContain(YakuName.Riichi);
	});

	test("Double Riichi + Ippatsu", () => {
		const config = createAgariConfig();
		config.isDoubleRiichi = true;
		config.isRiichi = true;
		config.isIppatsu = true;
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.DoubleRiichi);
		expect(yakuList).toContain(YakuName.Ippatsu);
		expect(yakuList).not.toContain(YakuName.Riichi);
	});

	test("detects Tenhou (Yakuman)", () => {
		const config = createAgariConfig();
		config.isTenhou = true;
		config.isTsumo = true;
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Tenhou);
	});

	test("detects Chiihou (Yakuman)", () => {
		const config = createAgariConfig();
		config.isChiihou = true;
		config.isTsumo = true;
		const rules = createGameRules();
		const handStr = "123m456p789s11z222z33z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Chiihou);
	});

	// --- Composite Yaku Tests ---

	test("Riichi + Pinfu + Tsumo (Standard)", () => {
		const config = createAgariConfig();
		config.isRiichi = true;
		config.isTsumo = true;
		config.jikaze = 28; // South (Non-value head)
		const rules = createGameRules();
		const handStr = "123m456p789s23m99p"; // 23m waiting for 1m or 4m. 99p head.
		const counts = mpszStringToHaiCounts(handStr + "1m"); // Win on 1m
		const agariHai = 0; // 1m

		const yakuList = detectAgari(counts, agariHai, config, rules);
		expect(yakuList).toContain(YakuName.Riichi);
		expect(yakuList).toContain(YakuName.Pinfu);
		expect(yakuList).toContain(YakuName.MenzenTsumo);
	});

	test("Chanta + Sanshoku + Yakuhai", () => {
		// 123m 123p 123s 111z 22z. Win 22z (or any).
		// Chanta (Terminals/Honors in each)
		// Sanshoku (123 mps)
		// Yakuhai (East 1z - if Bakaze/Jikaze)
		const config = createAgariConfig();
		config.bakaze = 27; // East
		const rules = createGameRules();
		const handStr = "123m123p123s111z22z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules); // Win on 1m? No, need to win on valid tile.
		// Wait, detectAgari(counts, winTile).
		// winTile needs to be a valid tile index. 0 is 1m.
		// 123m123p123s111z22z.
		// 1m is in the hand, so it's fine as a win tile?
		// But if we win on 1m, the pair is 22z.
		// 123m -> 1m is terminal. 123p -> 1p terminal. 123s -> 1s terminal. 111z -> East (Honor).
		// 22z -> South (Honor).
		// All groups have terminal/honor. Chanta OK.
		// Sanshoku 123 OK.
		// Yakuhai (East) OK.
		// Win can be 1m (0).

		expect(yakuList).toContain(YakuName.Chanta);
		expect(yakuList).toContain(YakuName.SanshokuDoujun);
		expect(yakuList).toContain(YakuName.Bakaze); // 111z is East Pung
	});

	test("Honitsu + Yakuhai + Toitoi", () => {
		// 111m 444m 777m 111z 22z.
		// Honitsu (Manzu + Honors)
		// Toitoi (All Triples)
		// Yakuhai (East 1z)
		const config = createAgariConfig();
		config.bakaze = 27;
		const rules = createGameRules();
		const handStr = "111m444m777m111z22z";
		const counts = mpszStringToHaiCounts(handStr);

		const yakuList = detectAgari(counts, 0, config, rules);
		expect(yakuList).toContain(YakuName.Honitsu);
		expect(yakuList).toContain(YakuName.Toitoi);
		expect(yakuList).toContain(YakuName.Bakaze);
	});
});
