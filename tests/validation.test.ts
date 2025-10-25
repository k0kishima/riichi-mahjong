import { describe, it, expect } from 'vitest';
import { validateHaiCount } from '@/hai';
import { HaiCounts } from '@/types/hai';

describe('validateHaiCount', () => {
  describe('Single expected value', () => {
    it('should not throw when count matches expected value', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // manzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 14 hai

      expect(() => validateHaiCount(counts, 14)).not.toThrow();
    });

    it('should throw when count does not match expected value', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // manzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 14 hai

      expect(() => validateHaiCount(counts, 13)).toThrow(
        'Invalid hai count: 14 hai (expected 13)'
      );
    });

    it('should correctly validate 0 hai', () => {
      const counts: HaiCounts = new Array(34).fill(0) as HaiCounts;

      expect(() => validateHaiCount(counts, 0)).not.toThrow();
      expect(() => validateHaiCount(counts, 13)).toThrow(
        'Invalid hai count: 0 hai (expected 13)'
      );
    });
  });

  describe('Multiple expected values (array)', () => {
    it('should not throw when count matches one of expected values (13 hai)', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 1, 0, 0, // manzu: 13 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 13 hai

      expect(() => validateHaiCount(counts, [13, 14])).not.toThrow();
    });

    it('should not throw when count matches one of expected values (14 hai)', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 2, 2, 0, 0, // manzu: 14 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 14 hai

      expect(() => validateHaiCount(counts, [13, 14])).not.toThrow();
    });

    it('should throw when count does not match any expected value', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 2, 0, 0, 0, 0, // manzu: 10 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 10 hai

      expect(() => validateHaiCount(counts, [13, 14])).toThrow(
        'Invalid hai count: 10 hai (expected 13 or 14)'
      );
    });

    it('should handle 3 or more expected values', () => {
      const counts: HaiCounts = [
        2, 2, 2, 2, 0, 0, 0, 0, 0, // manzu: 8 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // pinzu
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 8 hai

      expect(() => validateHaiCount(counts, [5, 8, 11])).not.toThrow();
      expect(() => validateHaiCount(counts, [5, 7, 11])).toThrow(
        'Invalid hai count: 8 hai (expected 5 or 7 or 11)'
      );
    });
  });

  describe('Edge cases', () => {
    it('should validate maximum count (56 hai: 4 of each × 14 kinds)', () => {
      const counts: HaiCounts = [
        4, 4, 4, 4, 4, 4, 4, 4, 4, // manzu: 36 hai
        4, 4, 4, 4, 4, 0, 0, 0, 0, // pinzu: 20 hai
        0, 0, 0, 0, 0, 0, 0, 0, 0, // souzu
        0, 0, 0, 0, 0, 0, 0, // jihai
      ]; // 56 hai

      expect(() => validateHaiCount(counts, 56)).not.toThrow();
    });
  });
});
