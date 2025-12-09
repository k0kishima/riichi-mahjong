import type { GameRules } from "@/types/game";
import type { HaiCounts, HaiKindId } from "@/types/hai";
import type { HandConfig, Mentsu, YakuName } from "@/types/yaku";
import { getAppliableRules } from "../yaku/rules";
import { decomposeHand } from "./structure";

/**
 * Detects Yaku from the hand.
 *
 * This function evaluates both:
 * 1. **Structural Yaku (構造役)**: Determined solely by the tile combination (e.g., Tanyao, Pinfu, Chinitsu).
 * 2. **Situational Yaku (状況役)**: Determined by the provided `config` flags (e.g., Riichi, Rinshan, Chankan, Haitei).
 *
 * @param haiCounts - The hand to evaluate (must be 14 tiles total).
 * @param winTile - The tile that completed the hand.
 * @param config - Configuration including game state flags (Riichi, Tsumo, etc.) and wind settings.
 * @param gameRules - Game rules (e.g. Kuitan, AkaDora).
 * @param melds - Optional list of fixed melds (open calls or Kans).
 * @returns List of detected Yaku names. Returns empty array if no yaku or not agari.
 * @throws Error if hand structure is invalid (cannot be decomposed).
 */
export function detectAgari(
	haiCounts: HaiCounts,
	winTile: HaiKindId,
	config: HandConfig,
	gameRules: GameRules,
	melds: Mentsu[] = [],
): YakuName[] {
	// 1. Decompose hand into all possible structures
	const structures = decomposeHand(haiCounts, winTile, melds);

	if (structures.length === 0) {
		throw new Error("Invalid hand structure (not 4 mentsu + 1 head)");
	}

	let bestYaku: YakuName[] = [];
	let maxHan = 0;

	// Prepare active rules
	const activeRules = getAppliableRules(config);

	// 2. Evaluate each structure
	for (const structure of structures) {
		const currentYaku: YakuName[] = [];
		let currentHan = 0;

		// Check all rules
		for (const rule of activeRules) {
			if (rule.check(structure, config, gameRules)) {
				// Determine Han based on Menzen status
				const isMenzen = !structure.mentsu.some((m) => m.isOpen);
				const ruleHan = isMenzen ? rule.hanClosed : rule.hanOpen;

				if (ruleHan > 0 || rule.isYakuman) {
					currentYaku.push(rule.name);
					currentHan += ruleHan;
				}
			}
		}

		// If valid Yaku found, compare with best
		if (currentHan > 0) {
			if (currentHan > maxHan) {
				maxHan = currentHan;
				bestYaku = currentYaku;
			} else if (currentHan === maxHan) {
				// Determine tie-breaker?
				// For now, if Han is equal, either is fine as the score comes from Han/Fu.
				// We might want to prefer higher Fu, but Fu calculation is outside here.
				// So we just keep the first one or overwrite?
				// Standard: usually maximizing Han is enough for Yaku list.
				// If Han is equal (e.g. Pin-Tanyao vs ...), usually it means same interpretation or structurally ambiguous but score-equivalent.
				// For simplified logic, strictly max Han is enough.
			}
		}
	}

	return bestYaku;
}
