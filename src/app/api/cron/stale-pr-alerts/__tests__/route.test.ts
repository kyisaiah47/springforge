import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";

// Mock dependencies
vi.mock("@/lib/modules/pr-radar/stale-pr-service", () => ({
	createStalePRAlertService: vi.fn(),
}));

vi.mock("@/lib/shared/middleware", () => ({
	withMiddleware: vi.fn((handler) => handler),
}));

describe("/api/cron/stale-pr-alerts", () => {
	let mockAlertService: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock environment variable
		process.env.CRON_SECRET = "test-cron-secret";

		// Mock alert service
		mockAlertService = {
			executeStaleAlertJob: vi.fn(),
			isJobLocked: vi.fn(),
		};

		const { createStalePRAlertService } = vi.mocked(
			require("@/lib/modules/pr-radar/stale-pr-service")
		);
		createStalePRAlertService.mockReturnValue(mockAlertService);
	});

	afterEach(() => {
		delete process.env.CRON_SECRET;
		vi.restoreAllMocks();
	});

	describe("POST", () => {
		it("should execute stale PR alert job successfully", async () => {
			const mockResult = {
				success: true,
				processed_orgs: 2,
				detected_stale_prs: 5,
				sent_alerts: 3,
				execution_time_ms: 1500,
				errors: [],
			};

			mockAlertService.executeStaleAlertJob.mockResolvedValue(mockResult);

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "POST",
					headers: {
						authorization: "Bearer test-cron-secret",
					},
				}
			);

			const context = { req: request };
			const response = await POST(context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe("Stale PR alert job completed successfully");
			expect(data.details.processed_organizations).toBe(2);
			expect(data.details.detected_stale_prs).toBe(5);
			expect(data.details.sent_alerts).toBe(3);
			expect(data.details.execution_time_ms).toBe(1500);
			expect(data.details.errors).toHaveLength(0);
		});

		it("should handle job execution with errors", async () => {
			const mockResult = {
				success: false,
				processed_orgs: 1,
				detected_stale_prs: 2,
				sent_alerts: 1,
				execution_time_ms: 800,
				errors: ["Failed to send alert for org-1"],
			};

			mockAlertService.executeStaleAlertJob.mockResolvedValue(mockResult);

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "POST",
					headers: {
						authorization: "Bearer test-cron-secret",
					},
				}
			);

			const context = { req: request };
			const response = await POST(context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(false);
			expect(data.message).toBe("Stale PR alert job completed with errors");
			expect(data.details.errors).toHaveLength(1);
		});

		it("should reject requests without proper authorization", async () => {
			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "POST",
					headers: {
						authorization: "Bearer wrong-secret",
					},
				}
			);

			const context = { req: request };
			const response = await POST(context);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error.code).toBe("UNAUTHORIZED");
			expect(data.error.message).toBe("Invalid cron authorization");
		});

		it("should reject requests without authorization header", async () => {
			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "POST",
				}
			);

			const context = { req: request };
			const response = await POST(context);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error.code).toBe("UNAUTHORIZED");
		});

		it("should handle missing CRON_SECRET environment variable", async () => {
			delete process.env.CRON_SECRET;

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "POST",
					headers: {
						authorization: "Bearer test-secret",
					},
				}
			);

			const context = { req: request };
			const response = await POST(context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error.code).toBe("CONFIGURATION_ERROR");
			expect(data.error.message).toBe("Cron secret not configured");
		});

		it("should handle service execution errors", async () => {
			mockAlertService.executeStaleAlertJob.mockRejectedValue(
				new Error("Service unavailable")
			);

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "POST",
					headers: {
						authorization: "Bearer test-cron-secret",
					},
				}
			);

			const context = { req: request };
			const response = await POST(context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error.code).toBe("INTERNAL_ERROR");
			expect(data.error.message).toContain("Service unavailable");
		});
	});

	describe("GET", () => {
		it("should return healthy status when job is not locked", async () => {
			mockAlertService.isJobLocked.mockResolvedValue(false);

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "GET",
				}
			);

			const context = { req: request };
			const response = await GET(context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.status).toBe("healthy");
			expect(data.job_locked).toBe(false);
			expect(data.timestamp).toBeDefined();
		});

		it("should return healthy status when job is locked", async () => {
			mockAlertService.isJobLocked.mockResolvedValue(true);

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "GET",
				}
			);

			const context = { req: request };
			const response = await GET(context);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.status).toBe("healthy");
			expect(data.job_locked).toBe(true);
		});

		it("should handle health check errors", async () => {
			mockAlertService.isJobLocked.mockRejectedValue(
				new Error("Database connection failed")
			);

			const request = new NextRequest(
				"http://localhost/api/cron/stale-pr-alerts",
				{
					method: "GET",
				}
			);

			const context = { req: request };
			const response = await GET(context);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error.code).toBe("INTERNAL_ERROR");
			expect(data.error.message).toContain("Database connection failed");
		});
	});
});
