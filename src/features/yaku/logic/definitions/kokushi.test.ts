import { describe, it, expect } from "vitest";
import { kokushiDefinition } from "./kokushi";
import type { HouraContext, HouraStructure } from "../../types";
import { HaiKind, type KokushiHouraStructure } from "../../../../types";

describe("国士無双の判定", () => {
  const baseContext: HouraContext = {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
  };

  it("国士無双形の構造に対して成立すること", () => {
    const hand: KokushiHouraStructure = {
      type: "Kokushi",
      yaochu: [
        HaiKind.ManZu1,
        HaiKind.ManZu9,
        HaiKind.PinZu1,
        HaiKind.PinZu9,
        HaiKind.SouZu1,
        HaiKind.SouZu9,
        HaiKind.Ton,
        HaiKind.Nan,
        HaiKind.Sha,
        HaiKind.Pei,
        HaiKind.Haku,
        HaiKind.Hatsu,
        HaiKind.Chun,
      ],
      jantou: HaiKind.ManZu1,
    };
    expect(kokushiDefinition.isSatisfied(hand, baseContext)).toBe(true);
    expect(kokushiDefinition.getHansu(hand, baseContext)).toBe(13);
  });

  it("面子手の構造に対しては不成立であること", () => {
    const hand: HouraStructure = {
      type: "Mentsu",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      fourMentsu: [] as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      jantou: { type: "Toitsu", hais: [HaiKind.ManZu1, HaiKind.ManZu1] } as any,
    };
    expect(kokushiDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(kokushiDefinition.getHansu(hand, baseContext)).toBe(0);
  });

  it("七対子手の構造に対しては不成立であること", () => {
    const hand: HouraStructure = {
      type: "Chiitoitsu",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      pairs: [] as any,
    };
    expect(kokushiDefinition.isSatisfied(hand, baseContext)).toBe(false);
    expect(kokushiDefinition.getHansu(hand, baseContext)).toBe(0);
  });
});
