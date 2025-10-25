/**
 * Hai (tile) type definitions
 *
 * ## Terminology Glossary (Japanese ↔ English)
 * - 牌 (hai) = tile
 * - 手牌 (tehai) = hand
 * - 萬子 (manzu) = characters/man
 * - 筒子 (pinzu) = dots/circles
 * - 索子 (souzu) = bamboos/sticks
 * - 字牌 (jihai) = honor tiles
 * - 面子 (mentsu) = complete set/meld (pon/chi)
 * - 塔子 (tatsu) = incomplete sequence
 * - 対子 (toitsu) = pair
 * - 向聴 (shanten) = tiles away from tenpai
 */

/**
 * Suit character for manzu/characters (萬子)
 */
export type ManzuSuit = 'm';

/**
 * Suit character for pinzu/dots (筒子)
 */
export type PinzuSuit = 'p';

/**
 * Suit character for souzu/bamboo (索子)
 */
export type SouzuSuit = 's';

/**
 * Suit character for jihai/honors (字牌)
 * 'z' is standard, 'h' is an alias
 */
export type JihaiSuit = 'z' | 'h';

/**
 * All valid suit characters
 */
export type Suit = ManzuSuit | PinzuSuit | SouzuSuit | JihaiSuit;

/**
 * String representation of a mahjong hand/tehai (13 or 14 hai)
 * Format: digits followed by suit letter (m/p/s/z)
 * Examples: "123m456p789s1111z" (14 hai), "111234567s11p567m" (14 hai)
 * - m: manzu/characters (萬子)
 * - p: pinzu/dots (筒子)
 * - s: souzu/bamboo (索子)
 * - z: jihai/honors (字牌)
 *
 * Note: Must contain exactly 13 or 14 hai total
 */
export type TehaiString = string;

/**
 * Unique identifier for a physical hai/tile (0-135)
 * Each of the 136 hai in a mahjong set has a unique ID
 * Layout: 0-35 (manzu), 36-71 (pinzu), 72-107 (souzu), 108-135 (jihai)
 */
export type HaiId = number;

/**
 * Unique identifier for a hai kind (0-33)
 * Represents one of the 34 different hai kinds in mahjong
 * Examples: 1m, 2m, ..., 9m, 1p, ..., 9s, East, South, ..., Red dragon
 * Layout: 0-8 (manzu), 9-17 (pinzu), 18-26 (souzu), 27-33 (jihai)
 */
export type HaiKindId = number;

/**
 * Count of hai for a specific kind (0-4 hai)
 * Each hai kind can have 0 to 4 instances
 */
export type HaiCount = 0 | 1 | 2 | 3 | 4;

/**
 * Array of hai counts for all 34 hai kinds
 * Index corresponds to HaiKindId (0-33)
 * Each element is the count (0-4) of that hai kind
 *
 * @example
 * const counts: HaiCounts = [
 *   2, 0, 1, 0, 0, 0, 0, 0, 0, // manzu (index 0-8)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu (index 9-17)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu (index 18-26)
 *   1, 0, 0, 0, 0, 0, 0         // jihai (index 27-33)
 * ];
 */
export type HaiCounts = readonly HaiCount[];

/**
 * Type guard to validate that an array is valid HaiCounts
 * @param arr - Array to validate
 * @returns true if the array is valid HaiCounts
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
