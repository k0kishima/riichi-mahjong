import type {
  HaiId,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
  Mentsu,
  MentsuType,
} from "../types";
import { validateTehai13 } from "../core/tehai";
import {
  isExtendedMspz,
  parseExtendedMspz,
  mspzStringToHaiKindIds,
  asMspz,
} from "./mspz";

/**
 * テスト用の Tehai13 オブジェクトを作成します。
 * 作成時に validateTehai13 を実行し、不正な場合はエラーをスローします。
 * これにより、テストデータが正しい Tehai13 であることを保証します。
 */
export function createTehai13<T extends HaiKindId | HaiId>(
  closed: readonly T[],
): Tehai13<T> {
  const tehai: Tehai<T> = {
    closed,
    exposed: [],
  };

  validateTehai13(tehai);

  return tehai;
}

/**
 * テスト用の Mentsu オブジェクトを作成します。
 */
export function createMentsu<T extends HaiKindId | HaiId>(
  type: MentsuType,
  hais: readonly T[],
): Mentsu<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { type, hais } as unknown as Mentsu<T>;
}

/**
 * テスト用の Tehai14 (和了手など) オブジェクトを作成します。
 * Extended MSPZ形式の文字列をサポートし、副露や暗槓を含む手牌を簡単に作成できます。
 *
 * @param mspzString Extended MSPZ形式、または通常のMSPZ形式の文字列
 * @returns Tehai14 オブジェクト
 */
export function createTehai(mspzString: string): Tehai14 {
  if (isExtendedMspz(mspzString)) {
    const result = parseExtendedMspz(mspzString);
    return {
      closed: result.closed,
      exposed: result.exposed,
    };
  }

  // 通常のMSPZ形式の場合
  const ids = mspzStringToHaiKindIds(asMspz(mspzString));
  return {
    closed: ids,
    exposed: [],
  };
}

/**
 * MSPZ形式の文字列から HaiKindId の配列を作成します。
 * テストデータの期待値作成などで使用します。
 *
 * @param mspzString MSPZ形式の文字列 (例: "123m")
 * @returns HaiKindId の配列
 */
export function createHaiKindIds(mspzString: string): HaiKindId[] {
  return mspzStringToHaiKindIds(asMspz(mspzString));
}
