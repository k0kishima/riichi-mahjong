import { HaiCounts, HaiKindId } from '@/types/hai';
import { HandStructure, Mentsu, Head, MentsuType } from '@/types/yaku';

/**
 * Decomposes a hand into all possible valid structures (4 mentsu + 1 head).
 * 
 * @param haiCounts - The hand to decompose (must be 14 tiles total, including the win tile)
 * @param winTile - The tile that completed the hand (used to determine wait type later, though strictly not needed for decomposition structure itself, it helps context)
 * @returns Array of valid HandStructure
 */
export function decomposeHand(haiCounts: HaiCounts, winTile: HaiKindId, fixedMelds: Mentsu[] = []): HandStructure[] {
    const results: HandStructure[] = [];
    const counts = [...haiCounts];

    // 1. Find the head (雀頭)
    for (let i = 0; i < 34; i++) {
        if (counts[i] >= 2) {
            counts[i] -= 2;
            const head: Head = {
                tiles: [i, i]
            };

            // 2. Recursively find 4 mentsu (starting with fixed ones)
            const mentsuList: Mentsu[] = [...fixedMelds];
            findMentsu(counts, mentsuList, results, head, winTile);

            counts[i] += 2; // Backtrack
        }
    }

    return results;
}

function findMentsu(
    counts: number[],
    currentMentsu: Mentsu[],
    results: HandStructure[],
    head: Head,
    winTile: HaiKindId
) {
    // Base case: If we have 4 mentsu, we found a valid structure
    if (currentMentsu.length === 4) {
        results.push({
            mentsu: [...currentMentsu],
            head: head,
            wait: [], // TODO: Determine wait type logic if needed, or leave empty
            winTile: winTile
        });
        return;
    }

    // Find first tile index with count > 0
    let i = 0;
    while (i < 34 && counts[i] === 0) {
        i++;
    }

    // If no tiles left but we don't have 4 mentsu, this path is invalid (shouldn't happen if total count is correct)
    if (i === 34) return;

    // Try Koutsu (Triplet)
    if (counts[i] >= 3) {
        counts[i] -= 3;
        currentMentsu.push({
            type: MentsuType.Koutsu,
            tiles: [i, i, i],
            isOpen: false // Assuming closed for now, open melds handling to be added
        });
        findMentsu(counts, currentMentsu, results, head, winTile);
        currentMentsu.pop();
        counts[i] += 3;
    }

    // Try Shuntsu (Sequence) - only for numbered suits (0-26)
    if (i < 27 && i % 9 < 7) { // Can form sequence starting at i (e.g., 1-2-3, 7-8-9)
        if (counts[i + 1] > 0 && counts[i + 2] > 0) {
            counts[i]--;
            counts[i + 1]--;
            counts[i + 2]--;
            currentMentsu.push({
                type: MentsuType.Shuntsu,
                tiles: [i, i + 1, i + 2],
                isOpen: false
            });
            findMentsu(counts, currentMentsu, results, head, winTile);
            currentMentsu.pop();
            counts[i]++;
            counts[i + 1]++;
            counts[i + 2]++;
        }
    }
}
