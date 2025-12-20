import { describe, expect, it } from "vitest"; // Ensure vitest is imported
import {
  haiKindIdsToDistribution,
  haiKindIdsToMspzString,
  mspzStringToHaiIds,
} from "./mspz";
import { HaiKind } from "../types";

describe("mspz utils", () => {
  describe("haiKindIdsToDistribution", () => {
    it("MSPZ文字列から生成した牌ID配列を正しくカウントできること", () => {
      const hais = mspzStringToHaiIds("1112345678999m"); // 13枚
      const counts = haiKindIdsToDistribution(hais);

      expect(counts[HaiKind.ManZu1]).toBe(3);
      expect(counts[HaiKind.ManZu2]).toBe(1);
      expect(counts[HaiKind.ManZu3]).toBe(1);
      expect(counts[HaiKind.ManZu4]).toBe(1);
      expect(counts[HaiKind.ManZu5]).toBe(1);
      expect(counts[HaiKind.ManZu6]).toBe(1);
      expect(counts[HaiKind.ManZu7]).toBe(1);
      expect(counts[HaiKind.ManZu8]).toBe(1);
      expect(counts[HaiKind.ManZu9]).toBe(3);

      expect(counts[HaiKind.PinZu1]).toBe(0);
      expect(counts[HaiKind.SouZu1]).toBe(0);
      expect(counts[HaiKind.Ton]).toBe(0);
    });

    it("空の配列は長さチェックでエラーになること", () => {
      expect(() => haiKindIdsToDistribution([])).toThrow();
    });

    it("字牌を含む手牌を正しくカウントできること", () => {
      const hais = mspzStringToHaiIds("113m122p55577z11s"); // 13枚
      // 113m -> 1m:2, 3m:1
      // 122p -> 1p:1, 2p:2
      // 55577z -> 5z(白):3, 7z(中):2
      // 11s -> 1s:2

      const counts = haiKindIdsToDistribution(hais);
      expect(counts[HaiKind.ManZu1]).toBe(2);
      expect(counts[HaiKind.ManZu3]).toBe(1);
      expect(counts[HaiKind.PinZu1]).toBe(1);
      expect(counts[HaiKind.PinZu2]).toBe(2);
      expect(counts[HaiKind.Haku]).toBe(3);
      expect(counts[HaiKind.Chun]).toBe(2);
      expect(counts[HaiKind.SouZu1]).toBe(2);
    });

    it("入力配列の長さが13でない場合、エラーをスローすること", () => {
      const tooFew = [HaiKind.ManZu1, HaiKind.ManZu1];
      expect(() => haiKindIdsToDistribution(tooFew)).toThrow(
        /Invalid number of tiles: expected 13, got 2/,
      );

      const tooMany = Array(14).fill(HaiKind.ManZu1);
      expect(() => haiKindIdsToDistribution(tooMany)).toThrow(
        /Invalid number of tiles: expected 13, got 14/,
      );
    });
  });

  describe("haiKindIdsToMspzString", () => {
    it("牌ID配列をMSPZ文字列に変換できること (萬子)", () => {
      const hais = [
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu6,
        HaiKind.ManZu7,
        HaiKind.ManZu8,
        HaiKind.ManZu9,
        HaiKind.ManZu9,
        HaiKind.ManZu9,
      ];
      expect(haiKindIdsToMspzString(hais)).toBe("1112345678999m");
    });

    it("牌ID配列をMSPZ文字列に変換できること (混合)", () => {
      // 113m 122p 11s 55577z
      const hais = mspzStringToHaiIds("113m122p11s55577z");
      expect(haiKindIdsToMspzString(hais)).toBe("113m122p11s55577z");
    });
  });

  describe("mspzStringToHaiIds", () => {
    it("MSPZ文字列を牌ID配列に変換できること", () => {
      const hais = mspzStringToHaiIds("123m456p789s1122z");
      expect(hais.length).toBe(13); // 3+3+3+4 = 13

      expect(hais[0]).toBe(HaiKind.ManZu1);
      expect(hais[1]).toBe(HaiKind.ManZu2);
      expect(hais[2]).toBe(HaiKind.ManZu3);

      expect(hais[3]).toBe(HaiKind.PinZu4);
      expect(hais[5]).toBe(HaiKind.PinZu6);

      expect(hais[6]).toBe(HaiKind.SouZu7);
      expect(hais[8]).toBe(HaiKind.SouZu9);

      expect(hais[9]).toBe(HaiKind.Ton); // 1z
      expect(hais[10]).toBe(HaiKind.Ton); // 1z
      expect(hais[11]).toBe(HaiKind.Nan); // 2z
      expect(hais[12]).toBe(HaiKind.Nan); // 2z
    });
  });
});
