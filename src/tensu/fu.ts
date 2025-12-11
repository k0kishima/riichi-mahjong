import { type AgariConfig, type Jantou, type Mentsu, MentsuType, type TehaiStructure } from "@/types/yaku";
import type { GameRules } from "@/types/game";
import { isYaochu } from "@/hai";

/**
 * Calculates the Fu (符) for a given hand structure.
 */
export function calculateFu(
    tehai: TehaiStructure,
    config: AgariConfig,
    _rules: GameRules, // Reserved for local rules (e.g. pinfu-tsumo variations)
): number {
    // 1. Chiitoitsu is always 25 Fu (Fixed)
    // Usually Chiitoitsu structure has 7 pairs (special format),
    // but decomposeTehai might return it as 1 Jantou + 6 Toitsu?
    // Our structure for Chiitoitsu has 1 Jantou + 6 Toitsu Mentsu.
    // We need to identify if it's Chiitoitsu.
    const isChiitoitsu = tehai.mentsu.length === 6 && tehai.mentsu.every((m) => m.type === MentsuType.Toitsu);
    if (isChiitoitsu) {
        return 25;
    }

    let fu = 20; // Base Fu (Futei)

    const isMenzen = !tehai.mentsu.some((m) => m.isOpen);
    const isTsumo = config.isTsumo;
    const isRon = !isTsumo;

    // 2. Base Fu logic
    // Menzen Ron: 30 Fu (20 Base + 10 Menzen Ron Bonus) - Wait, standard is 20 Base.
    // Actually:
    // - Menzen Ron: Base 20 + Menzen added 10 = 30 Fu?
    //   - Commonly treated as: Base 20 but usually becomes 30 due to +10 menzen-kafu.
    // - Open Ron: Base 20.
    // - Tsumo: Base 20 + 2 Tsumo Fu = 22 -> 30 Fu.
    // Let's implement components strictly.

    if (isMenzen && isRon) {
        fu += 10; // Menzen-Kafu
    }

    // 3. Tsumo Fu
    // +2 Fu for Tsumo, EXCEPT Pinfu-Tsumo (20 Fu) if rule allows,
    // but here we calculate RAW Fu. Pinfu-Tsumo 20 Fu rule usually strictly forces 20 Fu
    // overriding the Tsumo +2.
    // However, usually we calculate normally and if it becomes 22, round to 30.
    // Special case: Pinfu Tsumo is often 20 Fu (no Fu attached).
    // If structure has NO Fu from Mentsu/Jantou/Machi, and is Tsumo...
    // Let's calculate add-ons first.

    let addons = 0;

    // 4. Mentsu Fu
    for (const m of tehai.mentsu) {
        addons += getMentsuFu(m);
    }

    // 5. Jantou Fu
    // +2 if Yakuhai (Dragons, or Dealer Wind, or Round Wind)
    if (tehai.jantou) {
        addons += getJantouFu(tehai.jantou, config);
    }

    // 6. Machi Fu
    // +2 for Kanchan, Penchan, Tanki
    // Determine wait type from structure + agariHai?
    // TehaiStructure doesn't explicitly store "Machi Type".
    // We must infer it from which block contains the agariHai.
    // Using generic Machi Fu detection:
    // If agariHai forms a Pair (Jantou) -> Tanki (+2)
    // If agariHai is middle of Sequence -> Kanchan (+2)
    // If agariHai is edge of Sequence (3 or 7) and completes 123 or 789 -> Penchan (+2)
    // If agariHai completes Shanpon (Triplet/Quad) -> 0 Fu (treated as winning on triplet, basic fu covers it)
    // If agariHai completes Ryanmen (Sequence) -> 0 Fu.

    // We need to know WHICH block was completed by agariHai.
    // This is tricky because `decomposeTehai` just gives the final structure.
    // However, we can guess the wait type that minimizes/maximizes Fu?
    // Actually, `decomposeTehai` should ideally tell us the wait type or we iterate structures.
    // Here `tehai` is ONE valid structure. Typically we pick the structure that yields highest score.
    // We need to check if ANY of the blocks could assume a bad wait (+2 Fu).

    // Simplification: We check the relationship between agariHai and the blocks.
    // A tile might be used in Jantou (Tanki) OR Mentsu.
    // If `decomposeTehai` was smart, it would tell us.
    // Since it's not, we have to deduce.
    // But `tehai` has `agariHai` field.

    addons += getMachiFu(tehai, tehai.agariHai);
    // TehaiStructure has `agariHai`.

    // 7. Tsumo Fu Application
    // Standard: +2 Fu for Tsumo.
    // Exception: Pinfu Tsumo (No Fu hand). 
    // If we have Pinfu (No Mentsu Fu, No Jantou Fu, No Machi Fu), and Tsumo generally gives 20 Fu total (skip +2).
    // BUT, strict logic: calculate addons. If addons==0 and isMenzen, it MIGHT be Pinfu.
    // Let's assume standard rule: Always +2 for Tsumo, UNLESS Pinfu (which is handled by Yaku logic forcing 20 Fu).
    // Actually, for pure Fu calculation, we usually Add +2. 
    // The "20 Fu" result for Pinfu-Tsumo is a special exception handled at Yaku/Score level.
    // OR we assume this calculation is for the non-Pinfu interpretation (e.g. when checking if 20 or 30).
    // Let's add +2 for Tsumo here. Pinfu check elsewhere will override if needed.
    if (isTsumo) {
        // Exception: Pinfu rule? Usually we add +2.
        // If the hand is Pinfu, Fu is 20. 
        // If we return 22 -> rounds to 30. That breaks Pinfu-Tsumo (20).
        // So we must know if it satisfies Pinfu-like conditions?
        // No, `calculateFu` creates the input for Score.
        // If Yaku includes Pinfu, we force 20 (Tsumo) or 30 (Ron).
        // But here we don't know Yaku.
        // We should return the "Constructed Fu".
        // If Pinfu Tsumo, constructed is 22 (rounded 30)? No, Pinfu-Tsumo is SPECIAL 20.
        // Let's add +2. Later logic can override if Pinfu.
        // Wait, if I return 30 Fu, score calc will use 30.
        // If Pinfu Tsumo is valid, score calc should use 20.
        // So `calculateFu` might return 22 (unrounded) or 30 (rounded)?
        // Rounding happens at the end.

        // Let's simply add +2.
        // BUT note: Open Pinfu (Kuitan) also implies no Fu? No, Open Pinfu is not a Yaku usually (unless local).
        // Pinfu is Menzen only.

        fu += 2;
    }

    // 8. Open Pinfu (No Fu) exception?
    // If open hand has no addons (20 Fu base), and no tsumo/menzen bonus...
    // It stays 20 Fu.
    // But valid open hand must have 1 Yaku. Usually Kuitan.
    // If Kuitan and 20 Fu -> Round to 30 Fu?
    // Rule: There is no 20 Fu for Open hand. Min is 30.
    // Exception: 20 Fu is ONLY for Menzen Pinfu Tsumo.
    // So if total < 30 and (Open or (Menzen and not Tsumo?)), it bumps to 30?

    // Total Unrounded
    let totalUnrounded = fu + addons;

    // Special Handling for 20 Fu
    // 20 Fu is only possible for:
    // 1. Menzen Pinfu Tsumo (if allowed) - Strictly 20.
    // 2. Open Pinfu? No, becomes 30.

    // If Tsumo and Pinfu-like (Addons=0), it becomes 22 -> 30 in normal flow.
    // But if Pinfu Tsumo is valid, it should be 20.
    // Since we don't check Yaku here, we return the "Structural Fu".
    // Structural Fu for Pinfu Tsumo is 22.
    // Structural Fu for Pinfu Ron is 30.

    // The caller (Agari Detector/Score Calculator) usually decides if Pinfu applies.
    // If Pinfu applies, Use 20 (Tsumo) or 30 (Ron).
    // If NOT Pinfu, Use calculated (e.g. 30, 40).

    // So we return the calculated value, rounded.
    const rounded = Math.ceil(totalUnrounded / 10) * 10;

    // Special Case: Chiitoitsu (25) Handled at top.

    // Special Case: 20 Fu rule (Open hand with no Fu -> 30)
    // If rounded == 20, correct to 30?
    // Yes, unless it's the special Pinfu-Tsumo case.
    // But calculateFu cannot know if it's Pinfu-Tsumo without checking Yaku.

    // Let's return the Rounded value.
    // If it's 20 (unlikely with rounding unless exactly 20), it implies no addons.
    // Ron(20) + Menzen(10) = 30.
    // Tsumo(20) + 2 = 22 -> 30.
    // Open(20) = 20 -> Becomes 30.
    // So effectively min possible is 30, EXCEPT pure Pinfu Tsumo logic which bypasses this calculator or we return unrounded?

    // Decision: Return rounded value. 
    // However, if the hand is Open and 20 (no addons), it effectively becomes 30.
    if (rounded === 20 && !isChiitoitsu) {
        return 30;
    }

    return rounded;
}

function getMentsuFu(m: Mentsu): number {
    if (m.type === MentsuType.Shuntsu) return 0;

    // Koutsu / Kantsu
    const isYaochuTile = isYaochu(m.tiles[0]);
    const isKantsu = m.type === MentsuType.Kantsu;
    const isOpen = m.isOpen;

    let val = 2;
    if (isYaochuTile) val *= 2; // 4
    if (isKantsu) val *= 4;     // 8 or 16
    if (!isOpen) val *= 2;      // Closed Koutsu Yaochu = 8

    // Basic Koutsu Simple Open: 2
    // Basic Koutsu Simple Closed: 4
    // Basic Koutsu Yaochu Open: 4
    // Basic Koutsu Yaochu Closed: 8
    // Kantsu Simple Open: 8
    // Kantsu Simple Closed: 16
    // Kantsu Yaochu Open: 16
    // Kantsu Yaochu Closed: 32

    return val;
}

function getJantouFu(j: Jantou, config: AgariConfig): number {
    const tile = j.tiles[0];
    let fu = 0;

    // Yakuhai?
    // Dragons (31, 32, 33)
    if (tile >= 31) fu += 2;

    // Winds (27, 28, 29, 30)
    // Bakaze
    if (tile === config.bakaze) fu += 2;
    // Jikaze
    if (tile === config.jikaze) fu += 2;

    return fu;
}

function getMachiFu(tehai: TehaiStructure, agariHai: number): number {
    // If agariHai unknown (-1), assume 0
    if (agariHai === -1) return 0;

    // Check Jantou (Tanki)
    // If agariHai matches jantou tiles, it's Tanki.
    // Note: It's possible to wait on Jantou OR Mentsu (e.g. Shanpon).
    // But Shanpon wait is considered waiting on "Mentsu" completion (the pair becomes triplet).
    // Wait, Shanpon: Wait for pair to become triplet.
    // Does Shanpon give +2 Fu? No.
    // Tanki: Wait for single to become pair. (+2 Fu)

    // If we completed the Jantou with agariHai -> It WAS Tanki.
    // (Because valid Jantou has 2 tiles. If we Agari, we added one. So it was 1 tile.)
    if (tehai.jantou.tiles.includes(agariHai)) {
        // Wait, did we complete the jantou?
        // In `decomposeTehai`, the structure includes the agariHai in the respective block.
        // If agariHai is in Jantou, we completed the pair -> Tanki.
        return 2;
    }

    // Check Mentsu
    for (const m of tehai.mentsu) {
        if (m.type === MentsuType.Shuntsu && m.tiles.includes(agariHai)) {
            // Sequence. Check if Kanchan or Penchan.
            // Tiles are sorted? `decomposeTehai` creates sorted blocks usually.
            // Let's sort to be safe.
            const sorted = [...m.tiles].sort((a, b) => a - b);
            const idx = sorted.indexOf(agariHai);

            // Kanchan: Middle tile (idx 1)
            if (idx === 1) return 2;

            // Penchan: Edge waiting for 3 or 7 to complete 123 or 789.
            // i.e. 12(3) or (7)89.
            // If we entered with 3 (and sequence is 123), it's Penchan.
            // If we entered with 7 (and sequence is 789), it's Penchan.
            // Else Ryanmen (0 Fu).

            // Pattern: 123 win on 3 (idx 2, val%9 == 2) -> Penchan
            // Pattern: 789 win on 7 (idx 0, val%9 == 6) -> Penchan
            // Wait, Ryanmen is 23 win on 1 or 4.
            // If win on 1 (idx 0) in 123 -> Penchan? No, 1 is edge.
            // Penchan is 12 -> 3. (Waiting for 3). Win on 3.
            // Penchan is 89 -> 7. (Waiting for 7). Win on 7.
            // What about 123 win on 1? That implies we had 23. Wait 1 or 4.
            // That is Ryanmen (Side wait).
            // So:
            // If sequence is 1,2,3 (Mod 9: 0,1,2). Win on 3 (2). We had 1,2. Fixed edge wait (Penchan) because 1 is terminal.
            // If sequence is 1,2,3. Win on 1? We had 2,3. Wait 1 or 4. 1 is Side. Ryanmen.
            // NO. 12 wait is for 3. You cannot wait for 0.
            // So 1,2 waiting for 3 is Penchan.
            // 8,9 waiting for 7 is Penchan.

            // Implementation:
            // If tiles are [0,1,2] (123m) and agari is 2 (3m) -> Penchan.
            // If tiles are [6,7,8] (789m) and agari is 6 (7m) -> Penchan.

            const modAgari = agariHai % 9;
            const modFirst = sorted[0] % 9;

            if (modFirst === 0 && modAgari === 2) return 2; // 12w3
            if (modFirst === 6 && modAgari === 6) return 2; // 7w89

            // Otherwise Ryanmen or logic fails?
            return 0;
        }
    }

    // Koutsu/Kantsu completion -> Shanpon.
    // Shanpon Fu is 0.
    return 0;
}
