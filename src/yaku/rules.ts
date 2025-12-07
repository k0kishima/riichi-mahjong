import { HandStructure, HandConfig, YakuName, MentsuType } from '@/types/yaku';
import { GameRules } from '@/types/game';

/**
 * Definition of a Yaku Rule.
 */
export interface YakuRule {
    name: YakuName;
    hanOpen: number;
    hanClosed: number;
    isYakuman: boolean;
    /**
     * Checks if the yaku condition is met.
     */
    check: (hand: HandStructure, config: HandConfig, rules: GameRules) => boolean;
}

/**
 * Yaku Rules Collection.
 */
export const YakuRules = {
    /**
     * Tanyao (All Simples).
     * (断幺九)
     */
    Tanyao: {
        name: YakuName.Tanyao,
        hanOpen: 1,
        hanClosed: 1,
        isYakuman: false,
        check: (hand: HandStructure, _config: HandConfig, rules: GameRules): boolean => {
            // Check for Kuitan rule
            const isHandOpen = hand.mentsu.some(m => m.isOpen);
            if (isHandOpen && !rules.hasKuitan) {
                return false;
            }

            // Check tiles in mentsu
            for (const mentsu of hand.mentsu) {
                for (const tile of mentsu.tiles) {
                    if (isTerminalOrHonor(tile)) return false;
                }
            }

            // Check tiles in head
            for (const tile of hand.head.tiles) {
                if (isTerminalOrHonor(tile)) return false;
            }

            return true;
        }
    } as YakuRule,

    /**
     * Pinfu (Flat Hand).
     * (平和)
     */
    Pinfu: {
        name: YakuName.Pinfu,
        hanOpen: 0, // Menzen only
        hanClosed: 1,
        isYakuman: false,
        check: (hand: HandStructure, config: HandConfig, _rules: GameRules): boolean => {
            // Must be closed (Menzen)
            if (hand.mentsu.some(m => m.isOpen)) return false;

            // All mentsu must be Shuntsu
            if (hand.mentsu.some(m => m.type !== MentsuType.Shuntsu)) return false;

            // Head must NOT be value tile (Yakuhai)
            const headTile = hand.head.tiles[0];
            // Dragon tiles (31, 32, 33) are always value tiles
            if (headTile >= 31 && headTile <= 33) return false;
            // Seat Wind (Jikaze) is value tile
            if (headTile === config.jikaze) return false;
            // Prevalent Wind (Bakaze) is value tile
            if (headTile === config.bakaze) return false;

            // Must be Ryanmen wait (Two-sided)
            // Note: decomposeHand doesn't perfectly identify wait types yet,
            // but we can infer it if we know the winTile and the structure.
            // For Pinfu check in this context, we usually assume the structure "could" be interpreted as Pinfu
            // if the winning tile completes a shuntsu in a ryanmen way.
            // Simplified check:
            // 1. Find the mentsu that contains the winTile
            // 2. Check if it's a Shuntsu formed such that winTile completes 2-side wait
            // e.g. 23(4), (3)45, etc.
            // Edge wait (12(3), (7)89) or Closed/Center wait (2(4)6 -> 13(2)) are not Ryanmen.

            // Since we don't have explicit "which tile completed which group" mapping in `HandStructure` easily available
            // without re-matching `winTile` to `mentsu`, we iterate.
            // Note: This logic assumes `winTile` is one of the tiles in the hand.
            // Strict Pinfu check requires knowing EXACTLY which group was completed by the win tile.
            // `decomposeHand` returns completed structures.
            // We need to check if ANY Shuntsu containing winTile COULD be a Ryanmen wait.

            // Ryanmen check Logic:
            // Win tile is T. Shuntsu is [A, B, C].
            // If T is A (first), then B=A+1, C=A+2. Valid if A is not 7 (since 7-8-9 wait on 9 is edge/penchan).
            // Actually, if T is A, wait was on A. Shuntsu [A, A+1, A+2]. pair was A+1, A+2.
            // Wait, Ryanmen is waiting for 1 or 4 for 2-3.
            // If win tile is A, and shuntsu is [A, A+1, A+2], then previous state was [A+1, A+2].
            // This is valid Ryanmen if A+1 is not 8 or 9 (impossible) and A+1 is not 1 (impossible).
            // Wait, 1-2 waiting for 3 is valid (3 is win tile).
            // 8-9 waiting for 7 is valid (7 is win tile).
            // 1-2 waiting for 3: Pair [1,2], Win 3. Shuntsu [1,2,3]. Win tile is index 2.
            // 2-3 waiting for 1: Pair [2,3], Win 1. Shuntsu [1,2,3]. Win tile is index 0.
            // 2-3 waiting for 4: Pair [2,3], Win 4. Shuntsu [2,3,4]. Win tile is index 2.

            // Ryanmen means:
            // - Winning tile completes a Shuntsu.
            // - If WinTile is the defined "First" (lowest) of Shuntsu [S, S+1, S+2]:
            //   - It must be that the wait was on S and S+3? No.
            //   - If we have [S+1, S+2] in hand, we wait for S or S+3.
            //   - We won on S. This is valid Ryanmen UNLESS [S+1, S+2] is [8,9] (waiting for 7 is OK) -> [1,2] waiting for 3 is OK.
            //   - Wait, specific example: Hand [8,9]. Waits for 7. Win on 7.
            //     Shuntsu becomes [7,8,9]. Win tile is 7 (lowest).
            //     Is [8,9] a ryanmen? NO. It's Penchan (Edge).
            //     Wait, [8,9] waits for 7. This is Side/Edge wait.
            //     [1,2] waits for 3. This is Side/Edge wait.
            //     Ryanmen is waiting for *two* sides. e.g. [2,3] waits for 1 or 4.
            //     So if we win on 1 (completing 1-2-3), the wait was [2,3]. This IS Ryanmen.
            //     If we win on 4 (completing 2-3-4), the wait was [2,3]. This IS Ryanmen.
            //     If we win on 3 (completing 1-2-3), and wait was [1,2], that is PENCHAN (Edge).
            //     If we win on 7 (completing 7-8-9), and wait was [8,9], that is PENCHAN (Edge).

            // So:
            // If WinTile is S (lowest of [S, S+1, S+2]):
            //   - Valid Ryanmen if S is NOT 7 (which forms 7-8-9) ??
            //   - No. [2,3] waits for 1, 4.
            //   - If win is 1 (S), then Shuntsu is [1,2,3]. Wait was [2,3].
            //   - Is [2,3] Ryanmen? Yes.
            //   - If win is 7 (S), then Shuntsu is [7,8,9]. Wait was [8,9].
            //   - Is [8,9] Ryanmen? No, it's Penchan.
            //   - So if WinTile is S (lowest), it is Ryanmen ONLY IF S < 7. (1..6)
            //   - AND S cannot be part of 1-2-3 waiting on 3... Wait.
            //   - Let's trace carefully:
            //     - Win 1 for [1,2,3]: Wait [2,3]. Ryanmen? Yes, waits for 1,4. (OK).
            //     - Win 4 for [4,5,6]: Wait [5,6]. Ryanmen? Yes, waits for 4,7. (OK).
            //     - Win 7 for [7,8,9]: Wait [8,9]. Ryanmen? NO. Penchan. (Wait 7 only).
            //   - So if WinTile is Lowest (index 0 of Shuntsu), it's Ryanmen iff the Sequence doesn't end at 9?
            //     - [7,8,9] (Lowest 7). Ends at 9. Bad.
            //     - [6,7,8] (Lowest 6). Ends at 8. Wait was [7,8]. Waits 6,9. OK.
            //     - So if WinTile is Lowest, OK if shuntsu.tiles[2] !== 9 (or simply lowest !== 6? No 6-7-8 is fine).
            //     - Correct logic: If WinTile is at index 0 (lowest) of sequence, it is valid Ryanmen IF sequence is NOT 1-2-3? No. 123 win on 1 is fine.
            //     - Wait, Penchan is [1,2] waiting for 3. Win on 3 (Highest).
            //     - Penchan is [8,9] waiting for 7. Win on 7 (Lowest).
            //     - So if WinTile is Lowest (0), it is BAD if it forms 7-8-9. (i.e. Lowest is 7 of a suit 0..8 -> index 6 count).
            //     - Indices: 1m=0 ... 9m=8.
            //     - [7,8,9] -> indices [6,7,8]. Win on 6. Wait [7,8]. Index 8 is 9m.
            //     - So if WinTile is Lowest (index 0), it is Ryanmen if tile is NOT 7 (index 6).
            //     - Wait, is 1-2-3 win on 1 (index 0) Ryanmen? Wait [2,3] -> 1,4. Yes.
            //     - So: Win=Lowest -> OK provided NOT 7-8-9 (i.e. Lowest != 7).

            // If WinTile is Highest (index 2 of [S, S+1, S+2]):
            //   - Win 3 for [1,2,3]: Wait [1,2]. Ryanmen? NO. Penchan. (Wait 3 only).
            //   - Win 6 for [4,5,6]: Wait [4,5]. Ryanmen? Yes, waits 3,6.
            //   - Win 9 for [7,8,9]: Wait [7,8]. Ryanmen? Yes, waits 6,9.
            //   - So if WinTile is Highest, it is Ryanmen if tile is NOT 3 (index 2)?
            //   - Indices: [0,1,2]. Win 2 (3m). Wait [0,1]. Bad.
            //   - [3,4,5]. Win 5 (6m). Wait [3,4]. OK.
            //   - So: Win=Highest -> OK provided NOT 1-2-3 (i.e. Highest != 3).

            // If WinTile is Middle (index 1):
            //   - Win 2 for [1,2,3]. Wait [1,3]. Kanchan. Always BAD.

            const winTile = hand.winTile;
            // Check if winTile completes a Shuntsu in Ryanmen way
            let hasRyanmen = false;

            for (const m of hand.mentsu) {
                if (m.type !== MentsuType.Shuntsu) continue;

                // Mentsu tiles are sorted? Usually yes.
                const tiles = [...m.tiles].sort((a, b) => a - b);

                // Check if winTile is in this shuntsu
                const indexInMentsu = tiles.indexOf(winTile);
                if (indexInMentsu === -1) continue;

                if (indexInMentsu === 0) {
                    // Win on lowest tile.
                    // Valid Ryanmen if it's NOT 7-8-9 (Lowest=6 in 0-indexed suit).
                    // Actually check if tile[2] is 8 (9 in 0-idx)? 
                    // No. 7m is index 6. 7-8-9 is indices 6,7,8.
                    // If win is 6 (7m), and shuntsu is 6,7,8.
                    // Wait was 7,8. 7,8 waits for 6,9.
                    // Wait, [8,9] waits for 7. [7,8] waits for 6,9.
                    // Ah, [8,9] is indices 7,8.
                    // [7,8] is indices 6,7.
                    // If Shuntsu is [6,7,8] (7-8-9). Win on 6.
                    // Wait was [7,8]. This logic of "Wait was X" assumes we stripped the win tile.
                    // Yes. [7,8] waits for 6 or 9.
                    // So winning on 6 IS Ryanmen.
                    // Winning on 9 (index 8) IS Ryanmen.

                    // Wait, what is Penchan?
                    // [1,2] waiting for 3. (Indices 0,1 waiting for 2).
                    // [8,9] waiting for 7. (Indices 7,8 waiting for 6).

                    // So:
                    // If Win on Lowest (0):
                    //   - Case: Win 6 for [6,7,8]. Wait [7,8]. Ryanmen. OK.
                    //   - Case: Win 0 for [0,1,2]. Wait [1,2]. Penchan? NO. [1,2] waits for 0,3. Ryanmen.
                    //   - Wait, [1,2] is 2m,3m. Waits 1m,4m. OK.
                    //   - The only "One-sided" edge wait involving Lowest is:
                    //     - [8,9] waiting for 7. Win on 7 (Lowest).
                    //     - Indices 7,8 waiting for 6. Win on 6.
                    //     - So if Shuntsu is [6,7,8] (7-8-9). Win on 6.
                    //     - Previous was [7,8]. [7,8] waits for 6,9. RYANMEN.
                    //     - Wait, Penchan is specific to terminals.
                    //     - 8-9 (Indices 7,8). Waits for 7.
                    //     - So if Shuntsu is [6,7,8] (7-8-9), and we won on 6 (7m).
                    //     - Wait was [7,8] (8m,9m)? No. [7,8] is 8m,9m.
                    //     - Yes, 8m,9m waits for 7m. ONE SIDED. 
                    //     - Ah, 8-9 IS PENCHAN.
                    //     - So winning on 7m (index 6) with [8,9] (indices 7,8) is Penchan.
                    //     - Shuntsu is [6,7,8]. Win is 6.
                    //     - So: If Win is Lowest (6), and Highest is 8 (9m) -> BAD.

                    if (tiles[2] % 9 === 8) { // Highest is 9 (index 8)
                        // This is 7-8-9. Win on 7. Bad.
                    } else {
                        hasRyanmen = true;
                    }
                } else if (indexInMentsu === 2) {
                    // Win on highest tile.
                    // Case: Win 3 (Index 2) for [1,2,3] (0,1,2).
                    // Wait was [0,1] (1-2). 1-2 waits for 3.
                    // 1-2 is Penchan. ONE SIDED.
                    // So: If Win is Highest (index 2, 3m), and Lowest is 1 (index 0, 1m) -> BAD.

                    if (tiles[0] % 9 === 0) { // Lowest is 1 (index 0)
                        // This is 1-2-3. Win on 3. Bad.
                    } else {
                        hasRyanmen = true;
                    }
                }
                // Middle (Kanchan) is always false, handled by omission
            }

            return hasRyanmen;
        }
    } as YakuRule,

    /**
     * Riichi (Reach).
     * (立直)
     */
    Riichi: {
        name: YakuName.Riichi,
        hanOpen: 0, // Menzen only
        hanClosed: 1,
        isYakuman: false,
        check: (hand: HandStructure, config: HandConfig, _rules: GameRules): boolean => {
            if (hand.mentsu.some(m => m.isOpen)) return false;
            return config.isRiichi;
        }
    } as YakuRule,

    /**
     * Menzen Tsumo (Self Draw).
     * (門前清自摸和)
     */
    MenzenTsumo: {
        name: YakuName.MenzenTsumo,
        hanOpen: 0, // Menzen only
        hanClosed: 1,
        isYakuman: false,
        check: (hand: HandStructure, config: HandConfig, _rules: GameRules): boolean => {
            if (hand.mentsu.some(m => m.isOpen)) return false;
            return config.isTsumo;
        }
    } as YakuRule,

    /**
     * Ippatsu (One Shot).
     * (一発)
     */
    Ippatsu: {
        name: YakuName.Ippatsu,
        hanOpen: 0, // Menzen only (implied by Riichi)
        hanClosed: 1,
        isYakuman: false,
        check: (hand: HandStructure, config: HandConfig, _rules: GameRules): boolean => {
            if (hand.mentsu.some(m => m.isOpen)) return false;
            // Ippatsu requires Riichi
            return config.isRiichi && config.isIppatsu;
        }
    } as YakuRule,
};

/**
 * Helper to check if tile is Terminal or Honor
 */
function isTerminalOrHonor(tile: number): boolean {
    // Honors: 27-33
    if (tile >= 27) return true;
    // Terminals: 1 (0, 9, 18) or 9 (8, 17, 26)
    const num = tile % 9;
    return num === 0 || num === 8;
}

/**
 * Factory for Yakuhai Rule
 */
export const createYakuhaiRule = (tileIndex: number, yakuName: YakuName): YakuRule => ({
    name: yakuName,
    hanOpen: 1,
    hanClosed: 1,
    isYakuman: false,
    check: (hand: HandStructure, _config: HandConfig, _rules: GameRules): boolean => {
        return hand.mentsu.some(m =>
            (m.type === MentsuType.Koutsu || m.type === MentsuType.Kantsu) &&
            m.tiles[0] === tileIndex
        );
    }
});

/**
 * Returns a list of all appliable rules based on the hand configuration.
 */
export function getAppliableRules(config: HandConfig): YakuRule[] {
    // 1. Static Rules (Standard Yaku)
    const rules: YakuRule[] = Object.values(YakuRules);

    // 2. Dynamic Rules (Yakuhai)
    // Dragons (31: White, 32: Green, 33: Red)
    rules.push(createYakuhaiRule(31, YakuName.Haku));
    rules.push(createYakuhaiRule(32, YakuName.Hatsu));
    rules.push(createYakuhaiRule(33, YakuName.Chun));

    // Winds (Bakaze and Jikaze)
    // Note: If Bakaze == Jikaze (e.g., Dealer in East round), we might want to handle it.
    // However, createYakuhaiRule creates distinct rule objects.
    // If we have two rules for 'East', we might count 1 han twice (Double East).
    // The current logic in evaluateHand iterates all rules.
    // If Bakaze=East and Jikaze=East, we add two rules:
    // 1. Bakaze creates rule named "Bakaze" (generic name in YakuName const is 'Bakaze'?)
    //    Wait, YakuName.Bakaze is 'Bakaze'.
    //    If we check names, we might have collision.
    //    But here we pass `YakuName.Bakaze` as name.
    //    So we will have two rules both named 'Bakaze'? No, user used `YakuName.Bakaze` and `YakuName.Jikaze`.
    //    So checks will pass appropriately.
    //    Double East: one from Bakaze rule, one from Jikaze rule.
    //    Both return true. Han is summed (1+1=2). This logic is correct for Double East.
    rules.push(createYakuhaiRule(config.bakaze, YakuName.Bakaze));
    rules.push(createYakuhaiRule(config.jikaze, YakuName.Jikaze));

    return rules;
}
