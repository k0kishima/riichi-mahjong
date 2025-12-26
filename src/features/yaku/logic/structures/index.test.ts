import { describe, it, expect } from "vitest";
import { decomposeTehai } from "./index";
import { createTehai } from "../../../../utils/test-helpers";
import { CompletedMentsu, HouraStructure, MentsuType } from "../../../../types";

describe("decomposeTehai (Unified)", () => {
  describe("多義的な手牌 (Ambiguous Hands)", () => {
    it("三連刻形（111222333）が複数の構造として解釈できること", () => {
      // 111m 222m 333m 456p 99s
      const hand = createTehai("111m222m333m456p99s");
      const results = decomposeTehai(hand);

      expect(results.length).toBeGreaterThan(1);

      // パターン1: 刻子x3 (Toitoi系)
      const hasToitoiShape = results.some((r: HouraStructure) => {
        if (r.type !== "Mentsu") return false;
        const koutsuCount = r.fourMentsu.filter(
          (m: CompletedMentsu) => m.type === MentsuType.Koutsu,
        ).length;
        return koutsuCount >= 3;
      });
      expect(hasToitoiShape).toBe(true);

      // パターン2: 順子x3 (Pinfu系, Ryanpeikou系)
      const hasPinfuShape = results.some((r: HouraStructure) => {
        if (r.type !== "Mentsu") return false;
        const shuntsuCount = r.fourMentsu.filter(
          (m: CompletedMentsu) => m.type === MentsuType.Shuntsu,
        ).length;
        // 456p も順子なので合計4つの順子になるはず
        return shuntsuCount === 4;
      });
      expect(hasPinfuShape).toBe(true);
    });

    it("二盃口形であり七対子形でもある手牌が両方の構造として解釈できること", () => {
      // 223344m 223344p 55s
      // 七対子: 22,33,44,22,33,44,55
      // 二盃口(面子手): 234,234,234,234,55
      const hand = createTehai("223344m223344p55s");
      const results = decomposeTehai(hand);

      expect(results.length).toBeGreaterThan(1);

      const hasChiitoitsu = results.some((r) => r.type === "Chiitoitsu");
      const hasMentsu = results.some((r) => r.type === "Mentsu");

      expect(hasChiitoitsu).toBe(true);
      expect(hasMentsu).toBe(true);
    });
  });
});
