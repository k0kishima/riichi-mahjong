/**
 * Hai (tile) utilities
 */

import { MpszString, HaiCounts, Suit } from '@/types/hai';

/**
 * Offset for Manzu (萬子) tiles (0-8)
 */
export const MANZU_OFFSET = 0;

/**
 * Offset for Pinzu (筒子) tiles (9-17)
 */
export const PINZU_OFFSET = 9;

/**
 * Offset for Souzu (索子) tiles (18-26)
 */
export const SOUZU_OFFSET = 18;

/**
 * Offset for Jihai (字牌) tiles (27-33)
 */
export const JIHAI_OFFSET = 27;

/**
 * Type guard to validate that an array is valid HaiCounts
 * @param arr - Array to validate
 * @returns true if the array is valid HaiCounts
 *
 * @example
 * isHaiCounts([1, 2, 0, ...]) // true if length 34 and all values 0-4
 */
export function isHaiCounts(arr: readonly number[]): arr is HaiCounts {
  return arr.length === 34 && arr.every((c) => c >= 0 && c <= 4);
}

/**
 * Create validated HaiCounts from an array
 * @param arr - Array of numbers to validate and convert
 * @returns Validated HaiCounts
 * @throws Error if the array is not valid HaiCounts
 *
 * @example
 * const counts = createHaiCounts([2, 0, 1, 0, ..., 0]); // 34 elements
 */
export function createHaiCounts(arr: readonly number[]): HaiCounts {
  if (!isHaiCounts(arr)) {
    throw new Error(
      `Invalid HaiCounts: expected length 34 with values 0-4, got length ${arr.length}`,
    );
  }
  return arr;
}

/**
 * Validate that hai counts match expected total.
 * (手牌の枚数が正しいか検証する。少牌/多牌のチェック)
 *
 * @param haiCounts - Hai counts array to validate.
 * @param expected - Expected total count(s). Can be a single number or array of valid numbers.
 * @throws Error if total doesn't match expected value(s).
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

/**
 * Type guard to check if a character is a valid suit
 * @param char - Character to check
 * @returns true if the character is a valid suit
 */
function isSuit(char: string): char is Suit {
  return char === 'm' || char === 'p' || char === 's' || char === 'z';
}

/**
 * Get offset for a suit character
 * @param suit - Suit character (m/p/s/z)
 * @returns Offset for hai kind ID calculation
 */
function getSuitOffset(suit: Suit): number {
  switch (suit) {
    case 'm':
      return MANZU_OFFSET; // manzu: 0-8
    case 'p':
      return PINZU_OFFSET; // pinzu: 9-17
    case 's':
      return SOUZU_OFFSET; // souzu: 18-26
    case 'z':
      return JIHAI_OFFSET; // jihai: 27-33
  }
}

/**
 * Validate and parse a hai number character
 * @param digit - Digit character to parse
 * @param suit - Suit character for validation
 * @returns Parsed number (1-9 for number suits, 1-7 for jihai)
 */
function validateAndParseHaiNumber(digit: string, suit: Suit): number {
  const num = parseInt(digit, 10);

  if (isNaN(num) || num < 0 || num > 9) {
    throw new Error(`Invalid hai number: ${digit}`);
  }

  // Handle Red Five (0) -> treat as 5
  if (num === 0) {
    // Red Five is not valid for Jihai
    if (suit === 'z') {
      throw new Error(`Invalid hai number: ${digit} (Red Five not allowed for Jihai)`);
    }
    return 5;
  }

  // Validate number range for jihai (z)
  if (suit === 'z' && num > 7) {
    throw new Error(`Invalid hai number: ${digit}`);
  }

  return num;
}

/**
 * Process hai numbers and update counts array
 * @param numbers - String of digit characters
 * @param suit - Suit character
 * @param counts - Counts array to update
 */
function processHaiNumbers(numbers: string, suit: Suit, counts: number[]): void {
  const offset = getSuitOffset(suit);

  for (const digit of numbers) {
    const num = validateAndParseHaiNumber(digit, suit);
    const haiKindId = offset + (num - 1);

    if (haiKindId < 0 || haiKindId > 33) {
      throw new Error(`Invalid hai kind ID: ${haiKindId}`);
    }

    counts[haiKindId]++;

    if (counts[haiKindId] > 4) {
      throw new Error(`Too many hai of kind ${haiKindId}: ${counts[haiKindId]}`);
    }
  }
}

/**
 * Type guard to check if a string is a valid MpszString (13 or 14 hai)
 * @param str - String to check
 * @returns true if the string represents a valid MPSZ string
 *
 * @example
 * isMpszString("123m456p789s1111z") // true (14 hai)
 * isMpszString("123m") // false (only 3 hai)
 */
export function isMpszString(str: string): str is MpszString {
  try {
    mpszStringToHaiCounts(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert MPSZ string notation to hai counts array.
 * (MPSZ形式の文字列をHaiCounts配列に変換する)
 *
 * @param mpsz - MPSZ string like "123m456p789s1111z" (must be 13 or 14 hai).
 * @returns HaiCounts (length 34 array with counts 0-4).
 * @throws Error if MPSZ string does not contain exactly 13 or 14 hai.
 *
 * @example
 * mpszStringToHaiCounts("123m456p789s1111z")
 * // Returns array where indices 0,1,2 (manzu 1,2,3) have count 1,
 * // indices 12,13,14 (pinzu 4,5,6) have count 1, etc.
 */
export function mpszStringToHaiCounts(mpsz: MpszString): HaiCounts {
  const counts: number[] = new Array(34).fill(0);
  let currentNumbers = '';

  for (const char of mpsz) {
    if (isSuit(char)) {
      processHaiNumbers(currentNumbers, char, counts);
      currentNumbers = '';
    } else if (char >= '0' && char <= '9') {
      currentNumbers += char;
    } else {
      throw new Error(`Invalid character in MPSZ string: ${char}`);
    }
  }

  if (currentNumbers.length > 0) {
    throw new Error('MPSZ string must end with a suit letter (m/p/s/z)');
  }

  // Validate size (must be valid Agari/Tenpai related count essentially, but for flexible testing let's allow any non-empty)
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    throw new Error(`Invalid MPSZ string size: ${total} hai`);
  }

  return counts as HaiCounts;
}
