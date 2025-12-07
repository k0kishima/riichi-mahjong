import { describe, expect, it } from "vitest";
import { isMpszString, mpszStringToHaiCounts } from "@/hai";

describe("mpszStringToHaiCounts", () => {
	describe("Valid cases - 14 hai tehai", () => {
		it("should convert manzu-centered tehai", () => {
			const result = mpszStringToHaiCounts("11223344556677m");
			expect(result[0]).toBe(2); // 1m x2
			expect(result[1]).toBe(2); // 2m x2
			expect(result[2]).toBe(2); // 3m x2
			expect(result[3]).toBe(2); // 4m x2
			expect(result[4]).toBe(2); // 5m x2
			expect(result[5]).toBe(2); // 6m x2
			expect(result[6]).toBe(2); // 7m x2
		});

		it("should convert pinzu-centered tehai", () => {
			const result = mpszStringToHaiCounts("11223344556677p");
			expect(result[9]).toBe(2); // 1p x2
			expect(result[10]).toBe(2); // 2p x2
			expect(result[11]).toBe(2); // 3p x2
			expect(result[12]).toBe(2); // 4p x2
			expect(result[13]).toBe(2); // 5p x2
			expect(result[14]).toBe(2); // 6p x2
			expect(result[15]).toBe(2); // 7p x2
		});

		it("should convert souzu-centered tehai", () => {
			const result = mpszStringToHaiCounts("11223344556677s");
			expect(result[18]).toBe(2); // 1s x2
			expect(result[19]).toBe(2); // 2s x2
			expect(result[20]).toBe(2); // 3s x2
			expect(result[21]).toBe(2); // 4s x2
			expect(result[22]).toBe(2); // 5s x2
			expect(result[23]).toBe(2); // 6s x2
			expect(result[24]).toBe(2); // 7s x2
		});

		it("should convert tehai including jihai", () => {
			const result = mpszStringToHaiCounts("123m456p789s1111z");
			// manzu
			expect(result[0]).toBe(1); // 1m
			expect(result[1]).toBe(1); // 2m
			expect(result[2]).toBe(1); // 3m
			// pinzu
			expect(result[12]).toBe(1); // 4p
			expect(result[13]).toBe(1); // 5p
			expect(result[14]).toBe(1); // 6p
			// souzu
			expect(result[24]).toBe(1); // 7s
			expect(result[25]).toBe(1); // 8s
			expect(result[26]).toBe(1); // 9s
			// jihai
			expect(result[27]).toBe(4); // 1z (East) x4
		});

		it("should convert mixed suits tehai", () => {
			const result = mpszStringToHaiCounts("111234567s11p567m");
			// manzu
			expect(result[4]).toBe(1); // 5m
			expect(result[5]).toBe(1); // 6m
			expect(result[6]).toBe(1); // 7m
			// pinzu
			expect(result[9]).toBe(2); // 1p x2
			// souzu
			expect(result[18]).toBe(3); // 1s x3
			expect(result[19]).toBe(1); // 2s
			expect(result[20]).toBe(1); // 3s
			expect(result[21]).toBe(1); // 4s
			expect(result[22]).toBe(1); // 5s
			expect(result[23]).toBe(1); // 6s
			expect(result[24]).toBe(1); // 7s
		});
	});

	describe("Valid cases - 13 hai tehai", () => {
		it("should convert tenpai-shaped tehai", () => {
			const result = mpszStringToHaiCounts("111345677s11p567m");
			// manzu: 5,6,7
			expect(result[4]).toBe(1); // 5m
			expect(result[5]).toBe(1); // 6m
			expect(result[6]).toBe(1); // 7m
			// pinzu: 1,1
			expect(result[9]).toBe(2); // 1p x2
			// souzu: 1,1,1,3,4,5,6,7,7
			expect(result[18]).toBe(3); // 1s x3
			expect(result[20]).toBe(1); // 3s
			expect(result[21]).toBe(1); // 4s
			expect(result[22]).toBe(1); // 5s
			expect(result[23]).toBe(1); // 6s
			expect(result[24]).toBe(2); // 7s x2
		});

		it("should convert 123456789m1234p (13 hai)", () => {
			const result = mpszStringToHaiCounts("123456789m1234p");
			// manzu: 1-9
			for (let i = 0; i < 9; i++) {
				expect(result[i]).toBe(1);
			}
			// pinzu: 1-4
			expect(result[9]).toBe(1); // 1p
			expect(result[10]).toBe(1); // 2p
			expect(result[11]).toBe(1); // 3p
			expect(result[12]).toBe(1); // 4p
		});
	});

	describe("Invalid cases - incorrect number of hai", () => {
		it("should throw error for empty string", () => {
			expect(() => mpszStringToHaiCounts("")).toThrow(
				"Invalid MPSZ string size: 0 hai",
			);
		});
	});

	describe("Invalid cases - invalid input", () => {
		it("should throw error when suit letter is missing", () => {
			expect(() => mpszStringToHaiCounts("12345678901234")).toThrow(
				"MPSZ string must end with a suit letter",
			);
		});

		it("should throw error for invalid suit character", () => {
			expect(() => mpszStringToHaiCounts("1234567890123x")).toThrow(
				"Invalid character",
			);
		});

		it("should throw error for invalid number", () => {
			expect(() => mpszStringToHaiCounts("123456789123x")).toThrow(
				"Invalid character",
			);
		});

		it("should throw error when same hai appears 5 or more times", () => {
			expect(() => mpszStringToHaiCounts("11111222233334m")).toThrow(
				"Too many hai of kind",
			);
		});

		it("should throw error for jihai with number 8", () => {
			expect(() => mpszStringToHaiCounts("123456789m8888z")).toThrow(
				"Invalid hai number",
			);
		});

		it("should throw error for jihai with number 9", () => {
			expect(() => mpszStringToHaiCounts("123456789m9999z")).toThrow(
				"Invalid hai number",
			);
		});
	});

	describe("Edge cases", () => {
		it("should handle 14-hai tehai with 4 of the same hai", () => {
			const result = mpszStringToHaiCounts("11112345678999m");
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
	describe("Red Five cases", () => {
		it("should treat 0m, 0p, 0s as 5", () => {
			// 0m, 0p, 0s + others to make 13 tiles
			const result = mpszStringToHaiCounts("0m0p0s1112223334z");
			expect(result[4]).toBe(1); // 5m
			expect(result[13]).toBe(1); // 5p
			expect(result[22]).toBe(1); // 5s
		});

		it("should handle mixed red and normal fives", () => {
			// 055m + others to make 13 tiles
			const result = mpszStringToHaiCounts("055m1112223334z");
			expect(result[4]).toBe(3); // 5m x3
		});

		it("should throw error for 0z (Red Five Jihai)", () => {
			expect(() => mpszStringToHaiCounts("0z123456789123m")).toThrow(
				"Red Five not allowed for Jihai",
			);
		});
	});
});

describe("isMpszString", () => {
	describe("Valid cases", () => {
		it("should return true for 14-hai tehai", () => {
			expect(isMpszString("11223344556677m")).toBe(true);
			expect(isMpszString("123m456p789s1111z")).toBe(true);
		});

		it("should return true for 13-hai tehai", () => {
			expect(isMpszString("111345677s11p567m")).toBe(true);
			expect(isMpszString("123456789m1234p")).toBe(true);
		});
	});

	describe("Partial/Overfilled cases (Now Valid)", () => {
		it("should return true for 12 or fewer hai tehai", () => {
			expect(isMpszString("123m456p789s")).toBe(true);
			expect(isMpszString("1m")).toBe(true);
		});

		it("should return false for empty string", () => {
			expect(isMpszString("")).toBe(false);
		});

		it("should return true for 15 or more hai tehai", () => {
			expect(isMpszString("1111222233334444m")).toBe(true);
		});
	});

	it("should return false for invalid format", () => {
		expect(isMpszString("1234567890123x")).toBe(false);
		expect(isMpszString("12345678901234")).toBe(false);
	});
});
