import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAutoStandCronService } from "../cron-service";

// Mock dependencies
const mockSupabase = {
	from: vi.fn().mockReturnThis(),
	select: vi.fn().mockReturnThis(),
	eq: vi.fn().mockReturnThis(),
	is: vi.fn().mockReturnThis(),
	not: vi.fn().mockReturnThis(),
	single: vi.fn(),
	rpc: vi.fn(),
};

const mockAutoStandService = {
	generateStandup: vi.fn(),
};

const mockSlackService = {
	sendBatchStandups: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../service", () => ({
	createAutoStandService: vi.fn(() => mockAutoStandService),
}));

vi.mock("@/lib/integrations/slack-service", () => ({
	createSlackService: vi.fn(() => mockSlackService),
}));

describe("AutoStandCronService", () => {
	let cronService: ReturnType<typeof createAutoStandCronService>;

	beforeEach(() => {
		vi.clearAllMocks();
		cronService = createAutoStandCronService();
	});

	describe("executeDailyStandupJob", () => {
		it("should successfully execute daily standup job", async () => {
			// Mock job lock acquisition
			mockSupabase.rpc
				.mockResolvedValueOnce({ data: true, error: null })
				.mockResolvedValueOnce({ data: true, error: null });

			// Mock organizations query
			mockSupabase.select.mockResolvedValueOnce({
				data: [
					{
						id: "org-1",
						name: "Test Org",
						settings: {},
						integrations: [
							{
								id: "slack-1",
								type: "slack",
								access_token: "slack-token",
								settings: {},
							},
						],
					},
				],
				error: null,
			});

			// Mock members query
			mockSupabase.select.mockResolvedValueOnce({
				data: [
					{
						id: "member-1",
						github_login: "testuser",
						email: "test@example.com",
						avatar_url: "https://github.com/testuser.png",
					},
				],
				error: null,
			});

			// Mock GitHub integration query
			mockSupabase.single.mockResolvedValueOnce({
				data: {
					id: "github-1",
					type: "github",
					access_token: "github-token",
					settings: {},
				},
				error: null,
			});

			// Mock standup generation
			mockAutoStandService.generateStandup.mockResolvedValue({
				standup: {
					id: "standup-1",
					yesterday: ["Worked on feature X"],
					today: ["Continue feature X"],
					blockers: [],
					raw_github_data: {
						commits: [{ sha: "abc123" }],
						pullRequests: [],
						issues: [],
					},
				},
				generated: true,
			});

			// Mock Slack batch send
			mockSlackService.sendBatchStandups.mockResolvedValue({
				sent: 1,
				failed: 0,
				errors: [],
			});

			const result = await cronService.executeDailyStandupJob();

			expect(result.success).toBe(true);
			expect(result.processed_orgs).toBe(1);
			expect(result.processed_members).toBe(1);
			expect(result.generated_standups).toBe(1);
			expect(result.sent_messages).toBe(1);
			expect(result.errors).toHaveLength(0);
			expect(result.execution_time_ms).toBeGreaterThan(0);
		});

		it("should handle job already locked scenario", async () => {
			mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null });

			const result = await cronService.executeDailyStandupJob();

			expect(result.success).toBe(false);
			expect(result.errors).toContain("Job is already running or locked");
			expect(result.processed_orgs).toBe(0);
		});
	});

	describe("isJobLocked", () => {
		it("should return true when job is locked", async () => {
			mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });

			const result = await cronService.isJobLocked();

			expect(result).toBe(true);
		});

		it("should return false when job is not locked", async () => {
			mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null });

			const result = await cronService.isJobLocked();

			expect(result).toBe(false);
		});
	});
});
