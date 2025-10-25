/**
 * Validation utilities
 */

import { HaiCounts } from '@/types/hai';

/**
 * Validate that hai counts match expected total
 * @param haiCounts - Hai counts array to validate
 * @param expected - Expected total count(s). Can be a single number or array of valid numbers
 * @throws Error if total doesn't match expected value(s)
 *
 * @example
 * validateHaiCount(counts, 14); // Must be exactly 14 hai
 * validateHaiCount(counts, [13, 14]); // Must be 13 or 14 hai
 */
export function validateHaiCount(
  haiCounts: HaiCounts,
  expected: number | number[]
): void {
  const total = haiCounts.reduce<number>((sum, count) => sum + count, 0);
  const expectedValues = Array.isArray(expected) ? expected : [expected];

  if (!expectedValues.includes(total)) {
    const expectedStr = expectedValues.length === 1
      ? String(expectedValues[0])
      : expectedValues.join(' or ');
    throw new Error(`Invalid hai count: ${total} hai (expected ${expectedStr})`);
  }
}
