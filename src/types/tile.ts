/**
 * Tile type definitions
 */

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
