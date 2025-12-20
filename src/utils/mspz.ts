/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import { HaiId, HaiKind, HaiKindId } from "../types";
import { haiKindToNumber, normalizeHaiIds } from "../core/hai";

/**
 * 13枚の牌ID配列を 34種の牌カウント配列（整数配列）に変換します。
 * @throws {Error} 牌の数が13枚でない場合
 */
export function haiIdsToCounts34(
  hais: readonly (HaiKindId | HaiId)[],
): number[] {
  if (hais.length !== 13) {
    throw new Error(`Invalid number of tiles: expected 13, got ${hais.length}`);
  }

  const counts = Array.from({ length: 34 }, () => 0);
  const kinds = normalizeHaiIds(hais);

  for (const kind of kinds) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts[kind]!++;
  }

  return counts;
}

/**
 * 13枚の牌ID配列を MSPZ形式の文字列（例: "123m456p..."）に変換します。
 * すべての牌をソートして表記します。
 * @throws {Error} 牌の数が13枚でない場合
 */
export function haiIdsToMspzString(
  hais: readonly (HaiKindId | HaiId)[],
): string {
  const counts = haiIdsToCounts34(hais);
  let result = "";

  // 萬子
  const manzu = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.ManZu1; i <= HaiKind.ManZu9; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      manzu.push(haiKindToNumber(i as HaiKindId));
    }
  }
  if (manzu.length > 0) {
    result += manzu.join("") + "m";
  }

  // 筒子
  const pinzu = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.PinZu1; i <= HaiKind.PinZu9; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      pinzu.push(haiKindToNumber(i as HaiKindId));
    }
  }
  if (pinzu.length > 0) {
    result += pinzu.join("") + "p";
  }

  // 索子
  const souzu = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.SouZu1; i <= HaiKind.SouZu9; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      souzu.push(haiKindToNumber(i as HaiKindId));
    }
  }
  if (souzu.length > 0) {
    result += souzu.join("") + "s";
  }

  // 字牌
  const jihai = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let i = HaiKind.Ton; i <= HaiKind.Chun; i++) {
    const count = counts[i] ?? 0;
    for (let j = 0; j < count; j++) {
      // 字牌は 1-7 で表すことが多い (Testing tool such as tenhou-log uses this)
      // 東=1, 南=2, 西=3, 北=4, 白=5, 發=6, 中=7
      const num = i - HaiKind.Ton + 1;
      jihai.push(num);
    }
  }
  if (jihai.length > 0) {
    result += jihai.join("") + "z";
  }

  return result;
}
