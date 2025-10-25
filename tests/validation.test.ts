import { describe, it, expect } from 'vitest';
import { validateTileCount } from '@/utils/validation';
import { TileCounts } from '@/types/tile';

describe('validateTileCount', () => {
  describe('単一の期待値', () => {
    it('期待値と一致する場合はエラーを投げない', () => {
      const counts: TileCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // man
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 14 tiles

      expect(() => validateTileCount(counts, 14)).not.toThrow();
    });

    it('期待値と一致しない場合はエラーを投げる', () => {
      const counts: TileCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // man
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 14 tiles

      expect(() => validateTileCount(counts, 13)).toThrow(
        'Invalid tile count: 14 tiles (expected 13)'
      );
    });

    it('0枚の場合も正しく検証できる', () => {
      const counts: TileCounts = new Array(34).fill(0) as TileCounts;

      expect(() => validateTileCount(counts, 0)).not.toThrow();
      expect(() => validateTileCount(counts, 13)).toThrow(
        'Invalid tile count: 0 tiles (expected 13)'
      );
    });
  });

  describe('複数の期待値（配列）', () => {
    it('いずれかの期待値と一致する場合はエラーを投げない (13枚)', () => {
      const counts: TileCounts = [
        2, 2, 2, 2, 2, 2, 1, 0, 0, // man: 13 tiles
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 13 tiles

      expect(() => validateTileCount(counts, [13, 14])).not.toThrow();
    });

    it('いずれかの期待値と一致する場合はエラーを投げない (14枚)', () => {
      const counts: TileCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // man: 14 tiles
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 14 tiles

      expect(() => validateTileCount(counts, [13, 14])).not.toThrow();
    });

    it('どの期待値とも一致しない場合はエラーを投げる', () => {
      const counts: TileCounts = [
        2, 2, 2, 2, 2, 0, 0, 0, 0, // man: 10 tiles
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 10 tiles

      expect(() => validateTileCount(counts, [13, 14])).toThrow(
        'Invalid tile count: 10 tiles (expected 13 or 14)'
      );
    });

    it('3つ以上の期待値も扱える', () => {
      const counts: TileCounts = [
        2, 2, 2, 2, 0, 0, 0, 0, 0, // man: 8 tiles
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 8 tiles

      expect(() => validateTileCount(counts, [5, 8, 11])).not.toThrow();
      expect(() => validateTileCount(counts, [5, 7, 11])).toThrow(
        'Invalid tile count: 8 tiles (expected 5 or 7 or 11)'
      );
    });
  });

  describe('エッジケース', () => {
    it('最大枚数（56枚：すべて4枚ずつ×14種）も検証できる', () => {
      const counts: TileCounts = [
        4, 4, 4, 4, 4, 4, 4, 4, 4, // man: 36 tiles
        4, 4, 4, 4, 4, 0, 0, 0, 0, // pin: 20 tiles
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 56 tiles

      expect(() => validateTileCount(counts, 56)).not.toThrow();
    });
  });
});
