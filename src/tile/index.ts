/**
 * Tile utilities
 */

import { HandString, TileCounts, Suit } from '@/types/tile';

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
 * @returns Offset for tile kind ID calculation
 */
function getSuitOffset(suit: Suit): number {
  switch (suit) {
    case 'm':
      return 0; // man: 0-8
    case 'p':
      return 9; // pin: 9-17
    case 's':
      return 18; // sou: 18-26
    case 'z':
    case 'h':
      return 27; // honors: 27-33
  }
}

/**
 * Validate and parse a tile number character
 * @param digit - Digit character to parse
 * @param suit - Suit character for validation
 * @returns Parsed number (1-9 for suits, 1-7 for honors)
 */
function validateAndParseTileNumber(digit: string, suit: Suit): number {
  const num = parseInt(digit, 10);

  if (isNaN(num) || num < 1 || num > 9) {
    throw new Error(`Invalid tile number: ${digit}`);
  }

  // Validate number range for honors (z/h)
  if ((suit === 'z' || suit === 'h') && num > 7) {
    throw new Error(`Invalid tile number: ${digit}`);
  }

  return num;
}

/**
 * Process tile numbers and update counts array
 * @param numbers - String of digit characters
 * @param suit - Suit character
 * @param counts - Counts array to update
 */
function processTileNumbers(numbers: string, suit: Suit, counts: number[]): void {
  const offset = getSuitOffset(suit);

  for (const digit of numbers) {
    const num = validateAndParseTileNumber(digit, suit);
    const tileKindId = offset + (num - 1);

    if (tileKindId < 0 || tileKindId > 33) {
      throw new Error(`Invalid tile kind ID: ${tileKindId}`);
    }

    counts[tileKindId]++;

    if (counts[tileKindId] > 4) {
      throw new Error(`Too many tiles of kind ${tileKindId}: ${counts[tileKindId]}`);
    }
  }
}

/**
 * Type guard to check if a string is a valid HandString (13 or 14 tiles)
 * @param str - String to check
 * @returns true if the string represents a valid hand
 *
 * @example
 * isHandString("123m456p789s1111z") // true (14 tiles)
 * isHandString("123m") // false (only 3 tiles)
 */
export function isHandString(str: string): str is HandString {
  try {
    handStringToTileCounts(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert hand string notation to tile counts array
 * @param hand - Hand string like "123m456p789s1111z" (must be 13 or 14 tiles)
 * @returns TileCounts (length 34 array with counts 0-4)
 * @throws Error if hand does not contain exactly 13 or 14 tiles
 *
 * @example
 * handStringToTileCounts("123m456p789s1111z")
 * // Returns array where indices 0,1,2 (man 1,2,3) have count 1,
 * // indices 12,13,14 (pin 4,5,6) have count 1, etc.
 */
export function handStringToTileCounts(hand: HandString): TileCounts {
  const counts: number[] = new Array(34).fill(0);
  let currentNumbers = '';

  for (const char of hand) {
    if (isSuit(char)) {
      processTileNumbers(currentNumbers, char, counts);
      currentNumbers = '';
    } else if (char >= '0' && char <= '9') {
      currentNumbers += char;
    } else {
      throw new Error(`Invalid character in hand string: ${char}`);
    }
  }

  if (currentNumbers.length > 0) {
    throw new Error('Hand string must end with a suit letter (m/p/s/z)');
  }

  // Validate hand size (must be 13 or 14 tiles)
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total !== 13 && total !== 14) {
    throw new Error(`Invalid hand size: ${total} tiles (expected 13 or 14)`);
  }

  return counts as TileCounts;
}
