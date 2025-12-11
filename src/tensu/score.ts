import { type AgariConfig } from "@/types/yaku";

export interface ScoreResult {
    total: number;
    payment: {
        main: number; // Ron: payer, Tsumo: dealer/all
        additional: number; // Tsumo: non-dealer (if applicable)
    };
    yakuLevel: string; // "mangan", "yakuman", etc.
}

/**
 * Calculates the score (Tensu) based on Han and Fu.
 *
 * @param han - Number of Han
 * @param fu - Number of Fu
 * @param config - Agari configuration (Dealer, Tsumo, etc.)
 * @param isYakuman - Whether the hand is a Yakuman (ignores Han/Fu)
 * @returns ScoreResult object
 */
export function calculateTensu(
    han: number,
    fu: number,
    config: AgariConfig,
    isYakuman = false,
): ScoreResult {
    let basePoints = 0;
    let yakuLevel = "";

    // 1. Determine Base Points
    if (isYakuman) {
        basePoints = 8000;
        yakuLevel = "yakuman";
        // Check for multiple yakuman? (Not handled here, caller sums them or passes multiplier?)
        // Standard simple yakuman is 8000 base.
    } else {
        // Limit Hands Check
        if (han >= 13) {
            basePoints = 8000;
            yakuLevel = "kazoe yakuman";
        } else if (han >= 11) {
            basePoints = 6000;
            yakuLevel = "sanbaiman";
        } else if (han >= 8) {
            basePoints = 4000;
            yakuLevel = "baiman";
        } else if (han >= 6) {
            basePoints = 3000;
            yakuLevel = "haneman";
        } else if (han >= 5) {
            basePoints = 2000;
            yakuLevel = "mangan";
        } else {
            // Normal Calculation: Fu * 2^(2+Han)
            // Max base is 2000 (Mangan)
            const calculated = fu * 2 ** (2 + han);
            if (calculated >= 2000) {
                basePoints = 2000;
                yakuLevel = "mangan";
            } else {
                basePoints = calculated;
            }
        }
    }

    // Kiriage Mangan? (Han 4, Fu 30 => 1920 -> 2000 // Han 3, Fu 60 => 1920 -> 2000)
    // Usually optional. Let's assume standard strict calculation for now.
    // If needed, we can check rules.

    // 2. Calculate Allocations
    // Dealer: 6x Base (Ron), 2x Base all (Tsumo)
    // Non-Dealer: 4x Base (Ron), 1x Base / 2x Base (Tsumo)

    let main = 0;
    let additional = 0;
    let total = 0;

    if (config.isTsumo) {
        const payChild = roundUp100(basePoints);
        const payParent = roundUp100(basePoints * 2);

        if (config.isOya) { // Dealer (East)
            // Dealer Tsumo: All pay 2x Base
            main = payParent; // All pay this
            additional = payParent; // Same for display
            // Total = 3 * payParent
            total = payParent * 3;
        } else {
            // Non-Dealer Tsumo: Dealer pays 2x, Child pays 1x
            main = payParent; // Dealer pays
            additional = payChild; // Child pays
            // Total = payParent + 2 * payChild
            total = payParent + (payChild * 2);
        }
    } else {
        // Ron: One player pays all
        if (config.isOya) { // Dealer Ron
            // 6x Base
            main = roundUp100(basePoints * 6);
            total = main;
        } else { // Non-Dealer Ron
            // 4x Base          // 4x Base
            main = roundUp100(basePoints * 4);
            total = main;
        }
        additional = 0;
    }

    return {
        total,
        payment: {
            main,
            additional,
        },
        yakuLevel,
    };
}

function roundUp100(val: number): number {
    return Math.ceil(val / 100) * 100;
}
