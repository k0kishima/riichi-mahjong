import { HaiCounts } from '@/types/hai';
import { validateHaiCount } from '@/hai';
import { calculateShantenForRegularHand } from '@/shanten';

/**
 * Calculate waiting tiles (machi / 待ち) for a given hand.
 *
 * This function calculates the waiting tiles for a hand with 13 tiles (before drawing a tile).
 * It validates that the hand has exactly 13 tiles to prevent "Shouhai" (少牌 - too few tiles)
 * or "Tahai" (多牌 - too many tiles).
 *
 * @param haiCounts - HaiCounts (length 34 array with counts 0-4). Must be 13 tiles.
 * @returns Array of indices (0-33) representing the waiting tiles
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
