import { describe, it, expect } from 'vitest';
import { validateHaiCount } from '@/utils/validation';
import { HaiCounts } from '@/types/hai';

describe('validateHaiCount', () => {
  describe('単一の期待値', () => {
    it('期待値と一致する場合はエラーを投げない', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // man
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 14 hai

      expect(() => validateHaiCount(counts, 14)).not.toThrow();
    });

    it('期待値と一致しない場合はエラーを投げる', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // man
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 14 hai

      expect(() => validateHaiCount(counts, 13)).toThrow(
        'Invalid hai count: 14 hai (expected 13)'
      );
    });

    it('0枚の場合も正しく検証できる', () => {
      const counts: HaiCounts = new Array(34).fill(0) as HaiCounts;

      expect(() => validateHaiCount(counts, 0)).not.toThrow();
      expect(() => validateHaiCount(counts, 13)).toThrow(
        'Invalid hai count: 0 hai (expected 13)'
      );
    });
  });

  describe('複数の期待値（配列）', () => {
    it('いずれかの期待値と一致する場合はエラーを投げない (13枚)', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 1, 0, 0, // man: 13 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 13 hai

      expect(() => validateHaiCount(counts, [13, 14])).not.toThrow();
    });

    it('いずれかの期待値と一致する場合はエラーを投げない (14枚)', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // man: 14 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 14 hai

      expect(() => validateHaiCount(counts, [13, 14])).not.toThrow();
    });

    it('どの期待値とも一致しない場合はエラーを投げる', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 0, 0, 0, 0, // man: 10 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 10 hai

      expect(() => validateHaiCount(counts, [13, 14])).toThrow(
        'Invalid hai count: 10 hai (expected 13 or 14)'
      );
    });

    it('3つ以上の期待値も扱える', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 0, 0, 0, 0, 0, // man: 8 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pin
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 8 hai

      expect(() => validateHaiCount(counts, [5, 8, 11])).not.toThrow();
      expect(() => validateHaiCount(counts, [5, 7, 11])).toThrow(
        'Invalid hai count: 8 hai (expected 5 or 7 or 11)'
      );
    });
  });

  describe('エッジケース', () => {
    it('最大枚数（56枚：すべて4枚ずつ×14種）も検証できる', () => {
      const counts: HaiCounts = [
        4, 4, 4, 4, 4, 4, 4, 4, 4, // man: 36 hai
        4, 4, 4, 4, 4, 0, 0, 0, 0, // pin: 20 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // sou
        0, 0, 0, 0, 0, 0, 0, // honors
      ]; // 56 hai

      expect(() => validateHaiCount(counts, 56)).not.toThrow();
    });
  });
});
