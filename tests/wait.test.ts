import { describe, expect, it } from "vitest";
import { mpszStringToHaiCounts } from "../src/hai";
import { calculateWaits } from "../src/index";

describe("calculateWaits", () => {
	it("should calculate waits for a simple ryanmen", () => {
		// 23m 456p 789s 111z 22z (13 tiles)
		// Waiting for 1m, 4m
		const hand = mpszStringToHaiCounts("23m456p789s111z22z");
		const waits = calculateWaits(hand);
		expect(waits).toEqual([0, 3]); // 1m, 4m
	});

	it("should calculate waits for sanmenchan", () => {
		// 23456m 456p 789s 11z (13 tiles)
		// Waiting for 1m, 4m, 7m
		const hand = mpszStringToHaiCounts("23456m456p789s11z");
		const waits = calculateWaits(hand);
		expect(waits).toEqual([0, 3, 6]); // 1m, 4m, 7m
	});

	it("should calculate waits for tanki (single tile wait)", () => {
		// 123m 456p 789s 111z 2z (13 tiles)
		// Waiting for 2z (pair)
		const hand = mpszStringToHaiCounts("123m456p789s111z2z");
		const waits = calculateWaits(hand);
		expect(waits).toEqual([28]); // 2z
	});

	it("should calculate waits for kanchan (middle wait)", () => {
		// 13m 456p 789s 111z 22z (13 tiles)
		// Waiting for 2m
		const hand = mpszStringToHaiCounts("13m456p789s111z22z");
		const waits = calculateWaits(hand);
		expect(waits).toEqual([1]); // 2m
	});

	it("should calculate waits for penchan (edge wait)", () => {
		// 12m 456p 789s 111z 22z (13 tiles)
		// Waiting for 3m
		const hand = mpszStringToHaiCounts("12m456p789s111z22z");
		const waits = calculateWaits(hand);
		expect(waits).toEqual([2]); // 3m
	});

	it("should calculate waits for shanpon (dual pon wait)", () => {
		// 11m 456p 789s 22z 333z (13 tiles)
		// Waiting for 1m, 2z
		const hand = mpszStringToHaiCounts("11m456p789s22z333z");
		const waits = calculateWaits(hand);
		expect(waits.sort()).toEqual([0, 28].sort()); // 1m, 2z
	});

	it("should calculate waits for nobetan (extended wait)", () => {
		// 2345m 456p 789s 111z (13 tiles)
		// Waiting for 2m, 5m
		const hand = mpszStringToHaiCounts("2345m456p789s111z");
		const waits = calculateWaits(hand);
		expect(waits.sort()).toEqual([1, 4].sort()); // 2m, 5m
	});

	it("should return empty array for non-tenpai hand", () => {
		// 1358m 1358p 1358s 1z (13 tiles) - 4 shanten
		const hand = mpszStringToHaiCounts("1358m1358p1358s1z");
		const waits = calculateWaits(hand);
		expect(waits).toEqual([]);
	});

	it("should throw error for invalid tile count", () => {
		// Manually create a HaiCounts with 14 tiles to test calculateWaits validation
		// (mpszStringToHaiCounts allows 14, but calculateWaits expects 13)
		// 123m 456p 789s 1111z 5m (14 tiles)
		const hand = mpszStringToHaiCounts("123m456p789s1111z5m"); // 14 tiles
		expect(() => calculateWaits(hand)).toThrow("Invalid hai count");
	});
});
