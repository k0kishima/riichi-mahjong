import { describe, expect, test } from "vitest";
import { detectAgari } from "../src/agari";
import { mpszStringToHaiCounts } from "../src/hai";
import type { GameRules } from "../src/types/game";
import { type AgariConfig, type Mentsu, MentsuType } from "../src/types/yaku";

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
	bakaze: 27,
	jikaze: 27,
	doraTiles: [],
	uraDoraTiles: [],
});

const createRules = (): GameRules => ({
	hasAkaDora: false,
	hasKuitan: true, // Allow Open Tanyao
});

describe("calculateHandValue with Melds", () => {
	test("Open Tanyao Hand (with Melds)", () => {
		// Hand: 234m 66p 888s (In hand) + 222p (Open Pon)
		// Win on 6p (matches head) -> Wait... logic check.
		// Let's do: 234m 888s 66p (Head) + 222p (Pon)
		// Tiles in hand (10 tiles + win tile = 11? No.)
		// Total 14 tiles. 3 in meld. 11 in hand.
		// Hand: 234m 888s 66p 22p (wait 6p/2p? No let's keep it simple)
		// Hand: 234m 567s 66p (Head) + 222p(Pon)
		// Input `haiCounts` should ONLY contain the closed tiles?
		// Wait, standard practice is `haiCounts` has ALL tiles, or only closed?
		// Usually `haiCounts` is the full count of all 14 tiles for simple shanten,
		// BUT for open hands, we usually separate closed and open.
		// My implementation of `decomposeHand` takes `haiCounts`.
		// If I pass `fixedMelds`, I should REMOVE those tiles from `haiCounts` passed to `decomposeHand` logic?
		// Let's check `decomposeHand` logic.
		// It uses `counts` to find *remaining* mentsu.
		// FAIL: `decomposeHand` current implementation tries to find 4 mentsu from `haiCounts`.
		// If I pass `fixedMelds`, I simply start `mentsuList` with them.
		// But `haiCounts` still has 14 tiles?
		// If `haiCounts` has 14 tiles, `findMentsu` will find 4 MORE mentsu?
		// Total 4 + fixedMelds.length > 4.

		// CORRECTION NEEDED: `haiCounts` passed to `calculateHandValue` should probably be "tiles in hand" + "all tiles"?
		// Usually, for Agari Hantei:
		// Input: 14 tiles total.
		// Implementation:
		// `decomposeHand` iterates `counts`.
		// It finds `mentsu`.
		// If `fixedMelds` are passed, they count towards the 4.
		// BUT `counts` should NOT contain the fixed melds tiles if we don't want to find them again?
		// OR `decomposeHand` should match them?

		// Let's assume the user passes `haiCounts` representing the *closed* hand + win tile (14 - 3*k tiles),
		// and `melds` separately.
		// Let's verify this assumption by running a test where `haiCounts` excludes the meld.

		// 1p is Terminal -> No Tanyao. Let's use 2p (10).
		const meldTanyao: Mentsu = {
			type: MentsuType.Koutsu,
			tiles: [10, 10, 10], // 2p
			isOpen: true,
		};

		// Hand: 234m 345s 66p + 222p (Open)
		// Closed tiles: 234m 345s 66p (8 tiles). Need 1 more meld?
		// 4 mentsu total. 1 (Open) + 3 (Closed).
		// 234m (1), 345s (2), [Need 3rd], 66p (Head).
		// Let's add 888s (3).
		// Closed: 234m (1-3), 345s (11-13? No 0-8 m, 9-17 p, 18-26 s. 3s=20)
		// 234m: 1,2,3
		// 345s: 20,21,22
		// 888s: 25,25,25
		// 66p: 14,14 (Head)
		// Total 11 tiles.

		const closedLink = "234m345s888s66p";
		const closedHand = mpszStringToHaiCounts(closedLink);

		const config = createAgariConfig();
		const rules = createRules();

		const yakuList = detectAgari(closedHand, 14, config, rules, [meldTanyao]);

		expect(yakuList).toContain("Tanyao");
	});

	test("Open Tanyao Hand (Kuitan Disabled)", () => {
		const meldTanyao: Mentsu = {
			type: MentsuType.Koutsu,
			tiles: [10, 10, 10], // 2p
			isOpen: true,
		};

		const closedLink = "234m345s888s66p";
		const closedHand = mpszStringToHaiCounts(closedLink);

		const config = createAgariConfig();
		const rules = createRules();
		rules.hasKuitan = false; // Disable Kuitan

		const yakuList = detectAgari(closedHand, 14, config, rules, [meldTanyao]);

		expect(yakuList).not.toContain("Tanyao");
		expect(yakuList).toHaveLength(0); // Assuming no other yaku
	});
});
