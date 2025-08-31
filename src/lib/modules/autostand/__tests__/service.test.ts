import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutoStandService } from "../service";
import type { GitHubActivity } from "../types";

// Mock Supabase client
const mockSupabaseClient = {
	from: vi.fn(),
	auth: {
		getUser: vi.fn(),
	},
};

// Mock GitHub service
const mockGitHubService = {
	getUserActivity: vi.fn(),
};

// Mock the dependencies
vi.mock("@/lib/supabase/server", () => ({
	createClient: () => mockSupabaseClient,
}));

vi.mock("@/lib/integrations/github-service", () => ({
	createGitHubService: () => mockGitHubService,
}));

describe("AutoStandService", () => {
	let service: AutoStandService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AutoStandService();
	});

	describe("generateStandupFromGitHub", () => {
		it("should generate standup items from GitHub commits", () => {
			const githubActivity: GitHubActivity = {
				commits: [
					{
						sha: "abc123",
						message: "Fix user authentication bug",
						url: "https://github.com/org/repo/commit/abc123",
						repository: "org/repo",
						timestamp: "2024-01-15T10:00:00Z",
					},
					{
						sha: "def456",
						message: "Add unit tests",
						url: "https://github.com/org/repo/commit/def456",
						repository: "org/repo",
						timestamp: "2024-01-15T14:00:00Z",
					},
				],
				pullRequests: [],
				issues: [],
			};

			// Access private method for testing
			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const items = generateYesterdayItems(githubActivity);

			expect(items).toContain("Made 2 commits to org/repo");
		});

		it("should generate standup items from single commit", () => {
			const githubActivity: GitHubActivity = {
				commits: [
					{
						sha: "abc123",
						message: "Fix user authentication bug",
						url: "https://github.com/org/repo/commit/abc123",
						repository: "org/repo",
						timestamp: "2024-01-15T10:00:00Z",
					},
				],
				pullRequests: [],
				issues: [],
			};

			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const items = generateYesterdayItems(githubActivity);

			expect(items).toContain(
				'Committed "Fix user authentication bug" to org/repo'
			);
		});

		it("should generate standup items from merged PRs", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [
					{
						number: 123,
						title: "Add new feature",
						url: "https://github.com/org/repo/pull/123",
						repository: "org/repo",
						state: "merged",
						created_at: "2024-01-15T09:00:00Z",
						merged_at: "2024-01-15T15:00:00Z",
					},
				],
				issues: [],
			};

			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const items = generateYesterdayItems(githubActivity);

			expect(items).toContain("Merged PR #123: Add new feature in org/repo");
		});

		it("should generate standup items from opened PRs", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [
					{
						number: 124,
						title: "Fix critical bug",
						url: "https://github.com/org/repo/pull/124",
						repository: "org/repo",
						state: "open",
						created_at: "2024-01-15T16:00:00Z",
					},
				],
				issues: [],
			};

			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const items = generateYesterdayItems(githubActivity);

			expect(items).toContain("Opened PR #124: Fix critical bug in org/repo");
		});

		it("should generate standup items from closed issues", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [],
				issues: [
					{
						number: 456,
						title: "User login not working",
						url: "https://github.com/org/repo/issues/456",
						repository: "org/repo",
						state: "closed",
						created_at: "2024-01-14T10:00:00Z",
						closed_at: "2024-01-15T12:00:00Z",
					},
				],
			};

			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const items = generateYesterdayItems(githubActivity);

			expect(items).toContain(
				"Closed issue #456: User login not working in org/repo"
			);
		});

		it("should return default message when no activity", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [],
				issues: [],
			};

			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const items = generateYesterdayItems(githubActivity);

			expect(items).toContain("No GitHub activity recorded");
		});

		it("should generate today items from open PRs", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [
					{
						number: 125,
						title: "Implement new API endpoint",
						url: "https://github.com/org/repo/pull/125",
						repository: "org/repo",
						state: "open",
						created_at: "2024-01-15T16:00:00Z",
					},
				],
				issues: [],
			};

			const generateTodayItems = (service as any).generateTodayItems.bind(
				service
			);
			const items = generateTodayItems(githubActivity);

			expect(items).toContain(
				"Continue work on PR #125: Implement new API endpoint in org/repo"
			);
		});

		it("should generate today items from open issues", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [],
				issues: [
					{
						number: 789,
						title: "Performance optimization needed",
						url: "https://github.com/org/repo/issues/789",
						repository: "org/repo",
						state: "open",
						created_at: "2024-01-15T08:00:00Z",
					},
				],
			};

			const generateTodayItems = (service as any).generateTodayItems.bind(
				service
			);
			const items = generateTodayItems(githubActivity);

			expect(items).toContain(
				"Work on issue #789: Performance optimization needed in org/repo"
			);
		});

		it("should return default today message when no open work", () => {
			const githubActivity: GitHubActivity = {
				commits: [],
				pullRequests: [
					{
						number: 123,
						title: "Completed feature",
						url: "https://github.com/org/repo/pull/123",
						repository: "org/repo",
						state: "merged",
						created_at: "2024-01-15T09:00:00Z",
						merged_at: "2024-01-15T15:00:00Z",
					},
				],
				issues: [
					{
						number: 456,
						title: "Fixed bug",
						url: "https://github.com/org/repo/issues/456",
						repository: "org/repo",
						state: "closed",
						created_at: "2024-01-14T10:00:00Z",
						closed_at: "2024-01-15T12:00:00Z",
					},
				],
			};

			const generateTodayItems = (service as any).generateTodayItems.bind(
				service
			);
			const items = generateTodayItems(githubActivity);

			expect(items).toContain("Continue current development tasks");
		});

		it("should handle mixed activity types correctly", () => {
			const githubActivity: GitHubActivity = {
				commits: [
					{
						sha: "abc123",
						message: "Fix authentication",
						url: "https://github.com/org/repo1/commit/abc123",
						repository: "org/repo1",
						timestamp: "2024-01-15T10:00:00Z",
					},
				],
				pullRequests: [
					{
						number: 123,
						title: "Add feature",
						url: "https://github.com/org/repo2/pull/123",
						repository: "org/repo2",
						state: "merged",
						created_at: "2024-01-15T09:00:00Z",
						merged_at: "2024-01-15T15:00:00Z",
					},
					{
						number: 124,
						title: "Work in progress",
						url: "https://github.com/org/repo2/pull/124",
						repository: "org/repo2",
						state: "open",
						created_at: "2024-01-15T16:00:00Z",
					},
				],
				issues: [
					{
						number: 456,
						title: "Fixed bug",
						url: "https://github.com/org/repo1/issues/456",
						repository: "org/repo1",
						state: "closed",
						created_at: "2024-01-14T10:00:00Z",
						closed_at: "2024-01-15T12:00:00Z",
					},
				],
			};

			const generateYesterdayItems = (
				service as any
			).generateYesterdayItems.bind(service);
			const yesterdayItems = generateYesterdayItems(githubActivity);

			const generateTodayItems = (service as unknown).generateTodayItems.bind(
				service
			);
			const todayItems = generateTodayItems(githubActivity);

			// Yesterday should include commits, merged PRs, and closed issues
			expect(yesterdayItems).toContain(
				'Committed "Fix authentication" to org/repo1'
			);
			expect(yesterdayItems).toContain(
				"Merged PR #123: Add feature in org/repo2"
			);
			expect(yesterdayItems).toContain(
				"Closed issue #456: Fixed bug in org/repo1"
			);

			// Today should include open PRs
			expect(todayItems).toContain(
				"Continue work on PR #124: Work in progress in org/repo2"
			);
		});
	});

	describe("generateStandup", () => {
		it("should return existing standup if already exists", async () => {
			const existingStandup = {
				id: "standup-123",
				org_id: "org-123",
				member_id: "member-123",
				date: "2024-01-15",
				yesterday: ["Worked on feature"],
				today: ["Continue feature"],
				blockers: [],
				raw_github_data: null,
				created_at: "2024-01-15T09:00:00Z",
			};

			const mockChain = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: existingStandup,
					error: null,
				}),
			};

			mockSupabaseClient.from.mockReturnValue(mockChain);

			const result = await service.generateStandup("org-123", {
				member_id: "member-123",
				date: "2024-01-15",
			});

			expect(result.standup).toEqual(existingStandup);
			expect(result.generated).toBe(false);
		});

		it("should throw error if member not found", async () => {
			// Mock no existing standup (first call)
			const mockChain1 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Not found" },
				}),
			};

			// Mock member lookup failure (second call)
			const mockChain2 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Member not found" },
				}),
			};

			mockSupabaseClient.from
				.mockReturnValueOnce(mockChain1)
				.mockReturnValueOnce(mockChain2);

			await expect(
				service.generateStandup("org-123", {
					member_id: "nonexistent-member",
				})
			).rejects.toThrow("Member not found");
		});

		it("should throw error if GitHub integration not found", async () => {
			// Mock no existing standup (first call)
			const mockChain1 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Not found" },
				}),
			};

			// Mock successful member lookup (second call)
			const mockChain2 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						id: "member-123",
						org_id: "org-123",
						github_login: "testuser",
					},
					error: null,
				}),
			};

			// Mock GitHub integration lookup failure (third call)
			const mockChain3 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Integration not found" },
				}),
			};

			mockSupabaseClient.from
				.mockReturnValueOnce(mockChain1)
				.mockReturnValueOnce(mockChain2)
				.mockReturnValueOnce(mockChain3);

			await expect(
				service.generateStandup("org-123", {
					member_id: "member-123",
				})
			).rejects.toThrow("GitHub integration not found");
		});

		it("should throw error if member has no GitHub login", async () => {
			// Mock no existing standup (first call)
			const mockChain1 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Not found" },
				}),
			};

			// Mock member without GitHub login (second call)
			const mockChain2 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						id: "member-123",
						org_id: "org-123",
						github_login: null,
					},
					error: null,
				}),
			};

			// Mock successful integration lookup (third call)
			const mockChain3 = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: {
						id: "integration-123",
						org_id: "org-123",
						type: "github",
						access_token: "token",
					},
					error: null,
				}),
			};

			mockSupabaseClient.from
				.mockReturnValueOnce(mockChain1)
				.mockReturnValueOnce(mockChain2)
				.mockReturnValueOnce(mockChain3);

			await expect(
				service.generateStandup("org-123", {
					member_id: "member-123",
				})
			).rejects.toThrow("Member does not have a GitHub login configured");
		});
	});
});
