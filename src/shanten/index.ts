/**
 * Shanten calculation
 *
 * Shanten (向聴数) represents how many hai away a tehai is from being ready to win (tenpai).
 */

import { HaiCounts } from '@/types/hai';
import { ShantenNumber } from '@/types/shanten';
import { validateHaiCount } from '@/hai';

/**
 * Agari state constant (winning hand / 和了).
 */
export const AGARI_STATE = -1;

/**
 * Internal state for shanten calculation.
 */
interface ShantenState {
  tiles: number[];
  /** Number of complete melds (面子: 刻子/順子) */
  numberMentsu: number;
  /** Number of incomplete sequences (塔子) */
  numberTatsu: number;
  /** Number of pairs (対子) */
  numberToitsu: number;
  /** Special adjustment counter for jihai/honor tiles (字牌) */
  honorTileAdjustment: number;
  /** Bitmap for tiles with 4 copies */
  flagFourCopies: number;
  /** Bitmap for isolated tiles */
  flagIsolatedTiles: number;
  /** Minimum shanten found */
  minShanten: number;
}

/**
 * Process jihai/honor tiles (indices 27-33) and update state
 */
function processHonorTiles(state: ShantenState, tileCount: number): void {
  let fourCopies = 0;
  let isolated = 0;

  for (let i = 27; i < 34; i++) {
    if (state.tiles[i] === 4) {
      state.numberMentsu += 1;
      state.honorTileAdjustment += 1;
      fourCopies |= 1 << (i - 27);
      isolated |= 1 << (i - 27);
    }

    if (state.tiles[i] === 3) {
      state.numberMentsu += 1;
    }

    if (state.tiles[i] === 2) {
      state.numberToitsu += 1;
    }

    if (state.tiles[i] === 1) {
      isolated |= 1 << (i - 27);
    }
  }

  if (state.honorTileAdjustment && tileCount % 3 === 2) {
    state.honorTileAdjustment -= 1;
  }

  if (isolated) {
    state.flagIsolatedTiles |= 1 << 27;
    if ((fourCopies | isolated) === fourCopies) {
      state.flagFourCopies |= 1 << 27;
    }
  }
}

/**
 * Update minimum shanten based on current state
 */
function updateMinShanten(state: ShantenState): void {
  let shanten = 8 - state.numberMentsu * 2 - state.numberTatsu - state.numberToitsu;
  const mentsuKouho = state.numberMentsu + state.numberTatsu;
  let adjustedToitsu = state.numberToitsu;

  if (state.numberToitsu) {
    adjustedToitsu = state.numberToitsu - 1;
  } else if (state.flagFourCopies && state.flagIsolatedTiles) {
    if ((state.flagFourCopies | state.flagIsolatedTiles) === state.flagFourCopies) {
      shanten += 1;
    }
  }

  if (mentsuKouho + adjustedToitsu > 4) {
    shanten += mentsuKouho + adjustedToitsu - 4;
  }

  if (shanten !== AGARI_STATE && shanten < state.honorTileAdjustment) {
    shanten = state.honorTileAdjustment;
  }

  if (shanten < state.minShanten) {
    state.minShanten = shanten;
  }
}

/**
 * Increment a set (pon / koutsu / 刻子) in the state.
 */
function increaseSet(state: ShantenState, index: number): void {
  state.tiles[index] -= 3;
  state.numberMentsu += 1;
}

/**
 * Decrement a set (pon) in the state
 */
function decreaseSet(state: ShantenState, index: number): void {
  state.tiles[index] += 3;
  state.numberMentsu -= 1;
}

/**
 * Increment a pair (toitsu / 対子) in the state.
 */
function increasePair(state: ShantenState, index: number): void {
  state.tiles[index] -= 2;
  state.numberToitsu += 1;
}

/**
 * Decrement a pair in the state
 */
function decreasePair(state: ShantenState, index: number): void {
  state.tiles[index] += 2;
  state.numberToitsu -= 1;
}

/**
 * Increment a sequence (chi / shuntsu / 順子) in the state.
 */
function increaseSequence(state: ShantenState, index: number): void {
  state.tiles[index] -= 1;
  state.tiles[index + 1] -= 1;
  state.tiles[index + 2] -= 1;
  state.numberMentsu += 1;
}

/**
 * Decrement a sequence (chi) in the state
 */
function decreaseSequence(state: ShantenState, index: number): void {
  state.tiles[index] += 1;
  state.tiles[index + 1] += 1;
  state.tiles[index + 2] += 1;
  state.numberMentsu -= 1;
}

/**
 * Increment a tatsu (incomplete sequence / 塔子, e.g., 12 or 13) in the state.
 */
function increaseTatsuFirst(state: ShantenState, index: number): void {
  state.tiles[index] -= 1;
  state.tiles[index + 1] -= 1;
  state.numberTatsu += 1;
}

/**
 * Decrement a tatsu (12 pattern) in the state
 */
function decreaseTatsuFirst(state: ShantenState, index: number): void {
  state.tiles[index] += 1;
  state.tiles[index + 1] += 1;
  state.numberTatsu -= 1;
}

/**
 * Increment a tatsu (13 pattern) in the state
 */
function increaseTatsuSecond(state: ShantenState, index: number): void {
  state.tiles[index] -= 1;
  state.tiles[index + 2] -= 1;
  state.numberTatsu += 1;
}

/**
 * Decrement a tatsu (13 pattern) in the state
 */
function decreaseTatsuSecond(state: ShantenState, index: number): void {
  state.tiles[index] += 1;
  state.tiles[index + 2] += 1;
  state.numberTatsu -= 1;
}

/**
 * Mark a tile as isolated in the state
 */
function increaseIsolatedTile(state: ShantenState, index: number): void {
  state.tiles[index] -= 1;
  state.flagIsolatedTiles |= 1 << index;
}

/**
 * Unmark a tile as isolated in the state
 */
function decreaseIsolatedTile(state: ShantenState, index: number): void {
  state.tiles[index] += 1;
  state.flagIsolatedTiles &= ~(1 << index);
}

/**
 * Recursively search for the best hand composition
 */
function searchBestComposition(state: ShantenState, depth: number): void {
  if (state.minShanten === AGARI_STATE) {
    return;
  }

  // Find next tile position with count > 0
  let currentDepth = depth;
  while (!state.tiles[currentDepth]) {
    currentDepth += 1;
    if (currentDepth >= 27) {
      break;
    }
  }

  if (currentDepth >= 27) {
    updateMinShanten(state);
    return;
  }

  // Normalize index to 0-8 range for suit tiles
  let normalizedIndex = currentDepth;
  if (normalizedIndex > 8) normalizedIndex -= 9;
  if (normalizedIndex > 8) normalizedIndex -= 9;

  // Process tiles based on count
  if (state.tiles[currentDepth] === 4) {
    processFourTiles(state, currentDepth, normalizedIndex);
  }

  if (state.tiles[currentDepth] === 3) {
    processThreeTiles(state, currentDepth, normalizedIndex);
  }

  if (state.tiles[currentDepth] === 2) {
    processTwoTiles(state, currentDepth, normalizedIndex);
  }

  if (state.tiles[currentDepth] === 1) {
    processOneTile(state, currentDepth, normalizedIndex);
  }
}

/**
 * Process when there are 4 copies of the same tile
 */
function processFourTiles(state: ShantenState, index: number, normalizedIndex: number): void {
  increaseSet(state, index);
  if (normalizedIndex < 7 && state.tiles[index + 2]) {
    if (state.tiles[index + 1]) {
      increaseSequence(state, index);
      searchBestComposition(state, index + 1);
      decreaseSequence(state, index);
    }
    increaseTatsuSecond(state, index);
    searchBestComposition(state, index + 1);
    decreaseTatsuSecond(state, index);
  }

  if (normalizedIndex < 8 && state.tiles[index + 1]) {
    increaseTatsuFirst(state, index);
    searchBestComposition(state, index + 1);
    decreaseTatsuFirst(state, index);
  }

  increaseIsolatedTile(state, index);
  searchBestComposition(state, index + 1);
  decreaseIsolatedTile(state, index);
  decreaseSet(state, index);
  increasePair(state, index);

  if (normalizedIndex < 7 && state.tiles[index + 2]) {
    if (state.tiles[index + 1]) {
      increaseSequence(state, index);
      searchBestComposition(state, index);
      decreaseSequence(state, index);
    }
    increaseTatsuSecond(state, index);
    searchBestComposition(state, index + 1);
    decreaseTatsuSecond(state, index);
  }

  if (normalizedIndex < 8 && state.tiles[index + 1]) {
    increaseTatsuFirst(state, index);
    searchBestComposition(state, index + 1);
    decreaseTatsuFirst(state, index);
  }

  decreasePair(state, index);
}

/**
 * Process when there are 3 copies of the same tile
 */
function processThreeTiles(state: ShantenState, index: number, normalizedIndex: number): void {
  increaseSet(state, index);
  searchBestComposition(state, index + 1);
  decreaseSet(state, index);
  increasePair(state, index);

  if (normalizedIndex < 7 && state.tiles[index + 1] && state.tiles[index + 2]) {
    increaseSequence(state, index);
    searchBestComposition(state, index + 1);
    decreaseSequence(state, index);
  } else {
    if (normalizedIndex < 7 && state.tiles[index + 2]) {
      increaseTatsuSecond(state, index);
      searchBestComposition(state, index + 1);
      decreaseTatsuSecond(state, index);
    }

    if (normalizedIndex < 8 && state.tiles[index + 1]) {
      increaseTatsuFirst(state, index);
      searchBestComposition(state, index + 1);
      decreaseTatsuFirst(state, index);
    }
  }

  decreasePair(state, index);

  if (normalizedIndex < 7 && state.tiles[index + 2] >= 2 && state.tiles[index + 1] >= 2) {
    increaseSequence(state, index);
    increaseSequence(state, index);
    searchBestComposition(state, index);
    decreaseSequence(state, index);
    decreaseSequence(state, index);
  }
}

/**
 * Process when there are 2 copies of the same tile
 */
function processTwoTiles(state: ShantenState, index: number, normalizedIndex: number): void {
  increasePair(state, index);
  searchBestComposition(state, index + 1);
  decreasePair(state, index);
  if (normalizedIndex < 7 && state.tiles[index + 2] && state.tiles[index + 1]) {
    increaseSequence(state, index);
    searchBestComposition(state, index);
    decreaseSequence(state, index);
  }
}

/**
 * Process when there is 1 copy of the tile
 */
function processOneTile(state: ShantenState, index: number, normalizedIndex: number): void {
  if (
    normalizedIndex < 6 &&
    state.tiles[index + 1] === 1 &&
    state.tiles[index + 2] &&
    state.tiles[index + 3] !== 4
  ) {
    increaseSequence(state, index);
    searchBestComposition(state, index + 2);
    decreaseSequence(state, index);
  } else {
    increaseIsolatedTile(state, index);
    searchBestComposition(state, index + 1);
    decreaseIsolatedTile(state, index);

    if (normalizedIndex < 7 && state.tiles[index + 2]) {
      if (state.tiles[index + 1]) {
        increaseSequence(state, index);
        searchBestComposition(state, index + 1);
        decreaseSequence(state, index);
      }
      increaseTatsuSecond(state, index);
      searchBestComposition(state, index + 1);
      decreaseTatsuSecond(state, index);
    }

    if (normalizedIndex < 8 && state.tiles[index + 1]) {
      increaseTatsuFirst(state, index);
      searchBestComposition(state, index + 1);
      decreaseTatsuFirst(state, index);
    }
  }
}

/**
 * Calculate shanten for regular tehai (4 mentsu + 1 toitsu pattern / 4面子1雀頭).
 * @param haiCounts - HaiCounts (length 34 array with counts 0-4)
 * @returns Shanten number (-1: agari/和了, 0: tenpai/聴牌, 1+: shanten/向聴数)
 *
 * @example
 * const counts = mpszStringToHaiCounts("123m456p789s1111z");
 * calculateShantenForRegularHand(counts); // Returns shanten number
 */
export function calculateShantenForRegularHand(haiCounts: HaiCounts): ShantenNumber {
  validateHaiCount(haiCounts, [13, 14]);

  const haiCount = haiCounts.reduce<number>((sum, count) => sum + count, 0);

  // Initialize state
  const state: ShantenState = {
    tiles: [...haiCounts],
    numberMentsu: 0,
    numberTatsu: 0,
    numberToitsu: 0,
    honorTileAdjustment: 0,
    flagFourCopies: 0,
    flagIsolatedTiles: 0,
    minShanten: 8,
  };

  // Process jihai/honor tiles
  processHonorTiles(state, haiCount);

  // Mark four-copy hai in number tiles (0-26)
  for (let i = 0; i < 27; i++) {
    state.flagFourCopies |= (state.tiles[i] === 4 ? 1 : 0) << i;
  }

  // Add initial mentsu based on missing hai
  const initMentsu = Math.floor((14 - haiCount) / 3);
  state.numberMentsu += initMentsu;

  // Search for best composition
  searchBestComposition(state, 0);

  return state.minShanten;
}
