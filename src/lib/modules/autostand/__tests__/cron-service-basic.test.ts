import { describe, it, expect } from "vitest";
import { createAutoStandCronService } from "../cron-service";

describe("AutoStandCronService Basic Tests", () => {
	it("should create cron service instance", () => {
		const cronService = createAutoStandCronService();
		expect(cronService).toBeDefined();
		expect(typeof cronService.executeDailyStandupJob).toBe("function");
		expect(typeof cronService.isJobLocked).toBe("function");
	});
});
