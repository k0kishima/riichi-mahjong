/**
 * Hai (tile) utilities
 */

import { TehaiString, HaiCounts, Suit } from '@/types/hai';

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
 * Type guard to check if a character is a valid suit
 * @param char - Character to check
 * @returns true if the character is a valid suit
 */
function isSuit(char: string): char is Suit {
  return char === 'm' || char === 'p' || char === 's' || char === 'z' || char === 'h';
}

/**
 * Get offset for a suit character
 * @param suit - Suit character (m/p/s/z/h)
 * @returns Offset for hai kind ID calculation
 */
function getSuitOffset(suit: Suit): number {
  switch (suit) {
    case 'm':
      return 0; // manzu: 0-8
    case 'p':
      return 9; // pinzu: 9-17
    case 's':
      return 18; // souzu: 18-26
    case 'z':
    case 'h':
      return 27; // jihai: 27-33
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

  if (isNaN(num) || num < 1 || num > 9) {
    throw new Error(`Invalid hai number: ${digit}`);
  }

  // Validate number range for jihai (z/h)
  if ((suit === 'z' || suit === 'h') && num > 7) {
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
 * Type guard to check if a string is a valid TehaiString (13 or 14 hai)
 * @param str - String to check
 * @returns true if the string represents a valid tehai
 *
 * @example
 * isTehaiString("123m456p789s1111z") // true (14 hai)
 * isTehaiString("123m") // false (only 3 hai)
 */
export function isTehaiString(str: string): str is TehaiString {
  try {
    tehaiStringToHaiCounts(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert tehai string notation to hai counts array
 * @param tehai - Tehai string like "123m456p789s1111z" (must be 13 or 14 hai)
 * @returns HaiCounts (length 34 array with counts 0-4)
 * @throws Error if tehai does not contain exactly 13 or 14 hai
 *
 * @example
 * tehaiStringToHaiCounts("123m456p789s1111z")
 * // Returns array where indices 0,1,2 (manzu 1,2,3) have count 1,
 * // indices 12,13,14 (pinzu 4,5,6) have count 1, etc.
 */
export function tehaiStringToHaiCounts(tehai: TehaiString): HaiCounts {
  const counts: number[] = new Array(34).fill(0);
  let currentNumbers = '';

  for (const char of tehai) {
    if (isSuit(char)) {
      processHaiNumbers(currentNumbers, char, counts);
      currentNumbers = '';
    } else if (char >= '0' && char <= '9') {
      currentNumbers += char;
    } else {
      throw new Error(`Invalid character in tehai string: ${char}`);
    }
  }

  if (currentNumbers.length > 0) {
    throw new Error('Tehai string must end with a suit letter (m/p/s/z)');
  }

  // Validate tehai size (must be 13 or 14 hai)
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total !== 13 && total !== 14) {
    throw new Error(`Invalid tehai size: ${total} hai (expected 13 or 14)`);
  }

  return counts as HaiCounts;
}
