import { HaiCounts, HaiKindId } from '@/types/hai';
import { HandConfig, YakuName, Mentsu } from '@/types/yaku';
import { GameRules } from '@/types/game';
import { decomposeHand } from './structure';
import { getAppliableRules } from '../yaku/rules';

/**
 * Detects Yaku from the hand.
 * 
 * @param haiCounts - The hand to evaluate (must be 14 tiles total).
 * @param winTile - The tile that completed the hand.
 * @param config - Configuration (rules, dora, wind, etc.).
 * @param gameRules - Game rules (e.g. Kuitan, AkaDora).
 * @param melds - Optional list of fixed melds (open calls or Kans).
 * @returns List of detected Yaku names. Returns empty array if no yaku or not agari.
 * @throws Error if hand structure is invalid (cannot be decomposed).
 */
export function detectAgari(
    haiCounts: HaiCounts,
    winTile: HaiKindId,
    config: HandConfig,
    gameRules: GameRules,
    melds: Mentsu[] = []
): YakuName[] {
    // 1. Decompose hand into all possible structures
    const structures = decomposeHand(haiCounts, winTile, melds);

    if (structures.length === 0) {
        throw new Error('Invalid hand structure (not 4 mentsu + 1 head)');
    }

    let bestYaku: YakuName[] = [];
    let maxHan = 0;

    // Prepare active rules
    const activeRules = getAppliableRules(config);

    // 2. Evaluate each structure
    for (const structure of structures) {
        const currentYaku: YakuName[] = [];
        let currentHan = 0;

        // Check all rules
        for (const rule of activeRules) {
            if (rule.check(structure, config, gameRules)) {
                // Determine Han based on Menzen status
                const isMenzen = !structure.mentsu.some(m => m.isOpen);
                const ruleHan = isMenzen ? rule.hanClosed : rule.hanOpen;

                if (ruleHan > 0 || rule.isYakuman) {
                    currentYaku.push(rule.name);
                    currentHan += ruleHan;
                }
            }
        }

        // Dora (only if we have Yaku)
        if (currentHan > 0) {
            let doraCount = 0;
            const allTiles = [...structure.mentsu.flatMap(m => m.tiles), ...structure.head.tiles];

            for (const tile of allTiles) {
                for (const dora of config.doraTiles) {
                    if (tile === dora) doraCount++;
                }
            }
            if (doraCount > 0) {
                currentHan += doraCount;
            }
        }

        // If valid Yaku found, compare with best
        if (currentHan > 0) {
            if (currentHan > maxHan) {
                maxHan = currentHan;
                bestYaku = currentYaku;
            }
        }
    }

    return bestYaku;
}
