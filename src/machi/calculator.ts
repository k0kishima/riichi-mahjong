/**
 * Machi (Wait) tile calculation.
 *
 * "Machi" refers to the tile(s) required to complete a hand (Tenpai state).
 * Identifying wait tiles is crucial for Agari detection and helper tools.
 */

import { validateHaiCount } from "@/hai";
import { AGARI_STATE, calculateShantenForRegularHand } from "@/shanten";
import type { HaiCounts, HaiKindId } from "@/types/hai";

/**
 * Calculates the waiting tiles (Machi) for a given hand.
 *
 * The hand is assumed to be in Tenpai (Shanten 0) or potentially Agari (Shanten -1).
 * It returns a list of tiles that would complete the hand.
 * This is done by trying to add every possible tile (0-33) and checking if Shanten becomes -1 (Agari).
 *
 * @param haiCounts - The hand configuration (length 34 array).
 * Must be 13 tiles for normal wait calculation (Wait is for the 14th tile).
 *
 * @returns Array of HaiKindId that complete the hand.
 */
export function calculateMachi(haiCounts: HaiCounts): HaiKindId[] {
	// Validate input: should be 13 tiles.
	validateHaiCount(haiCounts, 13);

	const machi: HaiKindId[] = [];
	const testCounts = [...haiCounts];

	for (let i = 0; i < 34; i++) {
		// Optimization: if we already have 4 of this tile, we can't draw a 5th.
		if (testCounts[i] === 4) continue;

		// Add tile i to hand
		testCounts[i]++;

		// Check Shanten
		const shanten = calculateShantenForRegularHand(testCounts);

		if (shanten === AGARI_STATE) {
			machi.push(i);
		}

		// Remove tile i (backtrack)
		testCounts[i]--;
	}

	return machi;
}
