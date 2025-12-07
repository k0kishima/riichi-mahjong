import { HaiCounts } from '@/types/hai';
import { validateHaiCount } from '@/hai';
import { calculateShantenForRegularHand } from '@/shanten';

/**
 * Calculate waiting tiles (machi / 待ち) for a given hand configuration.
 *
 * Checks if adding a tile completes the hand structure (e.g. 4 melds + 1 pair).
 *
 * @remarks
 * **IMPORTANT**: This function ONLY checks for the structural completion of the hand.
 * It does NOT verify if the completed hand has any valid Yaku (Winning Condition).
 * A tile returned by this function might result in a "Yaku Nashi" (No Yaku) hand.
 * To confirm if a hand can legally win, you must verify the existence of Yaku (e.g. using `detectAgari`).
 *
 * @param haiCounts - HaiCounts (length 34 array with counts 0-4). Must be 13 tiles.
 * @returns Array of indices (0-33) representing the waiting tiles (tiles that complete the structure).
 *
 * @example
 * const counts = mpszStringToHaiCounts("123m456p789s1111z"); // 13 tiles
 * const waits = calculateWaits(counts); // Returns [27] (index for 1z)
 */
export function calculateWaits(haiCounts: HaiCounts): number[] {
    // Validate total count is 13
    // Validate total count is 13
    validateHaiCount(haiCounts, 13);

    const waits: number[] = [];
    // Create a mutable copy for calculation
    const mutableCounts = [...haiCounts];

    // Try adding each possible tile (0-33)
    for (let i = 0; i < 34; i++) {
        // If we already have 4 of this tile, we can't draw a 5th one
        if (mutableCounts[i] >= 4) {
            continue;
        }

        // Add the tile
        mutableCounts[i]++;

        // Check if it's Agari (shanten === -1)
        // Note: Currently only supporting regular hands (4 mentsu + 1 toitsu)
        // TODO: Add support for Chitoitsu and Kokushi if needed later
        // Cast back to HaiCounts as we know it's valid length/values
        const shanten = calculateShantenForRegularHand(mutableCounts as unknown as HaiCounts);

        if (shanten === -1) {
            waits.push(i);
        }

        // Remove the tile (backtrack)
        mutableCounts[i]--;
    }

    return waits;
}
