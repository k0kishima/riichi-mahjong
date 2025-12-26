import type { Tehai14, HouraStructure } from "../../../../types";
import { decomposeTehaiForMentsu } from "./mentsu";
import { decomposeTehaiForChiitoitsu } from "./chiitoitsu";
import { decomposeTehaiForKokushi } from "./kokushi";

export * from "./mentsu";
export * from "./chiitoitsu";
export * from "./kokushi";

/**
 * 手牌をすべての可能な和了形に構造化する。
 * 面子手、七対子、国士無双の全ての可能性を探索する。
 */
export function decomposeTehai(tehai: Tehai14): HouraStructure[] {
  return [
    ...decomposeTehaiForMentsu(tehai),
    ...decomposeTehaiForChiitoitsu(tehai),
    ...decomposeTehaiForKokushi(tehai),
  ];
}
