/**
 * Shanten type definitions
 *
 * Shanten (向聴数) represents how many tiles away a hand is from being ready to win (tenpai).
 * - Shanten = -1: Winning hand (agari)
 * - Shanten = 0: Ready to win (tenpai)
 * - Shanten = 1: One tile away from tenpai
 * - etc.
 */

/**
 * Shanten number
 * -1 means winning hand (agari)
 * 0 means ready to win (tenpai)
 * 1+ means tiles away from tenpai
 */
export type ShantenNumber = number;
