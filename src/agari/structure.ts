import type { HaiCounts, HaiKindId } from "@/types/hai";
import {
	type Jantou,
	type Mentsu,
	MentsuType,
	type TehaiStructure,
} from "@/types/yaku";

/**
 * Decomposes a hand into all possible valid structures (4 mentsu + 1 jantou).
 *
 * @param haiCounts - The hand to decompose (must be 14 tiles total, including the win tile)
 * @param agariHai - The tile that completed the hand
 * @returns Array of valid TehaiStructure
 */
export function decomposeTehai(
	haiCounts: HaiCounts,
	agariHai: HaiKindId,
	fixedFuro: Mentsu[] = [],
): TehaiStructure[] {
	const results: TehaiStructure[] = [];
	const counts = [...haiCounts];

	// Check for Kokushi Musou (Thirteen Orphans)
	// Structure: 13 unique Terminals/Honors, one of them paired.
	// Must be Closed hand (fixedMelds length 0).
	if (fixedFuro.length === 0) {
		let pairFound = false;
		let hasNonTerminalHonor = false;

		// Indices of 1,9,z
		const yaochuIndices = [
			0,
			8,
			9,
			17,
			18,
			26, // 1,9 m,p,s
			27,
			28,
			29,
			30,
			31,
			32,
			33, // z
		];
		const yaochuSet = new Set(yaochuIndices);

		let uniqueYaochu = 0;
		let totalTiles = 0;

		for (let i = 0; i < 34; i++) {
			if (counts[i] > 0) {
				totalTiles += counts[i];
				if (!yaochuSet.has(i)) {
					hasNonTerminalHonor = true;
					break;
				}
				uniqueYaochu++;
				if (counts[i] >= 2) pairFound = true;
			}
		}

		// Standard Kokushi: 13 unique tiles (needs 14 total, so one is pair)
		// If we have 13 unique yaochu and total 14 tiles, and one pair -> Valid.
		if (
			!hasNonTerminalHonor &&
			uniqueYaochu === 13 &&
			totalTiles === 14 &&
			pairFound
		) {
			// Construct Kokushi Structure
			// Since TehaiStructure expects Jantou, we pick the pair as jantou.
			// Mentsu will be filled with the rest singles? Or simpler:
			// 1 "Kokushi" mentsu containing all 14 tiles (or 12 singles).
			// Let's use 1 "Kokushi" mentsu containing all tiles except jantou.
			let jantouIndex = -1;
			for (let i = 0; i < 34; i++) {
				if (counts[i] >= 2) {
					jantouIndex = i;
					break;
				}
			}

			const kokushiTiles: HaiKindId[] = [];
			for (let i = 0; i < 34; i++) {
				if (counts[i] > 0) {
					// Add logic to recreate the tiles array from counts
					const c = i === jantouIndex ? counts[i] - 2 : counts[i];
					for (let k = 0; k < c; k++) kokushiTiles.push(i);
				}
			}

			results.push({
				jantou: { tiles: [jantouIndex, jantouIndex] },
				mentsu: [
					{
						type: MentsuType.Kokushi,
						tiles: kokushiTiles,
						isOpen: false,
					},
				],
				machi: [],
				agariHai,
			});
		}
	}

	// Check for Chiitoitsu (Seven Pairs)
	// Must be Closed hand (fixedMelds length 0).
	if (fixedFuro.length === 0) {
		let pairCount = 0;
		let totalTiles = 0;
		for (let i = 0; i < 34; i++) {
			totalTiles += counts[i];
			if (counts[i] === 2) {
				pairCount++;
			}
		}

		// Chiitoitsu is 7 pairs. Total 14 tiles.
		// What if 4 of same tile? usually 4 same tiles is 2 pairs?
		// Standard rule: 4 same tiles is NOT 2 pairs for Chiitoitsu (must be 7 DISTINCT pairs).
		// Let's stick to standard: 7 different pairs.
		if (pairCount === 7 && totalTiles === 14) {
			// Construct Chiitoitsu Structure
			// Jantou: One of the pairs (arbitrary, usually the one with agariHai if possible, but any works for Yaku check if we iterate).
			// Actually, for Chiitoitsu, there is NO jantou in standard sense (7 pairs).
			// But TehaiStructure requires one.
			// We can treat it as 1 Jantou + 6 Toitsu Mentsu.

			// Reconstruct logic
			const pairs: number[] = [];
			for (let i = 0; i < 34; i++) {
				if (counts[i] === 2) pairs.push(i);
			}

			// Pick first pair as jantou
			const jantouIdx = pairs[0];
			const toitsuMentsu: Mentsu[] = [];

			for (let i = 1; i < 7; i++) {
				toitsuMentsu.push({
					type: MentsuType.Toitsu,
					tiles: [pairs[i], pairs[i]],
					isOpen: false,
				});
			}

			results.push({
				jantou: { tiles: [jantouIdx, jantouIdx] },
				mentsu: toitsuMentsu,
				machi: [],
				agariHai,
			});
		}
	}

	// 1. Standard Decomposition (4 mentsu + 1 jantou)
	for (let i = 0; i < 34; i++) {
		if (counts[i] >= 2) {
			counts[i] -= 2;
			const jantou: Jantou = {
				tiles: [i, i],
			};

			// 2. Recursively find 4 mentsu (starting with fixed ones)
			const mentsuList: Mentsu[] = [...fixedFuro];
			findMentsu(counts, mentsuList, results, jantou, agariHai);

			counts[i] += 2; // Backtrack
		}
	}

	return results;
}

function findMentsu(
	counts: number[],
	currentMentsu: Mentsu[],
	results: TehaiStructure[],
	jantou: Jantou,
	agariHai: HaiKindId,
) {
	// Base case: If we have 4 mentsu, we found a valid structure
	if (currentMentsu.length === 4) {
		results.push({
			mentsu: [...currentMentsu],
			jantou: jantou,
			machi: [], // TODO: Determine wait type logic if needed, or leave empty
			agariHai: agariHai,
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
			isOpen: false, // Assuming closed for now, open melds handling to be added
		});
		findMentsu(counts, currentMentsu, results, jantou, agariHai);
		currentMentsu.pop();
		counts[i] += 3;
	}

	// Try Shuntsu (Sequence) - only for numbered suits (0-26)
	if (i < 27 && i % 9 < 7) {
		// Can form sequence starting at i (e.g., 1-2-3, 7-8-9)
		if (counts[i + 1] > 0 && counts[i + 2] > 0) {
			counts[i]--;
			counts[i + 1]--;
			counts[i + 2]--;
			currentMentsu.push({
				type: MentsuType.Shuntsu,
				tiles: [i, i + 1, i + 2],
				isOpen: false,
			});
			findMentsu(counts, currentMentsu, results, jantou, agariHai);
			currentMentsu.pop();
			counts[i]++;
			counts[i + 1]++;
			counts[i + 2]++;
		}
	}
}
