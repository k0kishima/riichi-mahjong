/**
 * riichi-mahjong - Riichi Mahjong library for TypeScript
 *
 * This library provides utilities for Japanese Riichi Mahjong:
 * - Shanten calculation (向聴数)
 * - Hai (tile) utilities
 */

// ============================================
// Type Definitions
// ============================================

export type {
  // Suit types
  Suit,
  ManzuSuit,
  PinzuSuit,
  SouzuSuit,
  JihaiSuit,
  // Hai types
  HaiId,
  HaiKindId,
  HaiCount,
  HaiCounts,
  MpszString,
} from './types/hai';

export type { ShantenNumber } from './types/shanten';

// ============================================
// Hai Utilities
// ============================================

export {
  // Type guards and factories
  isHaiCounts,
  createHaiCounts,
  // MPSZ conversion
  isMpszString,
  mpszStringToHaiCounts,
} from './hai';

// ============================================
// Shanten Calculation
// ============================================

export {
  // Constants
  AGARI_STATE,
  // Calculation functions
  calculateShantenForRegularHand,
} from './shanten';

export {
  calculateWaits,
} from './wait';

