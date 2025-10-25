/**
 * Tile type definitions
 */

/**
 * Suit character for man/characters (萬子)
 */
export type ManSuit = 'm';

/**
 * Suit character for pin/dots (筒子)
 */
export type PinSuit = 'p';

/**
 * Suit character for sou/bamboo (索子)
 */
export type SouSuit = 's';

/**
 * Suit character for honors (字牌)
 * 'z' is standard, 'h' is an alias
 */
export type HonorsSuit = 'z' | 'h';

/**
 * All valid suit characters
 */
export type Suit = ManSuit | PinSuit | SouSuit | HonorsSuit;

/**
 * String representation of tiles in mahjong notation
 * Format: digits followed by suit letter (m/p/s/z)
 * Examples: "123m", "456p789s11z", "11223344m5566p77s1z"
 * - m: man/characters (萬子)
 * - p: pin/dots (筒子)
 * - s: sou/bamboo (索子)
 * - z: honors (字牌)
 */
export type TileString = string;

/**
 * Unique identifier for a physical tile (0-135)
 * Each of the 136 tiles in a mahjong set has a unique ID
 * Layout: 0-35 (man), 36-71 (pin), 72-107 (sou), 108-135 (honors)
 */
export type TileId = number;

/**
 * Unique identifier for a tile kind (0-33)
 * Represents one of the 34 different tile kinds in mahjong
 * Examples: 1m, 2m, ..., 9m, 1p, ..., 9s, East, South, ..., Red dragon
 * Layout: 0-8 (man/characters), 9-17 (pin/dots), 18-26 (sou/bamboo), 27-33 (honors)
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
 *   2, 0, 1, 0, 0, 0, 0, 0, 0, // man (index 0-8)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // pin (index 9-17)
 *   0, 0, 0, 0, 0, 0, 0, 0, 0, // sou (index 18-26)
 *   1, 0, 0, 0, 0, 0, 0         // honors (index 27-33)
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
