/**
 * Validation utilities
 */

import { TileCounts } from '@/types/tile';

/**
 * Validate that tile counts match expected total
 * @param tileCounts - Tile counts array to validate
 * @param expected - Expected total count(s). Can be a single number or array of valid numbers
 * @throws Error if total doesn't match expected value(s)
 *
 * @example
 * validateTileCount(counts, 14); // Must be exactly 14 tiles
 * validateTileCount(counts, [13, 14]); // Must be 13 or 14 tiles
 */
export function validateTileCount(
  tileCounts: TileCounts,
  expected: number | number[]
): void {
  const total = tileCounts.reduce<number>((sum, count) => sum + count, 0);
  const expectedValues = Array.isArray(expected) ? expected : [expected];

  if (!expectedValues.includes(total)) {
    const expectedStr = expectedValues.length === 1
      ? String(expectedValues[0])
      : expectedValues.join(' or ');
    throw new Error(`Invalid tile count: ${total} tiles (expected ${expectedStr})`);
  }
}
