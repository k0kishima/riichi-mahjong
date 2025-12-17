import { describe, expect, it } from "vitest";
import { type Furo, FuroType, HAI_KIND_IDS, HaiKind, Tacha } from "./types.js";

describe("HaiKindId (牌種ID)", () => {
  it("34種類の牌IDが定義されていること", () => {
    expect(HAI_KIND_IDS).toHaveLength(34);
  });

  it("HaiKind 定数が正しいIDにマッピングされていること", () => {
    expect(HaiKind.ManZu1).toBe(0);
    expect(HaiKind.ManZu9).toBe(8);
    expect(HaiKind.PinZu1).toBe(9);
    expect(HaiKind.PinZu9).toBe(17);
    expect(HaiKind.SouZu1).toBe(18);
    expect(HaiKind.SouZu9).toBe(26);
    expect(HaiKind.Ton).toBe(27);
    expect(HaiKind.Chun).toBe(33);
  });

  describe("ShantenNumber (シャンテン数)", () => {
    it("型としてインポート可能であること", () => {
      // 型レベルのチェックのため、ランタイムでのアサーションは行わないが、
      // コンパイルエラーにならないことを確認する意図。
      const tenpai: import("./types").ShantenNumber = 0;
      const maxShanten: import("./types").ShantenNumber = 13;
      expect(tenpai).toBe(0);
      expect(maxShanten).toBe(13);
    });
  });

  describe("Tacha (他家)", () => {
    it("定義値が正しいこと", () => {
      expect(Tacha.Shimocha).toBe(1);
      expect(Tacha.Toimen).toBe(2);
      expect(Tacha.Kamicha).toBe(3);
    });

    it("要素数が3つであること", () => {
      expect(Object.keys(Tacha)).toHaveLength(3);
    });
  });

  describe("Furo (副露メタ情報)", () => {
    it("Chi/Pon/Daiminkan/Kakan は from プロパティを持つこと", () => {
      // 型チェックを通るオブジェクトを生成できるか確認
      const chi: Furo = { type: FuroType.Chi, from: Tacha.Kamicha };
      const pon: Furo = { type: FuroType.Pon, from: Tacha.Toimen };
      const daiminkan: Furo = {
        type: FuroType.Daiminkan,
        from: Tacha.Shimocha,
      };
      const kakan: Furo = { type: FuroType.Kakan, from: Tacha.Kamicha };

      expect(chi.from).toBe(3);
      expect(pon.from).toBe(2);
      expect(daiminkan.from).toBe(1);
      expect(kakan.from).toBe(3);
    });

    it("Ankan は from プロパティを持たないこと", () => {
      const ankan: Furo = { type: FuroType.Ankan };

      expect(ankan.type).toBe(FuroType.Ankan);
      expect(ankan).not.toHaveProperty("from");
    });
  });
});
