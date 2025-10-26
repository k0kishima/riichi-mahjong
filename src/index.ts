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
  TehaiString,
} from './types/hai';

export type { ShantenNumber } from './types/shanten';

// ============================================
// Hai Utilities
// ============================================

export {
  // Type guards and factories
  isHaiCounts,
  createHaiCounts,
  // Tehai conversion
  isTehaiString,
  tehaiStringToHaiCounts,
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
