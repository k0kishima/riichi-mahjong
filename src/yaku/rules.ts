import type { GameRules } from "@/types/game";
import {
	type AgariConfig,
	type Mentsu,
	MentsuType,
	type TehaiStructure,
	YakuName,
} from "@/types/yaku";

/**
 * Definition of a Yaku Rule.
 */
export interface YakuRule {
	name: YakuName;
	hanOpen: number;
	hanClosed: number;
	isYakuman: boolean;
	/**
	 * Checks if the yaku condition is met.
	 */
	check: (
		tehai: TehaiStructure,
		config: AgariConfig,
		rules: GameRules,
	) => boolean;
}

/**
 * Yaku Rules Collection.
 */
export const YakuRules = {
	/**
	 * Tanyao (All Simples).
	 * (断幺九)
	 */
	Tanyao: {
		name: YakuName.Tanyao,
		hanOpen: 1,
		hanClosed: 1,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			rules: GameRules,
		): boolean => {
			// Check for Kuitan rule
			const isHandOpen = tehai.mentsu.some((m) => m.isOpen);
			if (isHandOpen && !rules.hasKuitan) {
				return false;
			}

			// Check tiles in mentsu
			for (const mentsu of tehai.mentsu) {
				for (const tile of mentsu.tiles) {
					if (isTerminalOrHonor(tile)) return false;
				}
			}

			// Check tiles in head
			for (const tile of tehai.jantou.tiles) {
				if (isTerminalOrHonor(tile)) return false;
			}

			return true;
		},
	} as YakuRule,

	/**
	 * Pinfu (Flat Hand).
	 * (平和)
	 */
	Pinfu: {
		name: YakuName.Pinfu,
		hanOpen: 0, // Menzen only
		hanClosed: 1,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Must be closed (Menzen)
			if (tehai.mentsu.some((m) => m.isOpen)) return false;

			// All mentsu must be Shuntsu
			if (tehai.mentsu.some((m) => m.type !== MentsuType.Shuntsu)) return false;

			// Head must NOT be value tile (Yakuhai)
			const headTile = tehai.jantou.tiles[0];
			// Dragon tiles (31, 32, 33) are always value tiles
			if (headTile >= 31 && headTile <= 33) return false;
			// Seat Wind (Jikaze) is value tile
			if (headTile === config.jikaze) return false;
			// Prevalent Wind (Bakaze) is value tile
			if (headTile === config.bakaze) return false;

			// Must be Ryanmen wait (Two-sided)
			// Note: decomposeHand doesn't perfectly identify wait types yet,
			// but we can infer it if we know the winTile and the structure.
			// For Pinfu check in this context, we usually assume the structure "could" be interpreted as Pinfu
			// if the winning tile completes a shuntsu in a ryanmen way.
			// Simplified check:
			// 1. Find the mentsu that contains the winTile
			// 2. Check if it's a Shuntsu formed such that winTile completes 2-side wait
			// e.g. 23(4), (3)45, etc.
			// Edge wait (12(3), (7)89) or Closed/Center wait (2(4)6 -> 13(2)) are not Ryanmen.

			// Since we don't have explicit "which tile completed which group" mapping in `HandStructure` easily available
			// without re-matching `winTile` to `mentsu`, we iterate.
			// Note: This logic assumes `winTile` is one of the tiles in the hand.
			// Strict Pinfu check requires knowing EXACTLY which group was completed by the win tile.
			// `decomposeHand` returns completed structures.
			// We need to check if ANY Shuntsu containing winTile COULD be a Ryanmen wait.

			// Ryanmen check Logic:
			// Win tile is T. Shuntsu is [A, B, C].
			// If T is A (first), then B=A+1, C=A+2. Valid if A is not 7 (since 7-8-9 wait on 9 is edge/penchan).
			// Actually, if T is A, wait was on A. Shuntsu [A, A+1, A+2]. pair was A+1, A+2.
			// Wait, Ryanmen is waiting for 1 or 4 for 2-3.
			// If win tile is A, and shuntsu is [A, A+1, A+2], then previous state was [A+1, A+2].
			// This is valid Ryanmen if A+1 is not 8 or 9 (impossible) and A+1 is not 1 (impossible).
			// Wait, 1-2 waiting for 3 is valid (3 is win tile).
			// 8-9 waiting for 7 is valid (7 is win tile).
			// 1-2 waiting for 3: Pair [1,2], Win 3. Shuntsu [1,2,3]. Win tile is index 2.
			// 2-3 waiting for 1: Pair [2,3], Win 1. Shuntsu [1,2,3]. Win tile is index 0.
			// 2-3 waiting for 4: Pair [2,3], Win 4. Shuntsu [2,3,4]. Win tile is index 2.

			// Ryanmen means:
			// - Winning tile completes a Shuntsu.
			// - If WinTile is the defined "First" (lowest) of Shuntsu [S, S+1, S+2]:
			//   - It must be that the wait was on S and S+3? No.
			//   - If we have [S+1, S+2] in hand, we wait for S or S+3.
			//   - We won on S. This is valid Ryanmen UNLESS [S+1, S+2] is [8,9] (waiting for 7 is OK) -> [1,2] waiting for 3 is OK.
			//   - Wait, specific example: Hand [8,9]. Waits for 7. Win on 7.
			//     Shuntsu becomes [7,8,9]. Win tile is 7 (lowest).
			//     Is [8,9] a ryanmen? NO. It's Penchan (Edge).
			//     Wait, [8,9] waits for 7. This is Side/Edge wait.
			//     [1,2] waits for 3. This is Side/Edge wait.
			//     Ryanmen is waiting for *two* sides. e.g. [2,3] waits for 1 or 4.
			//     So if we win on 1 (completing 1-2-3), the wait was [2,3]. This IS Ryanmen.
			//     If we win on 4 (completing 2-3-4), the wait was [2,3]. This IS Ryanmen.
			//     If we win on 3 (completing 1-2-3), and wait was [1,2], that is PENCHAN (Edge).
			//     If we win on 7 (completing 7-8-9), and wait was [8,9], that is PENCHAN (Edge).

			// So:
			// If WinTile is S (lowest of [S, S+1, S+2]):
			//   - Valid Ryanmen if S is NOT 7 (which forms 7-8-9) ??
			//   - No. [2,3] waits for 1, 4.
			//   - If win is 1 (S), then Shuntsu is [1,2,3]. Wait was [2,3].
			//   - Is [2,3] Ryanmen? Yes.
			//   - If win is 7 (S), then Shuntsu is [7,8,9]. Wait was [8,9].
			//   - Is [8,9] Ryanmen? No, it's Penchan.
			//   - So if WinTile is S (lowest), it is Ryanmen ONLY IF S < 7. (1..6)
			//   - AND S cannot be part of 1-2-3 waiting on 3... Wait.
			//   - Let's trace carefully:
			//     - Win 1 for [1,2,3]: Wait [2,3]. Ryanmen? Yes, waits for 1,4. (OK).
			//     - Win 4 for [4,5,6]: Wait [5,6]. Ryanmen? Yes, waits for 4,7. (OK).
			//     - Win 7 for [7,8,9]: Wait [8,9]. Ryanmen? NO. Penchan. (Wait 7 only).
			//   - So if WinTile is Lowest (index 0 of Shuntsu), it's Ryanmen iff the Sequence doesn't end at 9?
			//     - [7,8,9] (Lowest 7). Ends at 9. Bad.
			//     - [6,7,8] (Lowest 6). Ends at 8. Wait was [7,8]. Waits 6,9. OK.
			//     - So if WinTile is Lowest, OK if shuntsu.tiles[2] !== 9 (or simply lowest !== 6? No 6-7-8 is fine).
			//     - Correct logic: If WinTile is at index 0 (lowest) of sequence, it is valid Ryanmen IF sequence is NOT 1-2-3? No. 123 win on 1 is fine.
			//     - Wait, Penchan is [1,2] waiting for 3. Win on 3 (Highest).
			//     - Penchan is [8,9] waiting for 7. Win on 7 (Lowest).
			//     - So if WinTile is Lowest (0), it is BAD if it forms 7-8-9. (i.e. Lowest is 7 of a suit 0..8 -> index 6 count).
			//     - Indices: 1m=0 ... 9m=8.
			//     - [7,8,9] -> indices [6,7,8]. Win on 6. Wait [7,8]. Index 8 is 9m.
			//     - So if WinTile is Lowest (index 0), it is Ryanmen if tile is NOT 7 (index 6).
			//     - Wait, is 1-2-3 win on 1 (index 0) Ryanmen? Wait [2,3] -> 1,4. Yes.
			//     - So: Win=Lowest -> OK provided NOT 7-8-9 (i.e. Lowest != 7).

			// If WinTile is Highest (index 2 of [S, S+1, S+2]):
			//   - Win 3 for [1,2,3]: Wait [1,2]. Ryanmen? NO. Penchan. (Wait 3 only).
			//   - Win 6 for [4,5,6]: Wait [4,5]. Ryanmen? Yes, waits 3,6.
			//   - Win 9 for [7,8,9]: Wait [7,8]. Ryanmen? Yes, waits 6,9.
			//   - So if WinTile is Highest, it is Ryanmen if tile is NOT 3 (index 2)?
			//   - Indices: [0,1,2]. Win 2 (3m). Wait [0,1]. Bad.
			//   - [3,4,5]. Win 5 (6m). Wait [3,4]. OK.
			//   - So: Win=Highest -> OK provided NOT 1-2-3 (i.e. Highest != 3).

			// If WinTile is Middle (index 1):
			//   - Win 2 for [1,2,3]. Wait [1,3]. Kanchan. Always BAD.

			const winTile = tehai.agariHai;
			// Check if winTile completes a Shuntsu in Ryanmen way
			let hasRyanmen = false;

			for (const m of tehai.mentsu) {
				if (m.type !== MentsuType.Shuntsu) continue;

				// Mentsu tiles are sorted? Usually yes.
				const tiles = [...m.tiles].sort((a, b) => a - b);

				// Check if winTile is in this shuntsu
				const indexInMentsu = tiles.indexOf(winTile);
				if (indexInMentsu === -1) continue;

				if (indexInMentsu === 0) {
					// Win on lowest tile.
					// Valid Ryanmen if it's NOT 7-8-9 (Lowest=6 in 0-indexed suit).
					// Actually check if tile[2] is 8 (9 in 0-idx)?
					// No. 7m is index 6. 7-8-9 is indices 6,7,8.
					// If win is 6 (7m), and shuntsu is 6,7,8.
					// Wait was 7,8. 7,8 waits for 6,9.
					// Wait, [8,9] waits for 7. [7,8] waits for 6,9.
					// Ah, [8,9] is indices 7,8.
					// [7,8] is indices 6,7.
					// If Shuntsu is [6,7,8] (7-8-9). Win on 6.
					// Wait was [7,8]. This logic of "Wait was X" assumes we stripped the win tile.
					// Yes. [7,8] waits for 6 or 9.
					// So winning on 6 IS Ryanmen.
					// Winning on 9 (index 8) IS Ryanmen.

					// Wait, what is Penchan?
					// [1,2] waiting for 3. (Indices 0,1 waiting for 2).
					// [8,9] waiting for 7. (Indices 7,8 waiting for 6).

					// So:
					// If Win on Lowest (0):
					//   - Case: Win 6 for [6,7,8]. Wait [7,8]. Ryanmen. OK.
					//   - Case: Win 0 for [0,1,2]. Wait [1,2]. Penchan? NO. [1,2] waits for 0,3. Ryanmen.
					//   - Wait, [1,2] is 2m,3m. Waits 1m,4m. OK.
					//   - The only "One-sided" edge wait involving Lowest is:
					//     - [8,9] waiting for 7. Win on 7 (Lowest).
					//     - Indices 7,8 waiting for 6. Win on 6.
					//     - So if Shuntsu is [6,7,8] (7-8-9). Win on 6.
					//     - Previous was [7,8]. [7,8] waits for 6,9. RYANMEN.
					//     - Wait, Penchan is specific to terminals.
					//     - 8-9 (Indices 7,8). Waits for 7.
					//     - So if Shuntsu is [6,7,8] (7-8-9), and we won on 6 (7m).
					//     - Wait was [7,8] (8m,9m)? No. [7,8] is 8m,9m.
					//     - Yes, 8m,9m waits for 7m. ONE SIDED.
					//     - Ah, 8-9 IS PENCHAN.
					//     - So winning on 7m (index 6) with [8,9] (indices 7,8) is Penchan.
					//     - Shuntsu is [6,7,8]. Win is 6.
					//     - So: If Win is Lowest (6), and Highest is 8 (9m) -> BAD.

					if (tiles[2] % 9 === 8) {
						// Highest is 9 (index 8)
						// This is 7-8-9. Win on 7. Bad.
					} else {
						hasRyanmen = true;
					}
				} else if (indexInMentsu === 2) {
					// Win on highest tile.
					// Case: Win 3 (Index 2) for [1,2,3] (0,1,2).
					// Wait was [0,1] (1-2). 1-2 waits for 3.
					// 1-2 is Penchan. ONE SIDED.
					// So: If Win is Highest (index 2, 3m), and Lowest is 1 (index 0, 1m) -> BAD.

					if (tiles[0] % 9 === 0) {
						// Lowest is 1 (index 0)
						// This is 1-2-3. Win on 3. Bad.
					} else {
						hasRyanmen = true;
					}
				}
				// Middle (Kanchan) is always false, handled by omission
			}

			return hasRyanmen;
		},
	} as YakuRule,

	/**
	 * Chinitsu (Pure Triple Chow).
	 * (清一色)
	 */
	Chinitsu: {
		name: YakuName.Chinitsu,
		hanOpen: 5,
		hanClosed: 6,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			];
			if (allTiles.length === 0) return false;

			const firstTile = allTiles[0];
			let targetSuit: "man" | "pin" | "sou";

			if (firstTile >= 0 && firstTile <= 8) targetSuit = "man";
			else if (firstTile >= 9 && firstTile <= 17) targetSuit = "pin";
			else if (firstTile >= 18 && firstTile <= 26) targetSuit = "sou";
			else return false; // First tile is Honor, can't be Chinitsu

			// Check all tiles are in the same suit range
			for (const tile of allTiles) {
				if (targetSuit === "man" && (tile < 0 || tile > 8)) return false;
				if (targetSuit === "pin" && (tile < 9 || tile > 17)) return false;
				if (targetSuit === "sou" && (tile < 18 || tile > 26)) return false;
			}
			return true;
		},
	} as YakuRule,

	/**
	 * Honitsu (Mixed Triple Chow).
	 * (混一色)
	 */
	Honitsu: {
		name: YakuName.Honitsu,
		hanOpen: 2,
		hanClosed: 3,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			];
			let hasHonor = false;
			let hasSuit = false;
			let targetSuit: "man" | "pin" | "sou" | null = null;

			for (const tile of allTiles) {
				if (tile >= 27) {
					hasHonor = true;
				} else {
					hasSuit = true;
					let currentSuit: "man" | "pin" | "sou";
					if (tile >= 0 && tile <= 8) currentSuit = "man";
					else if (tile >= 9 && tile <= 17) currentSuit = "pin";
					else currentSuit = "sou"; // 18-26

					if (targetSuit === null) {
						targetSuit = currentSuit;
					} else if (targetSuit !== currentSuit) {
						return false; // Mixed suits
					}
				}
			}

			// Honitsu requires both suit tiles and honor tiles
			return hasHonor && hasSuit;
		},
	} as YakuRule,

	/**
	 * Riichi (Reach).
	 * (立直)
	 */
	Riichi: {
		name: YakuName.Riichi,
		hanOpen: 0, // Menzen only
		hanClosed: 1,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;
			// If Double Riichi is valid, regular Riichi is not counted (or upgraded).
			return config.isRiichi && !config.isDoubleRiichi;
		},
	} as YakuRule,

	DoubleRiichi: {
		name: YakuName.DoubleRiichi,
		hanOpen: 0,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;
			return config.isDoubleRiichi;
		},
	} as YakuRule,

	Chankan: {
		name: YakuName.Chankan,
		hanOpen: 1,
		hanClosed: 1,
		isYakuman: false,
		check: (
			_tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			return config.isChankan;
		},
	} as YakuRule,

	Rinshan: {
		name: YakuName.Rinshan,
		hanOpen: 1,
		hanClosed: 1,
		isYakuman: false,
		check: (
			_tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			return config.isRinshan;
		},
	} as YakuRule,

	Haitei: {
		name: YakuName.Haitei,
		hanOpen: 1,
		hanClosed: 1,
		isYakuman: false,
		check: (
			_tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Haitei is Tsumo on last tile
			return config.isTsumo && config.isHaitei;
		},
	} as YakuRule,

	Houtei: {
		name: YakuName.Houtei,
		hanOpen: 1,
		hanClosed: 1,
		isYakuman: false,
		check: (
			_tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Houtei is Ron on last tile
			return !config.isTsumo && config.isHoutei;
		},
	} as YakuRule,

	KokushiMusou: {
		name: YakuName.KokushiMusou,
		hanOpen: 0, // closed only
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Check if structure is Kokushi
			if (
				tehai.mentsu.length === 1 &&
				tehai.mentsu[0].type === MentsuType.Kokushi
			) {
				return true;
			}
			return false;
		},
	} as YakuRule,

	Chiitoitsu: {
		name: YakuName.Chiitoitsu,
		hanOpen: 0, // closed only
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Check if structure is Chiitoitsu (6 Toitsu mentsu + 1 Head)
			if (
				tehai.mentsu.length === 6 &&
				tehai.mentsu.every((m) => m.type === MentsuType.Toitsu)
			) {
				return true;
			}
			return false;
		},
	} as YakuRule,

	/**
	 * Menzen Tsumo (Self Draw).
	 * (門前清自摸和)
	 */
	MenzenTsumo: {
		name: YakuName.MenzenTsumo,
		hanOpen: 0, // Menzen only
		hanClosed: 1,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;
			return config.isTsumo;
		},
	} as YakuRule,

	/**
	 * Ippatsu (One Shot).
	 * (一発)
	 */
	Ippatsu: {
		name: YakuName.Ippatsu,
		hanOpen: 0, // Menzen only (implied by Riichi)
		hanClosed: 1,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;
			// Ippatsu requires Riichi
			return config.isRiichi && config.isIppatsu;
		},
	} as YakuRule,
	/**
	 * Iipeiko (Twice the Same Shuntsu).
	 * (一盃口)
	 */
	Iipeiko: {
		name: YakuName.Iipeiko,
		hanOpen: 0, // Menzen Only
		hanClosed: 1,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;

			// Count identical shuntsu
			const shuntsuList = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Shuntsu,
			);
			// Sort by tile index for easy comparison
			const signatures = shuntsuList.map((m) => m.tiles.join(","));

			// Check for at least 1 pair
			const counts: Record<string, number> = {};
			for (const sig of signatures) {
				counts[sig] = (counts[sig] || 0) + 1;
			}

			let pairCount = 0;
			let hasQuad = false;
			for (const c of Object.values(counts)) {
				if (c >= 2) pairCount++;
				if (c === 4) hasQuad = true;
			}

			// Ryanpeiko check: If 2 pairs or 1 quad (4 same is 2 pairs), it's Ryanpeiko.
			// Iipeiko is valid ONLY if Ryanpeiko is NOT valid (to avoid double counting if summing logic is naive).
			// However, typically Iipeiko is returned, and Ryanpeiko (3 Han) replaces it if valid.
			// If we strictly want to implement Iipeiko as independent, we return true.
			// But detectAgari logic sums them?
			// "Ryanpeiko includes Iipeiko" -> Ryanpeiko (3 Han).
			// If we satisfy Ryanpeiko, we satisfy Iipeiko.
			// If we return both, we get 1+3=4 Han. Incorrect.
			// So Iipeiko must specifically exclude Ryanpeiko condition.

			const isRyanpeiko = pairCount === 2 || hasQuad;
			return pairCount >= 1 && !isRyanpeiko;
		},
	} as YakuRule,

	/**
	 * Ryanpeiko (Two Twice the Same Shuntsu).
	 * (二盃口)
	 */
	Ryanpeiko: {
		name: YakuName.Ryanpeiko,
		hanOpen: 0, // Menzen Only
		hanClosed: 3,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;

			const shuntsuList = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Shuntsu,
			);
			const signatures = shuntsuList.map((m) => m.tiles.join(","));
			const counts: Record<string, number> = {};
			for (const sig of signatures) {
				counts[sig] = (counts[sig] || 0) + 1;
			}

			let pairCount = 0;
			let hasQuad = false;
			for (const c of Object.values(counts)) {
				if (c >= 2) pairCount++;
				if (c === 4) hasQuad = true;
			}

			return pairCount === 2 || hasQuad;
		},
	} as YakuRule,

	/**
	 * Sanshoku Doujun (Three Color Straight).
	 * (三色同順)
	 */
	SanshokuDoujun: {
		name: YakuName.SanshokuDoujun,
		hanOpen: 1,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const shuntsuList = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Shuntsu,
			);
			if (shuntsuList.length < 3) return false;

			// We need 3 shuntsu with same number (x, x+9, x+18)
			// Map shuntsu to "Number" (0..8).
			const suitMap: Record<number, Set<number>> = {}; // Number -> Set of Suits (0,1,2)

			for (const m of shuntsuList) {
				const first = m.tiles[0]; // Assuming sorted [x, x+1, x+2]
				const num = first % 9;
				const suit = Math.floor(first / 9); // 0:man, 1:pin, 2:sou

				if (!suitMap[num]) suitMap[num] = new Set();
				suitMap[num].add(suit);
			}

			// Check if any number has all 3 suits
			return Object.values(suitMap).some(
				(suits) => suits.has(0) && suits.has(1) && suits.has(2),
			);
		},
	} as YakuRule,

	/**
	 * Ittsu (Pure Straight).
	 * (一気通貫)
	 */
	Ittsu: {
		name: YakuName.Ittsu,
		hanOpen: 1,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const shuntsuList = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Shuntsu,
			);
			if (shuntsuList.length < 3) return false;

			// Need 123, 456, 789 in SAME suit.
			// 123 (num 0), 456 (num 3), 789 (num 6).

			const suitGroups: Record<number, Set<number>> = {
				0: new Set(),
				1: new Set(),
				2: new Set(),
			};

			for (const m of shuntsuList) {
				const first = m.tiles[0];
				const num = first % 9;
				const suit = Math.floor(first / 9);
				if (suit >= 0 && suit <= 2) {
					suitGroups[suit].add(num);
				}
			}

			return Object.values(suitGroups).some(
				(nums) => nums.has(0) && nums.has(3) && nums.has(6),
			);
		},
	} as YakuRule,

	/**
	 * Toitoi (All Pon).
	 * (対々和)
	 */
	Toitoi: {
		name: YakuName.Toitoi,
		hanOpen: 2,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Must have 4 Koutsu/Kantsu
			return tehai.mentsu.every(
				(m) => m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu,
			);
		},
	} as YakuRule,

	/**
	 * Sanankou (Three Concealed Triplets).
	 * (三暗刻)
	 */
	Sanankou: {
		name: YakuName.Sanankou,
		hanOpen: 2,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			let ankouCount = 0;
			const winningTile = tehai.agariHai;

			// Count closed triplets
			const closedTriplets = tehai.mentsu.filter(
				(m) =>
					(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
					!m.isOpen,
			);
			ankouCount = closedTriplets.length;

			if (!config.isTsumo) {
				// Ron: The winning tile's group is treated as Open.
				// We must determine if the successful group was one of the triplets.
				// If the winning tile can be attributed to a Shuntsu or the Head,
				// we assume that was the win path to maximize Ankou count (High Score Principle).

				const tripletsWithWinTile = closedTriplets.filter((m) =>
					m.tiles.includes(winningTile),
				);

				if (tripletsWithWinTile.length > 0) {
					// Check if winTile exists in other struct components
					const inShuntsu = tehai.mentsu.some(
						(m) =>
							m.type === MentsuType.Shuntsu && m.tiles.includes(winningTile),
					);
					const inHead = tehai.jantou.tiles.includes(winningTile); // Tanki wait

					// If NOT in Shuntsu AND NOT in Head, it MUST be in a triplet.
					// We must sacrifice one triplet.
					if (!inShuntsu && !inHead) {
						ankouCount--;
					}
				}
			}

			return ankouCount >= 3;
		},
	} as YakuRule,

	/**
	 * Sankantsu (Three Quads).
	 * (三槓子)
	 */
	Sankantsu: {
		name: YakuName.Sankantsu,
		hanOpen: 2,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const kantsuCount = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Kantsu,
			).length;
			return kantsuCount >= 3;
		},
	} as YakuRule,

	/**
	 * Sanshoku Doukou (Three Color Triplets).
	 * (三色同刻)
	 */
	SanshokuDoukou: {
		name: YakuName.SanshokuDoukou,
		hanOpen: 2,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const koutsuList = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu,
			);
			if (koutsuList.length < 3) return false;

			const suitMap: Record<number, Set<number>> = {};

			for (const m of koutsuList) {
				const first = m.tiles[0];
				const num = first % 9;
				const suit = Math.floor(first / 9);

				if (suit >= 0 && suit <= 2) {
					// Ignore Honors (27+)
					if (!suitMap[num]) suitMap[num] = new Set();
					suitMap[num].add(suit);
				}
			}

			return Object.values(suitMap).some(
				(suits) => suits.has(0) && suits.has(1) && suits.has(2),
			);
		},
	} as YakuRule,
	/**
	 * Chanta (Terminal or Honor in Each Group).
	 * (混全帯幺九)
	 */
	Chanta: {
		name: YakuName.Chanta,
		hanOpen: 1,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Must contain at least one Shuntsu (otherwise it is Honroto)
			const hasShuntsu = tehai.mentsu.some(
				(m) => m.type === MentsuType.Shuntsu,
			);
			if (!hasShuntsu) return false;

			// Check if every block has at least one Terminal or Honor
			const allBlocks = [...tehai.mentsu, tehai.jantou];
			const valid = allBlocks.every((block) => {
				// If Shuntsu: must contain 1 or 9 (1-2-3 or 7-8-9)
				if ("type" in block && (block as Mentsu).type === MentsuType.Shuntsu) {
					return (block as Mentsu).tiles.some((t: number) => isTerminal(t)); // Honors can't be in Shuntsu
				}
				// If Head/Koutsu: must be Terminal or Honor
				return isTerminalOrHonor(block.tiles[0]);
			});

			if (!valid) return false;

			// Must NOT be Junchan (Pure Terminal). Chanta implies usually "Mixed".
			// If Junchan check passes, usually we return Junchan instead.
			// But here "Chanta" check just validates "Terminal OR Honor".
			// If it has NO Honors, it is Junchan.
			// If we implement exclusion STRICTLY:
			const hasHonor =
				tehai.mentsu.some((m) => m.tiles.some((t) => t >= 27)) ||
				tehai.jantou.tiles[0] >= 27;
			return hasHonor;
		},
	} as YakuRule,

	/**
	 * Junchan (Pure Terminal in Each Group).
	 * (純全帯幺九)
	 */
	Junchan: {
		name: YakuName.Junchan,
		hanOpen: 2,
		hanClosed: 3,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Must contain at least one Shuntsu (otherwise it is Chinroto)
			const hasShuntsu = tehai.mentsu.some(
				(m) => m.type === MentsuType.Shuntsu,
			);
			if (!hasShuntsu) return false;

			const allBlocks = [...tehai.mentsu, tehai.jantou];
			return allBlocks.every((block) => {
				if ("type" in block && (block as Mentsu).type === MentsuType.Shuntsu) {
					return (block as Mentsu).tiles.some((t: number) => isTerminal(t));
				}
				return isTerminal(block.tiles[0]); // Must be terminal (1,9)
			});
		},
	} as YakuRule,

	/**
	 * Honroto (All Terminals and Honors).
	 * (混老頭)
	 */
	Honroto: {
		name: YakuName.Honroto,
		hanOpen: 2,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Must NOT contain Shuntsu (All Pon/Head)
			// But Toitoi/Chiitoitsu structure required?
			// "All Terminals/Honors" implies no 2-8.
			// If 2-8 exist, false.
			// If Shuntsu exists, it must be 1-2-3 or 7-8-9 -> contains 2 or 8.
			// So Honroto = No Shuntsu + All tiles Terminal/Honor.

			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			];
			return allTiles.every((t) => isTerminalOrHonor(t));
		},
	} as YakuRule,

	/**
	 * Shosangen (Little Three Dragons).
	 * (小三元)
	 */
	Shosangen: {
		name: YakuName.Shosangen,
		hanOpen: 2,
		hanClosed: 2,
		isYakuman: false,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// 2 Dragon Koutsu + 1 Dragon Pair
			const dragonKoutsu = tehai.mentsu.filter(
				(m) =>
					(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
					m.tiles[0] >= 31 &&
					m.tiles[0] <= 33,
			).length;

			const headTile = tehai.jantou.tiles[0];
			const dragonHead = headTile >= 31 && headTile <= 33;

			return dragonKoutsu === 2 && dragonHead;
		},
	} as YakuRule,

	// --- YAKUMAN ---

	/**
	 * Suuankou (Four Concealed Triplets).
	 * (四暗刻)
	 */
	Suuankou: {
		name: YakuName.Suuankou,
		hanOpen: 0, // Closed only
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			// Must have 4 Closed Koutsu/Kantsu
			// If Ron, one triplet might be open?
			// Standard Rule:
			// - Shanpon wait: Tsumo = Suuankou. Ron = Sanankou + Toitoi (Win tile opens the triplet).
			// - Tanki wait: Win on Head. All 4 triplets are Ankou. Valid Suuankou (even Ron).

			const closedTriplets = tehai.mentsu.filter(
				(m) =>
					(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
					!m.isOpen,
			);

			if (closedTriplets.length < 4) return false; // Normally max 4.

			if (config.isTsumo) return true;

			// If Ron, check if winTile is in any triplet.
			// If winTile is in a triplet -> that triplet is Open -> 3 Ankou -> Fail.
			// If winTile is NOT in any triplet (i.e. Tanki wait on Head), then -> Success.

			// Note: If Tanki wait, winTile matches Head.
			// Can winTile ALSO match a triplet? (e.g. 555 555 666 777 + 5? No).
			// Assuming valid hand, if winTile completes Head, it strictly completes head.

			const winTile = tehai.agariHai;
			const tripletMatches = closedTriplets.some((m) =>
				m.tiles.includes(winTile),
			);

			// If any triplet matches winTile, it's treated as open on Ron.
			return !tripletMatches;
		},
	} as YakuRule,

	/**
	 * Daisangen (Big Three Dragons).
	 * (大三元)
	 */
	Daisangen: {
		name: YakuName.Daisangen,
		hanOpen: 13,
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const dragonKoutsu = tehai.mentsu.filter(
				(m) =>
					(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
					m.tiles[0] >= 31 &&
					m.tiles[0] <= 33,
			).length;
			return dragonKoutsu === 3;
		},
	} as YakuRule,

	/**
	 * Shousuushi (Little Four Winds).
	 * (小四喜)
	 */
	Shousuushi: {
		name: YakuName.Shousuushi,
		hanOpen: 13,
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const windKoutsu = tehai.mentsu.filter(
				(m) =>
					(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
					m.tiles[0] >= 27 &&
					m.tiles[0] <= 30,
			).length;
			const headTile = tehai.jantou.tiles[0];
			const windHead = headTile >= 27 && headTile <= 30;

			return windKoutsu === 3 && windHead;
		},
	} as YakuRule,

	/**
	 * Daisuushi (Big Four Winds).
	 * (大四喜)
	 */
	Daisuushi: {
		name: YakuName.Daisuushi,
		hanOpen: 13, // Double Yakuman? Usually treated as Yakuman (or Double). We set 13 here, maybe logic handles double elsewhere or just returns Yakuman.
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const windKoutsu = tehai.mentsu.filter(
				(m) =>
					(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
					m.tiles[0] >= 27 &&
					m.tiles[0] <= 30,
			).length;
			return windKoutsu === 4;
		},
	} as YakuRule,

	/**
	 * Tsuiso (All Honors).
	 * (字一色)
	 */
	Tsuiso: {
		name: YakuName.Tsuiso,
		hanOpen: 13,
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			];
			return allTiles.every((t) => t >= 27);
		},
	} as YakuRule,

	/**
	 * Chinroto (All Terminals).
	 * (清老頭)
	 */
	Chinroto: {
		name: YakuName.Chinroto,
		hanOpen: 13,
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			];
			return allTiles.every((t) => isTerminal(t));
		},
	} as YakuRule,

	/**
	 * Ryuiso (All Green).
	 * (緑一色)
	 */
	Ryuiso: {
		name: YakuName.Ryuiso,
		hanOpen: 13,
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			];
			// Green: 2,3,4,6,8 Sou + Hatsu (32).
			// Sou offset 18.
			// 2s=20, 3s=21, 4s=22, 6s=24, 8s=26.
			const greenMap = new Set([20, 21, 22, 24, 26, 32]);
			return allTiles.every((t) => greenMap.has(t));
		},
	} as YakuRule,

	/**
	 * Chuuren Poutou (Nine Gates).
	 * (九蓮宝燈)
	 */
	ChuurenPoutou: {
		name: YakuName.ChuurenPoutou,
		hanOpen: 0, // Closed only
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			if (tehai.mentsu.some((m) => m.isOpen)) return false;
			// Valid pattern: 1112345678999 in one suit + 1 extra in same suit.
			// Must be Chinitsu (one suit).
			const allTiles = [
				...tehai.mentsu.flatMap((m) => m.tiles),
				...tehai.jantou.tiles,
			].sort((a, b) => a - b);
			const first = allTiles[0];
			const suit = Math.floor(first / 9); // 0,1,2
			if (suit > 2) return false;

			// Check if all same suit
			if (!allTiles.every((t) => Math.floor(t / 9) === suit)) return false;

			// Normalize to 0-8
			const nums = allTiles.map((t) => t % 9);

			// Expected counts for base 9-gates:
			// 0: 3, 1..7: 1, 8: 3. Total 13.
			// Plus 1 extra.
			// We count frequencies.
			const freqs = Array(9).fill(0);
			for (const n of nums) freqs[n]++;

			// Check requirements
			if (freqs[0] < 3) return false;
			if (freqs[8] < 3) return false;
			for (let i = 1; i <= 7; i++) {
				if (freqs[i] < 1) return false;
			}
			return true;
		},
	} as YakuRule,

	/**
	 * Suukantsu (Four Quads).
	 * (四槓子)
	 */
	Suukantsu: {
		name: YakuName.Suukantsu,
		hanOpen: 13,
		hanClosed: 13,
		isYakuman: true,
		check: (
			tehai: TehaiStructure,
			_config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			const kantsuCount = tehai.mentsu.filter(
				(m) => m.type === MentsuType.Kantsu,
			).length;
			return kantsuCount === 4;
		},
	} as YakuRule,

	/**
	 * Tenhou (Heavenly Hand).
	 * (天和)
	 */
	Tenhou: {
		name: YakuName.Tenhou,
		hanOpen: 13, // Technically Closed implicitly (Dealer Tsumo on turn 1)
		hanClosed: 13,
		isYakuman: true,
		check: (
			_tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			return config.isTenhou;
		},
	} as YakuRule,

	/**
	 * Chiihou (Earthly Hand).
	 * (地和)
	 */
	Chiihou: {
		name: YakuName.Chiihou,
		hanOpen: 0, // Closed only (Non-dealer Tsumo on turn 1)
		hanClosed: 13,
		isYakuman: true,
		check: (
			_tehai: TehaiStructure,
			config: AgariConfig,
			_rules: GameRules,
		): boolean => {
			return config.isChiihou;
		},
	} as YakuRule,
};

function isTerminal(tile: number): boolean {
	// Terminals: 1 (0, 9, 18) or 9 (8, 17, 26)
	if (tile >= 27) return false;
	const n = tile % 9;
	return n === 0 || n === 8;
}

/**
 * Helper to check if tile is Terminal or Honor
 */
function isTerminalOrHonor(tile: number): boolean {
	// Honors: 27-33
	if (tile >= 27) return true;
	return isTerminal(tile);
}

/**
 * Factory for Yakuhai Rule
 */
export const createYakuhaiRule = (
	tileIndex: number,
	yakuName: YakuName,
): YakuRule => ({
	name: yakuName,
	hanOpen: 1,
	hanClosed: 1,
	isYakuman: false,
	check: (
		_tehai: TehaiStructure,
		_config: AgariConfig,
		_rules: GameRules,
	): boolean => {
		return _tehai.mentsu.some(
			(m) =>
				(m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
				m.tiles[0] === tileIndex,
		);
	},
});

/**
 * Returns a list of all appliable rules based on the hand configuration.
 */
export function getAppliableRules(config: AgariConfig): YakuRule[] {
	// 1. Static Rules (Standard Yaku)
	const rules: YakuRule[] = Object.values(YakuRules);

	// 2. Dynamic Rules (Yakuhai)
	// Dragons (31: White, 32: Green, 33: Red)
	rules.push(createYakuhaiRule(31, YakuName.Haku));
	rules.push(createYakuhaiRule(32, YakuName.Hatsu));
	rules.push(createYakuhaiRule(33, YakuName.Chun));

	// Winds (Bakaze and Jikaze)
	// Note: If Bakaze == Jikaze (e.g., Dealer in East round), we might want to handle it.
	// However, createYakuhaiRule creates distinct rule objects.
	// If we have two rules for 'East', we might count 1 han twice (Double East).
	// The current logic in evaluateHand iterates all rules.
	// If Bakaze=East and Jikaze=East, we add two rules:
	// 1. Bakaze creates rule named "Bakaze" (generic name in YakuName const is 'Bakaze'?)
	//    Wait, YakuName.Bakaze is 'Bakaze'.
	//    If we check names, we might have collision.
	//    But here we pass `YakuName.Bakaze` as name.
	//    So we will have two rules both named 'Bakaze'? No, user used `YakuName.Bakaze` and `YakuName.Jikaze`.
	//    So checks will pass appropriately.
	//    Double East: one from Bakaze rule, one from Jikaze rule.
	//    Both return true. Han is summed (1+1=2). This logic is correct for Double East.
	rules.push(createYakuhaiRule(config.bakaze, YakuName.Bakaze));
	rules.push(createYakuhaiRule(config.jikaze, YakuName.Jikaze));

	return rules;
}
