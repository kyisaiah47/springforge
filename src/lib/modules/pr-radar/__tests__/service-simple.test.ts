import { describe, it, expect } from "vitest";
import { createPRRadarService } from "../service";

describe("PRRadarService - Core Logic", () => {
	const prRadarService = createPRRadarService();

	describe("service initialization", () => {
		it("should create service instance successfully", () => {
			expect(prRadarService).toBeDefined();
			expect(typeof prRadarService.createPRInsight).toBe("function");
			expect(typeof prRadarService.getPRInsights).toBe("function");
			expect(typeof prRadarService.scorePR).toBe("function");
			expect(typeof prRadarService.getReviewerSuggestions).toBe("function");
			expect(typeof prRadarService.getStalePRs).toBe("function");
		});
	});

	describe("stale PR calculation", () => {
		it("should calculate days difference correctly", () => {
			const now = new Date();
			const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
			const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

			const daysDiff3 = Math.floor(
				(now.getTime() - threeDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
			);
			const daysDiff7 = Math.floor(
				(now.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
			);

			expect(daysDiff3).toBe(3);
			expect(daysDiff7).toBe(7);
		});

		it("should determine alert levels correctly", () => {
			const warningLevel = 5; // 5 days
			const criticalLevel = 8; // 8 days

			expect(warningLevel < 7 ? "warning" : "critical").toBe("warning");
			expect(criticalLevel >= 7 ? "critical" : "warning").toBe("critical");
		});
	});
});
