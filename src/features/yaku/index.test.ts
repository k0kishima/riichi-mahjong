import { describe, it, expect } from "vitest";
import { detectYakuFromTehai } from "./index";
import { createTehai } from "../../utils/test-helpers";
import { mspzStringToHaiKindIds, asMspz } from "../../utils/mspz";
import { HaiKind } from "../../types";

describe("手牌からの役判定 (detectYakuFromTehai) - 統合テスト", () => {
  // 1. 面子手
  describe("面子手 (Mentsu)", () => {
    it("複合役（断么・平和）が判定できること", () => {
      // 234m 234p 234s 678s 88p (8p雀頭)
      // 平和: すべて順子、雀頭役牌なし、両面待ち
      // 断么: 2-8のみ
      // 8p単騎に見えるが、234m 234p 234s 678s + [88p] という構成。
      // あがり牌が両面待ちでなければ平和にならない。
      // 例: 234m 234p 234s 67s [8s]ツモ -> 678s完成 (両面)
      const hand = createTehai("234m234p234s678s88p");
      const agari = mspzStringToHaiKindIds(asMspz("8s"))[0];
      if (agari === undefined) throw new Error("Agari hai not found");

      const result = detectYakuFromTehai(hand, agari, HaiKind.Ton, HaiKind.Nan);

      // Tanyao (1) + Pinfu (1)
      expect(result).toContainEqual(["Tanyao", 1]);
      expect(result).toContainEqual(["Pinfu", 1]);
    });

    it("二盃口が判定でき、七対子とは複合しないこと", () => {
      // 二盃口形: 223344m 223344p 55z
      // これは七対子の形でもあるが、高点法（または手役の性質）により
      // 二盃口（面子手 3飜）として判定されるべき。
      // 二盃口(3) > 七対子(2)
      // ただし detectYakuFromTehai は「最も高得点となる解釈」を返す仕様。
      const hand = createTehai("223344m223344p55z");
      const agari = mspzStringToHaiKindIds(asMspz("2m"))[0];
      if (agari === undefined) throw new Error("Agari hai not found");

      const result = detectYakuFromTehai(hand, agari, HaiKind.Ton, HaiKind.Nan);

      expect(result).toContainEqual(["Ryanpeikou", 3]);
      // 七対子は含まれないはず（面子手として解釈されたため）
      expect(result).not.toContainEqual(["Chiitoitsu", 2]);
    });
  });

  // 2. 七対子
  describe("七対子 (Chiitoitsu)", () => {
    it("複合役（七対子・混一色）が判定できること", () => {
      // 11 22 33 44 55 66m 11z (混一色・七対子)
      const hand = createTehai("11m22m33m44m55m66m11z");
      const agari = mspzStringToHaiKindIds(asMspz("1m"))[0];
      if (agari === undefined) throw new Error("Agari hai not found");

      const result = detectYakuFromTehai(hand, agari, HaiKind.Ton, HaiKind.Nan);

      expect(result).toContainEqual(["Chiitoitsu", 2]);
      expect(result).toContainEqual(["Honitsu", 3]); // 混一色は食い下がりあるが、七対子は門前役なので3飜のはず
    });
  });

  // 3. 国士無双
  describe("国士無双 (KokushiMusou)", () => {
    it("国士無双が判定できること", () => {
      // 19m 19p 19s 1234567z + 1m (13面待ちダブル役満でなく通常の形)
      const hand = createTehai("19m19p19s1234567z1m");
      const agari = mspzStringToHaiKindIds(asMspz("1m"))[0];
      if (agari === undefined) throw new Error("Agari hai not found");

      const result = detectYakuFromTehai(hand, agari, HaiKind.Ton, HaiKind.Nan);

      expect(result).toContainEqual(["KokushiMusou", 13]);
    });
  });
});
