import { describe, it, expect } from 'vitest';
import { handStringToTileCounts, isHandString } from '@/tile';

describe('handStringToTileCounts', () => {
  describe('正常系 - 14枚の手牌', () => {
    it('萬子中心の手牌を変換できる', () => {
      const result = handStringToTileCounts('11223344556677m');
      expect(result[0]).toBe(2); // 1m x2
      expect(result[1]).toBe(2); // 2m x2
      expect(result[2]).toBe(2); // 3m x2
      expect(result[3]).toBe(2); // 4m x2
      expect(result[4]).toBe(2); // 5m x2
      expect(result[5]).toBe(2); // 6m x2
      expect(result[6]).toBe(2); // 7m x2
    });

    it('筒子中心の手牌を変換できる', () => {
      const result = handStringToTileCounts('11223344556677p');
      expect(result[9]).toBe(2); // 1p x2
      expect(result[10]).toBe(2); // 2p x2
      expect(result[11]).toBe(2); // 3p x2
      expect(result[12]).toBe(2); // 4p x2
      expect(result[13]).toBe(2); // 5p x2
      expect(result[14]).toBe(2); // 6p x2
      expect(result[15]).toBe(2); // 7p x2
    });

    it('索子中心の手牌を変換できる', () => {
      const result = handStringToTileCounts('11223344556677s');
      expect(result[18]).toBe(2); // 1s x2
      expect(result[19]).toBe(2); // 2s x2
      expect(result[20]).toBe(2); // 3s x2
      expect(result[21]).toBe(2); // 4s x2
      expect(result[22]).toBe(2); // 5s x2
      expect(result[23]).toBe(2); // 6s x2
      expect(result[24]).toBe(2); // 7s x2
    });

    it('字牌を含む手牌を変換できる', () => {
      const result = handStringToTileCounts('123m456p789s1111z');
      // 萬子
      expect(result[0]).toBe(1); // 1m
      expect(result[1]).toBe(1); // 2m
      expect(result[2]).toBe(1); // 3m
      // 筒子
      expect(result[12]).toBe(1); // 4p
      expect(result[13]).toBe(1); // 5p
      expect(result[14]).toBe(1); // 6p
      // 索子
      expect(result[24]).toBe(1); // 7s
      expect(result[25]).toBe(1); // 8s
      expect(result[26]).toBe(1); // 9s
      // 字牌
      expect(result[27]).toBe(4); // 1z (東) x4
    });

    it('複数スーツの混合手牌を変換できる', () => {
      const result = handStringToTileCounts('111234567s11p567m');
      // 萬子
      expect(result[4]).toBe(1); // 5m
      expect(result[5]).toBe(1); // 6m
      expect(result[6]).toBe(1); // 7m
      // 筒子
      expect(result[9]).toBe(2); // 1p x2
      // 索子
      expect(result[18]).toBe(3); // 1s x3
      expect(result[19]).toBe(1); // 2s
      expect(result[20]).toBe(1); // 3s
      expect(result[21]).toBe(1); // 4s
      expect(result[22]).toBe(1); // 5s
      expect(result[23]).toBe(1); // 6s
      expect(result[24]).toBe(1); // 7s
    });
  });

  describe('正常系 - 13枚の手牌', () => {
    it('tenpai形の手牌を変換できる', () => {
      const result = handStringToTileCounts('111345677s11p567m');
      // 萬子: 5,6,7
      expect(result[4]).toBe(1); // 5m
      expect(result[5]).toBe(1); // 6m
      expect(result[6]).toBe(1); // 7m
      // 筒子: 1,1
      expect(result[9]).toBe(2); // 1p x2
      // 索子: 1,1,1,3,4,5,6,7,7
      expect(result[18]).toBe(3); // 1s x3
      expect(result[20]).toBe(1); // 3s
      expect(result[21]).toBe(1); // 4s
      expect(result[22]).toBe(1); // 5s
      expect(result[23]).toBe(1); // 6s
      expect(result[24]).toBe(2); // 7s x2
    });

    it('123456789m1234p (13枚)', () => {
      const result = handStringToTileCounts('123456789m1234p');
      // 萬子: 1-9
      for (let i = 0; i < 9; i++) {
        expect(result[i]).toBe(1);
      }
      // 筒子: 1-4
      expect(result[9]).toBe(1); // 1p
      expect(result[10]).toBe(1); // 2p
      expect(result[11]).toBe(1); // 3p
      expect(result[12]).toBe(1); // 4p
    });
  });

  describe('異常系 - 枚数が不正', () => {
    it('12枚以下の場合はエラー', () => {
      expect(() => handStringToTileCounts('123m456p789s')).toThrow(
        'Invalid hand size: 9 tiles (expected 13 or 14)'
      );
    });

    it('1枚の場合はエラー', () => {
      expect(() => handStringToTileCounts('1m')).toThrow(
        'Invalid hand size: 1 tiles (expected 13 or 14)'
      );
    });

    it('15枚以上の場合はエラー', () => {
      expect(() => handStringToTileCounts('111122223333z444m')).toThrow(
        'Invalid hand size: 15 tiles (expected 13 or 14)'
      );
    });

    it('空文字列の場合はエラー', () => {
      expect(() => handStringToTileCounts('')).toThrow(
        'Invalid hand size: 0 tiles (expected 13 or 14)'
      );
    });
  });

  describe('異常系 - 無効な入力', () => {
    it('スーツがない場合はエラー', () => {
      expect(() => handStringToTileCounts('12345678901234')).toThrow(
        'Hand string must end with a suit letter'
      );
    });

    it('無効なスーツ文字の場合はエラー', () => {
      expect(() => handStringToTileCounts('1234567890123x')).toThrow('Invalid character');
    });

    it('無効な数字の場合はエラー', () => {
      expect(() => handStringToTileCounts('0123456789012m')).toThrow('Invalid tile number');
    });

    it('5枚以上の同じ牌がある場合はエラー', () => {
      expect(() => handStringToTileCounts('11111222233334m')).toThrow('Too many tiles of kind');
    });

    it('字牌で8の数字がある場合はエラー', () => {
      expect(() => handStringToTileCounts('123456789m8888z')).toThrow('Invalid tile number');
    });

    it('字牌で9の数字がある場合はエラー', () => {
      expect(() => handStringToTileCounts('123456789m9999z')).toThrow('Invalid tile number');
    });
  });

  describe('エッジケース', () => {
    it('hをzのエイリアスとして使用できる', () => {
      const result = handStringToTileCounts('123456789m1111h');
      expect(result[27]).toBe(4); // 1z (東)
    });

    it('同じ牌を4枚含む14枚手牌', () => {
      const result = handStringToTileCounts('11112345678999m');
      expect(result[0]).toBe(4); // 1m x4
      expect(result[1]).toBe(1); // 2m
      expect(result[2]).toBe(1); // 3m
      expect(result[3]).toBe(1); // 4m
      expect(result[4]).toBe(1); // 5m
      expect(result[5]).toBe(1); // 6m
      expect(result[6]).toBe(1); // 7m
      expect(result[7]).toBe(1); // 8m
      expect(result[8]).toBe(3); // 9m x3
    });
  });
});

describe('isHandString', () => {
  describe('正常系', () => {
    it('14枚の手牌はtrueを返す', () => {
      expect(isHandString('11223344556677m')).toBe(true);
      expect(isHandString('123m456p789s1111z')).toBe(true);
    });

    it('13枚の手牌はtrueを返す', () => {
      expect(isHandString('111345677s11p567m')).toBe(true);
      expect(isHandString('123456789m1234p')).toBe(true);
    });
  });

  describe('異常系', () => {
    it('12枚以下の手牌はfalseを返す', () => {
      expect(isHandString('123m456p789s')).toBe(false);
      expect(isHandString('1m')).toBe(false);
      expect(isHandString('')).toBe(false);
    });

    it('15枚以上の手牌はfalseを返す', () => {
      expect(isHandString('11111222223333z44m')).toBe(false);
    });

    it('無効な形式はfalseを返す', () => {
      expect(isHandString('1234567890123x')).toBe(false);
      expect(isHandString('12345678901234')).toBe(false);
    });
  });
});
