/**
 * Tile type definitions
 *
 * ## Terminology Glossary (Japanese ↔ English)
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
 * String representation of a mahjong hand (13 or 14 tiles)
 * Format: digits followed by suit letter (m/p/s/z)
 * Examples: "123m456p789s1111z" (14 tiles), "111234567s11p567m" (14 tiles)
 * - m: manzu/characters (萬子)
 * - p: pinzu/dots (筒子)
 * - s: souzu/bamboo (索子)
 * - z: jihai/honors (字牌)
 *
 * Note: Must contain exactly 13 or 14 tiles total
 */
export type HandString = string;

/**
 * Unique identifier for a physical tile (0-135)
 * Each of the 136 tiles in a mahjong set has a unique ID
 * Layout: 0-35 (manzu), 36-71 (pinzu), 72-107 (souzu), 108-135 (jihai)
 */
export type TileId = number;

/**
 * Unique identifier for a tile kind (0-33)
 * Represents one of the 34 different tile kinds in mahjong
 * Examples: 1m, 2m, ..., 9m, 1p, ..., 9s, East, South, ..., Red dragon
 * Layout: 0-8 (manzu), 9-17 (pinzu), 18-26 (souzu), 27-33 (jihai)
 */
export type TileKindId = number;

/**
 * Count of tiles for a specific kind (0-4 tiles)
 * Each tile kind can have 0 to 4 instances
 */
export type TileCount = 0 | 1 | 2 | 3 | 4;

/**
 * Array of tile counts for all 34 tile kinds
 * Index corresponds to TileKindId (0-33)
 * Each element is the count (0-4) of that tile kind
 *
 * @example
 * const counts: TileCounts = [
 *   2, 0, 1, 0, 0, 0, 0, 0, 0, // manzu (index 0-8)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu (index 9-17)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu (index 18-26)
 *   1, 0, 0, 0, 0, 0, 0         // jihai (index 27-33)
 * ];
 */
export type TileCounts = readonly TileCount[];

/**
 * Type guard to validate that an array is valid TileCounts
 * @param arr - Array to validate
 * @returns true if the array is valid TileCounts
 */
export function isTileCounts(arr: readonly number[]): arr is TileCounts {
  return arr.length === 34 && arr.every((c) => c >= 0 && c <= 4);
}

/**
 * Create validated TileCounts from an array
 * @param arr - Array of numbers to validate and convert
 * @returns Validated TileCounts
 * @throws Error if the array is not valid TileCounts
 *
 * @example
 * const counts = createTileCounts([2, 0, 1, 0, ..., 0]); // 34 elements
 */
export function createTileCounts(arr: readonly number[]): TileCounts {
  if (!isTileCounts(arr)) {
    throw new Error(
      `Invalid TileCounts: expected length 34 with values 0-4, got length ${arr.length}`,
    );
  }
  return arr;
}
