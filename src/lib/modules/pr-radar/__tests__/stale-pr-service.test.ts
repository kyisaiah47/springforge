import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStalePRAlertService } from "../stale-pr-service";
import type { StalePRAlert } from "../types";
import { createClient } from "@/lib/supabase/server";
import { createPRRadarService } from "../service";
import { createSlackService } from "@/lib/integrations/slack-service";

// Mock dependencies
vi.mock("@/lib/supabase/server");
vi.mock("../service");
vi.mock("@/lib/integrations/slack-service");

describe("StalePRAlertService", () => {
	let alertService: ReturnType<typeof createStalePRAlertService>;
	let mockSupabase: any;
	let mockPRRadarService: any;
	let mockSlackService: any;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Mock Supabase client
		mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			is: vi.fn().mockReturnThis(),
			upsert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};

		// Mock PR Radar service
		mockPRRadarService = {
			getStalePRs: vi.fn(),
		};

		// Mock Slack service
		mockSlackService = {
			sendPRAlert: vi.fn(),
			getClient: vi.fn().mockReturnValue({
				sendWebhookMessage: vi.fn(),
			}),
		};

		// Setup module mocks
		vi.mocked(createClient).mockResolvedValue(mockSupabase);
		vi.mocked(createPRRadarService).mockReturnValue(mockPRRadarService);
		vi.mocked(createSlackService).mockReturnValue(mockSlackService);

		alertService = createStalePRAlertService();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("executeStaleAlertJob", () => {
		it("should process organizations and send alerts for stale PRs", async () => {
			// Mock organizations with Slack integrations
			const mockOrganizations = [
				{
					id: "org-1",
					name: "Test Org",
					settings: {},
					integrations: [
						{
							id: "slack-1",
							type: "slack",
							access_token: "token",
							settings: { webhook_url: "https://hooks.slack.com/test" },
						},
					],
				},
			];

			// Mock stale PRs
			const mockStalePRs: StalePRAlert[] = [
				{
					pr_insight: {
						id: "pr-1",
						org_id: "org-1",
						repo: "test/repo",
						number: 123,
						risk_score: 5,
						size_score: 3,
						suggested_reviewers: ["reviewer1"],
						status: "open",
						opened_at: "2024-01-01T00:00:00Z",
						updated_at: "2024-01-01T00:00:00Z",
					} as any,
					days_stale: 3,
					last_activity: "2024-01-01T00:00:00Z",
					alert_level: "warning" as const,
				},
				{
					pr_insight: {
						id: "pr-2",
						org_id: "org-1",
						repo: "test/repo",
						number: 456,
						risk_score: 8,
						size_score: 7,
						suggested_reviewers: ["reviewer2"],
						status: "open",
						opened_at: "2024-01-01T00:00:00Z",
						updated_at: "2024-01-01T00:00:00Z",
					} as any,
					days_stale: 8,
					last_activity: "2024-01-01T00:00:00Z",
					alert_level: "critical" as const,
				},
			];

			// Setup mocks
			mockSupabase.single
				.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // Job lock check
				.mockResolvedValueOnce({ data: mockOrganizations, error: null }); // Organizations query

			mockSupabase.upsert.mockResolvedValue({ error: null }); // Acquire lock
			mockSupabase.update.mockResolvedValue({ error: null }); // Release lock

			mockPRRadarService.getStalePRs.mockResolvedValue({
				stale_prs: mockStalePRs,
				total_count: 2,
			});

			mockSlackService.sendPRAlert.mockResolvedValue(undefined);
			mockSlackService
				.getClient()
				.sendWebhookMessage.mockResolvedValue(undefined);

			// Execute the job
			const result = await alertService.executeStaleAlertJob();

			// Verify results
			expect(result.success).toBe(true);
			expect(result.processed_orgs).toBe(1);
			expect(result.detected_stale_prs).toBe(2);
			expect(result.sent_alerts).toBe(2); // 1 critical alert + 1 summary for warnings
			expect(result.errors).toHaveLength(0);

			// Verify PR Radar service was called
			expect(mockPRRadarService.getStalePRs).toHaveBeenCalledWith("org-1", {
				days_threshold: 2,
				exclude_draft: true,
			});

			// Verify Slack alerts were sent
			expect(mockSlackService.sendPRAlert).toHaveBeenCalledTimes(1); // Critical PR
			expect(
				mockSlackService.getClient().sendWebhookMessage
			).toHaveBeenCalledTimes(1); // Summary
		});

		it("should handle organizations with no stale PRs", async () => {
			const mockOrganizations = [
				{
					id: "org-1",
					name: "Test Org",
					settings: {},
					integrations: [
						{
							id: "slack-1",
							type: "slack",
							access_token: "token",
							settings: { webhook_url: "https://hooks.slack.com/test" },
						},
					],
				},
			];

			// Setup mocks
			mockSupabase.single
				.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // Job lock check
				.mockResolvedValueOnce({ data: mockOrganizations, error: null }); // Organizations query

			mockSupabase.upsert.mockResolvedValue({ error: null }); // Acquire lock
			mockSupabase.update.mockResolvedValue({ error: null }); // Release lock

			mockPRRadarService.getStalePRs.mockResolvedValue({
				stale_prs: [],
				total_count: 0,
			});

			// Execute the job
			const result = await alertService.executeStaleAlertJob();

			// Verify results
			expect(result.success).toBe(true);
			expect(result.processed_orgs).toBe(1);
			expect(result.detected_stale_prs).toBe(0);
			expect(result.sent_alerts).toBe(0);
			expect(result.errors).toHaveLength(0);

			// Verify no Slack alerts were sent
			expect(mockSlackService.sendPRAlert).not.toHaveBeenCalled();
			expect(
				mockSlackService.getClient().sendWebhookMessage
			).not.toHaveBeenCalled();
		});

		it("should handle job already running", async () => {
			// Mock job lock exists
			mockSupabase.single.mockResolvedValue({
				data: {
					job_name: "stale_pr_alerts",
					is_locked: true,
					locked_at: new Date().toISOString(),
				},
				error: null,
			});

			// Execute the job
			const result = await alertService.executeStaleAlertJob();

			// Verify results
			expect(result.success).toBe(false);
			expect(result.errors).toContain("Stale PR alert job is already running");
		});
	});

	describe("isJobLocked", () => {
		it("should return false when no lock exists", async () => {
			mockSupabase.single.mockResolvedValue({
				data: null,
				error: { code: "PGRST116" },
			});

			const isLocked = await alertService.isJobLocked();
			expect(isLocked).toBe(false);
		});

		it("should return true when lock exists and is recent", async () => {
			mockSupabase.single.mockResolvedValue({
				data: {
					job_name: "stale_pr_alerts",
					is_locked: true,
					locked_at: new Date().toISOString(),
				},
				error: null,
			});

			const isLocked = await alertService.isJobLocked();
			expect(isLocked).toBe(true);
		});

		it("should release expired lock and return false", async () => {
			// Mock expired lock (2 hours old)
			const expiredTime = new Date();
			expiredTime.setHours(expiredTime.getHours() - 2);

			mockSupabase.single.mockResolvedValue({
				data: {
					job_name: "stale_pr_alerts",
					is_locked: true,
					locked_at: expiredTime.toISOString(),
				},
				error: null,
			});

			mockSupabase.update.mockResolvedValue({ error: null });

			const isLocked = await alertService.isJobLocked();
			expect(isLocked).toBe(false);

			// Verify lock was released
			expect(mockSupabase.update).toHaveBeenCalledWith({
				is_locked: false,
				locked_at: expect.any(String),
			});
		});
	});
});
