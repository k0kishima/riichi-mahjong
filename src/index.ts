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
	HaiCount,
	HaiCounts,
	// Hai types
	HaiId,
	HaiKindId,
	JihaiSuit,
	ManzuSuit,
	MpszString,
	PinzuSuit,
	SouzuSuit,
	// Suit types
	Suit,
} from "./types/hai";

export type { ShantenNumber } from "./types/shanten";

// ============================================
// Hai Utilities
// ============================================

export {
	createHaiCounts,
	// Type guards and factories
	isHaiCounts,
	// MPSZ conversion
	isMpszString,
	mpszStringToHaiCounts,
} from "./hai";

// ============================================
// Shanten Calculation
// ============================================

export {
	// Constants
	AGARI_STATE,
	// Calculation functions
	calculateShantenForRegularHand,
} from "./shanten";

export { calculateWaits } from "./wait";
