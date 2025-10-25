import { describe, it, expect } from 'vitest';
import { calculateShantenForRegularHand, AGARI_STATE } from '@/shanten';
import { tehaiStringToHaiCounts } from '@/hai';

describe('calculateShantenForRegularHand', () => {
  describe('14 hai hands - various shanten numbers', () => {
    it('should return AGARI_STATE (-1) for winning hand', () => {
      const tiles = tehaiStringToHaiCounts('111234567s11p567m');
      expect(calculateShantenForRegularHand(tiles)).toBe(AGARI_STATE);
    });

    it('should return AGARI_STATE for winning hand with all same suit', () => {
      const tiles = tehaiStringToHaiCounts('11123456788999s');
      expect(calculateShantenForRegularHand(tiles)).toBe(AGARI_STATE);
    });

    it('should return 0 (tenpai) for hand one hai away from winning', () => {
      const tiles = tehaiStringToHaiCounts('111345677s11p567m');
      expect(calculateShantenForRegularHand(tiles)).toBe(0);
    });

    it('should return 0 for tenpai hand with single suit', () => {
      const tiles = tehaiStringToHaiCounts('11122245679999s');
      expect(calculateShantenForRegularHand(tiles)).toBe(0);
    });

    it('should return 1 for 1-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('111345677s15p567m');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 2 for 2-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('11134567s15p1578m');
      expect(calculateShantenForRegularHand(tiles)).toBe(2);
    });

    it('should return 3 for 3-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('113456s1358p1358m');
      expect(calculateShantenForRegularHand(tiles)).toBe(3);
    });

    it('should return 4 for 4-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('1589s13588p1358m1z');
      expect(calculateShantenForRegularHand(tiles)).toBe(4);
    });

    it('should return 5 for 5-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('159s13588p1358m12z');
      expect(calculateShantenForRegularHand(tiles)).toBe(5);
    });

    it('should return 6 for 6-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('1589s258p1358m123z');
      expect(calculateShantenForRegularHand(tiles)).toBe(6);
    });

    it('should return 7 for 7-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('159s17p359m123567z');
      expect(calculateShantenForRegularHand(tiles)).toBe(7);
    });
  });

  describe('hands with honor tiles', () => {
    it('should return 1 for honor tiles only with 4 sets', () => {
      const tiles = tehaiStringToHaiCounts('11112222333444z');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 2 for honor tiles with pair in man', () => {
      const tiles = tehaiStringToHaiCounts('11m111122223333z');
      expect(calculateShantenForRegularHand(tiles)).toBe(2);
    });

    it('should return 2 for honor tiles with tatsu in man', () => {
      const tiles = tehaiStringToHaiCounts('23m111122223333z');
      expect(calculateShantenForRegularHand(tiles)).toBe(2);
    });
  });

  describe('13-tile hands', () => {
    it('should return 1 for 13-tile 1-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('111345677s1p567m');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 1 for 13-tile hand with 4 honor tiles', () => {
      const tiles = tehaiStringToHaiCounts('123456789m1111z');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 1 for 13-tile hand with 4 pin tiles', () => {
      const tiles = tehaiStringToHaiCounts('123456789m1111p');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 1 for 13-tile hand with pairs and sequence', () => {
      const tiles = tehaiStringToHaiCounts('112233s123p1111m');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 1 for 13-tile honor tiles hand', () => {
      const tiles = tehaiStringToHaiCounts('1111222333444z');
      expect(calculateShantenForRegularHand(tiles)).toBe(1);
    });

    it('should return 2 for 12-tile hand with pair in man and honors', () => {
      const tiles = tehaiStringToHaiCounts('11m11112222333z');
      expect(calculateShantenForRegularHand(tiles)).toBe(2);
    });

    it('should return 2 for 12-tile hand with tatsu in man and honors', () => {
      const tiles = tehaiStringToHaiCounts('23m11112222333z');
      expect(calculateShantenForRegularHand(tiles)).toBe(2);
    });

    it('should return 3 for 13-tile honor tiles 3-shanten hand', () => {
      const tiles = tehaiStringToHaiCounts('1111222233334z');
      expect(calculateShantenForRegularHand(tiles)).toBe(3);
    });
  });
});
