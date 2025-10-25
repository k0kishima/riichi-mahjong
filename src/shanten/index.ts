/**
 * Shanten calculation
 *
 * Shanten (向聴数) represents how many tiles away a hand is from being ready to win (tenpai).
 */

import { TileCounts } from '../types/tile';
import { ShantenNumber } from '../types/shanten';

/**
 * Agari state constant (winning hand)
 */
export const AGARI_STATE = -1;

/**
 * Calculate shanten for regular hand (4 melds + 1 pair pattern)
 * @param tileCounts - TileCounts (length 34 array with counts 0-4)
 * @returns Shanten number (-1: agari, 0: tenpai, 1+: shanten)
 *
 * @example
 * const counts = TilesConverter.stringToTileCounts("123m456p789s11z");
 * calculateShantenForRegularHand(counts); // Returns shanten number
 */
export function calculateShantenForRegularHand(tileCounts: TileCounts): ShantenNumber {
  // Copy tiles array as we'll modify it
  const tiles: number[] = [...tileCounts];

  // Validate tile count
  const countOfTiles = tiles.reduce((sum, count) => sum + count, 0) as number;
  if (countOfTiles > 14) {
    throw new Error(`Too many tiles: ${countOfTiles}`);
  }

  // Internal state
  let numberMelds = 0;
  let numberTatsu = 0;
  let numberPairs = 0;
  let numberJidahai = 0;
  let flagFourCopies = 0;
  let flagIsolatedTiles = 0;
  let minShanten = 8;

  // Process honor tiles (indices 27-33)
  const removeCharacterTiles = (nc: number) => {
    let fourCopies = 0;
    let isolated = 0;

    for (let i = 27; i < 34; i++) {
      if (tiles[i] === 4) {
        numberMelds += 1;
        numberJidahai += 1;
        fourCopies |= 1 << (i - 27);
        isolated |= 1 << (i - 27);
      }

      if (tiles[i] === 3) {
        numberMelds += 1;
      }

      if (tiles[i] === 2) {
        numberPairs += 1;
      }

      if (tiles[i] === 1) {
        isolated |= 1 << (i - 27);
      }
    }

    if (numberJidahai && nc % 3 === 2) {
      numberJidahai -= 1;
    }

    if (isolated) {
      flagIsolatedTiles |= 1 << 27;
      if ((fourCopies | isolated) === fourCopies) {
        flagFourCopies |= 1 << 27;
      }
    }
  };

  // Update result based on current state
  const updateResult = () => {
    let retShanten = 8 - numberMelds * 2 - numberTatsu - numberPairs;
    const nMentsuKouho = numberMelds + numberTatsu;
    let adjustedPairs = numberPairs;

    if (numberPairs) {
      adjustedPairs = numberPairs - 1;
    } else if (flagFourCopies && flagIsolatedTiles) {
      if ((flagFourCopies | flagIsolatedTiles) === flagFourCopies) {
        retShanten += 1;
      }
    }

    if (nMentsuKouho + adjustedPairs > 4) {
      retShanten += nMentsuKouho + adjustedPairs - 4;
    }

    if (retShanten !== AGARI_STATE && retShanten < numberJidahai) {
      retShanten = numberJidahai;
    }

    if (retShanten < minShanten) {
      minShanten = retShanten;
    }
  };

  // Helper functions for meld manipulation
  const increaseSet = (k: number) => {
    tiles[k] -= 3;
    numberMelds += 1;
  };

  const decreaseSet = (k: number) => {
    tiles[k] += 3;
    numberMelds -= 1;
  };

  const increasePair = (k: number) => {
    tiles[k] -= 2;
    numberPairs += 1;
  };

  const decreasePair = (k: number) => {
    tiles[k] += 2;
    numberPairs -= 1;
  };

  const increaseSyuntsu = (k: number) => {
    tiles[k] -= 1;
    tiles[k + 1] -= 1;
    tiles[k + 2] -= 1;
    numberMelds += 1;
  };

  const decreaseSyuntsu = (k: number) => {
    tiles[k] += 1;
    tiles[k + 1] += 1;
    tiles[k + 2] += 1;
    numberMelds -= 1;
  };

  const increaseTatsuFirst = (k: number) => {
    tiles[k] -= 1;
    tiles[k + 1] -= 1;
    numberTatsu += 1;
  };

  const decreaseTatsuFirst = (k: number) => {
    tiles[k] += 1;
    tiles[k + 1] += 1;
    numberTatsu -= 1;
  };

  const increaseTatsuSecond = (k: number) => {
    tiles[k] -= 1;
    tiles[k + 2] -= 1;
    numberTatsu += 1;
  };

  const decreaseTatsuSecond = (k: number) => {
    tiles[k] += 1;
    tiles[k + 2] += 1;
    numberTatsu -= 1;
  };

  const increaseIsolatedTile = (k: number) => {
    tiles[k] -= 1;
    flagIsolatedTiles |= 1 << k;
  };

  const decreaseIsolatedTile = (k: number) => {
    tiles[k] += 1;
    flagIsolatedTiles &= ~(1 << k);
  };

  // Recursive function to find optimal hand composition
  const run = (depth: number): void => {
    if (minShanten === AGARI_STATE) {
      return;
    }

    let currentDepth = depth;
    while (!tiles[currentDepth]) {
      currentDepth += 1;
      if (currentDepth >= 27) {
        break;
      }
    }

    if (currentDepth >= 27) {
      updateResult();
      return;
    }

    let i = currentDepth;
    if (i > 8) i -= 9;
    if (i > 8) i -= 9;

    if (tiles[currentDepth] === 4) {
      increaseSet(currentDepth);
      if (i < 7 && tiles[currentDepth + 2]) {
        if (tiles[currentDepth + 1]) {
          increaseSyuntsu(currentDepth);
          run(currentDepth + 1);
          decreaseSyuntsu(currentDepth);
        }
        increaseTatsuSecond(currentDepth);
        run(currentDepth + 1);
        decreaseTatsuSecond(currentDepth);
      }

      if (i < 8 && tiles[currentDepth + 1]) {
        increaseTatsuFirst(currentDepth);
        run(currentDepth + 1);
        decreaseTatsuFirst(currentDepth);
      }

      increaseIsolatedTile(currentDepth);
      run(currentDepth + 1);
      decreaseIsolatedTile(currentDepth);
      decreaseSet(currentDepth);
      increasePair(currentDepth);

      if (i < 7 && tiles[currentDepth + 2]) {
        if (tiles[currentDepth + 1]) {
          increaseSyuntsu(currentDepth);
          run(currentDepth);
          decreaseSyuntsu(currentDepth);
        }
        increaseTatsuSecond(currentDepth);
        run(currentDepth + 1);
        decreaseTatsuSecond(currentDepth);
      }

      if (i < 8 && tiles[currentDepth + 1]) {
        increaseTatsuFirst(currentDepth);
        run(currentDepth + 1);
        decreaseTatsuFirst(currentDepth);
      }

      decreasePair(currentDepth);
    }

    if (tiles[currentDepth] === 3) {
      increaseSet(currentDepth);
      run(currentDepth + 1);
      decreaseSet(currentDepth);
      increasePair(currentDepth);

      if (i < 7 && tiles[currentDepth + 1] && tiles[currentDepth + 2]) {
        increaseSyuntsu(currentDepth);
        run(currentDepth + 1);
        decreaseSyuntsu(currentDepth);
      } else {
        if (i < 7 && tiles[currentDepth + 2]) {
          increaseTatsuSecond(currentDepth);
          run(currentDepth + 1);
          decreaseTatsuSecond(currentDepth);
        }

        if (i < 8 && tiles[currentDepth + 1]) {
          increaseTatsuFirst(currentDepth);
          run(currentDepth + 1);
          decreaseTatsuFirst(currentDepth);
        }
      }

      decreasePair(currentDepth);

      if (i < 7 && tiles[currentDepth + 2] >= 2 && tiles[currentDepth + 1] >= 2) {
        increaseSyuntsu(currentDepth);
        increaseSyuntsu(currentDepth);
        run(currentDepth);
        decreaseSyuntsu(currentDepth);
        decreaseSyuntsu(currentDepth);
      }
    }

    if (tiles[currentDepth] === 2) {
      increasePair(currentDepth);
      run(currentDepth + 1);
      decreasePair(currentDepth);
      if (i < 7 && tiles[currentDepth + 2] && tiles[currentDepth + 1]) {
        increaseSyuntsu(currentDepth);
        run(currentDepth);
        decreaseSyuntsu(currentDepth);
      }
    }

    if (tiles[currentDepth] === 1) {
      if (
        i < 6 &&
        tiles[currentDepth + 1] === 1 &&
        tiles[currentDepth + 2] &&
        tiles[currentDepth + 3] !== 4
      ) {
        increaseSyuntsu(currentDepth);
        run(currentDepth + 2);
        decreaseSyuntsu(currentDepth);
      } else {
        increaseIsolatedTile(currentDepth);
        run(currentDepth + 1);
        decreaseIsolatedTile(currentDepth);

        if (i < 7 && tiles[currentDepth + 2]) {
          if (tiles[currentDepth + 1]) {
            increaseSyuntsu(currentDepth);
            run(currentDepth + 1);
            decreaseSyuntsu(currentDepth);
          }
          increaseTatsuSecond(currentDepth);
          run(currentDepth + 1);
          decreaseTatsuSecond(currentDepth);
        }

        if (i < 8 && tiles[currentDepth + 1]) {
          increaseTatsuFirst(currentDepth);
          run(currentDepth + 1);
          decreaseTatsuFirst(currentDepth);
        }
      }
    }
  };

  // Main algorithm
  removeCharacterTiles(countOfTiles);

  // Mark four-copy tiles in number tiles (0-26)
  for (let i = 0; i < 27; i++) {
    flagFourCopies |= (tiles[i] === 4 ? 1 : 0) << i;
  }

  const initMentsu = Math.floor((14 - countOfTiles) / 3);
  numberMelds += initMentsu;

  run(0);

  return minShanten;
}
