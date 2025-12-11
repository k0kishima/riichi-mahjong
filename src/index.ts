/**
 * riichi-mahjong - Riichi Mahjong library for TypeScript
 *
 * This library provides utilities for Japanese Riichi Mahjong:
 * - Shanten calculation (向聴数)
 * - Agari detection (和了判定) & Yaku evaluation (役判定)
 * - Hai (tile) utilities
 * - Wait tile calculation
 */

// ============================================
// Type Definitions
// ============================================

// Export GameRules from types/game if needed
export type { GameRules } from "./types/game";
export type * from "./types/hai";
export type * from "./types/shanten";
export type * from "./types/yaku";

// ============================================
// Hai Utilities
// ============================================

export * from "./hai";

// ============================================
// Shanten Calculation
// ============================================

export * from "./shanten";

// ============================================
// Wait Calculation
// ============================================

export * from "./machi";

// ============================================
// Agari & Yaku
// ============================================

export * from "./agari";
// We don't export from "./yaku" (implementation/rules) directly as public API,
// except for types which are already exported from types/yaku.
