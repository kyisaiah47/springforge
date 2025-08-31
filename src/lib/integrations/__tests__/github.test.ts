import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubClient, GitHubAPIError, createGitHubClient } from "../github";
import type { Database } from "@/lib/types/database";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GitHubClient", () => {
	let client: GitHubClient;
	const mockToken = "test-token";

	beforeEach(() => {
		client = new GitHubClient({ accessToken: mockToken });
		mockFetch.mockClear();
	});

	describe("constructor", () => {
		it("should initialize with access token", () => {
			expect(client).toBeInstanceOf(GitHubClient);
		});

		it("should use default base URL", () => {
			const client = new GitHubClient({ accessToken: mockToken });
			expect(client).toBeDefined();
		});

		it("should use custom base URL", () => {
			const customUrl = "https://api.github.enterprise.com";
			const client = new GitHubClient({
				accessToken: mockToken,
				baseUrl: customUrl,
			});
			expect(client).toBeDefined();
		});
	});

	describe("request method", () => {
		it("should make authenticated request with correct headers", async () => {
			const mockResponse = { id: 1, login: "testuser" };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await client.getUser();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.github.com/user",
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockToken}`,
						Accept: "application/vnd.github.v3+json",
						"User-Agent": "Orbit/1.0",
					}),
				})
			);
			expect(result).toEqual(mockResponse);
		});

		it("should throw GitHubAPIError on HTTP error", async () => {
			const errorResponse = { message: "Not found" };
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: () => Promise.resolve(errorResponse),
			});

			await expect(client.getUser()).rejects.toThrow(GitHubAPIError);

			// Reset mock for second call
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: () => Promise.resolve(errorResponse),
			});

			await expect(client.getUser()).rejects.toThrow("Not found");
		});

		it("should handle JSON parsing errors", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: () => Promise.reject(new Error("Invalid JSON")),
			});

			await expect(client.getUser()).rejects.toThrow(GitHubAPIError);
		});
	});

	describe("getUser", () => {
		it("should fetch authenticated user", async () => {
			const mockUser = {
				id: 12345,
				login: "testuser",
				avatar_url: "https://github.com/avatar.jpg",
				email: "test@example.com",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockUser),
			});

			const result = await client.getUser();
			expect(result).toEqual(mockUser);
		});
	});

	describe("getUserCommits", () => {
		it("should fetch user commits with correct parameters", async () => {
			const mockCommits = [
				{
					sha: "abc123",
					commit: {
						message: "Test commit",
						author: {
							name: "Test User",
							email: "test@example.com",
							date: "2024-01-01T00:00:00Z",
						},
					},
					author: { id: 1, login: "testuser", avatar_url: "avatar.jpg" },
					html_url: "https://github.com/owner/repo/commit/abc123",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockCommits),
			});

			const result = await client.getUserCommits(
				"owner",
				"repo",
				"testuser",
				"2024-01-01T00:00:00Z",
				"2024-01-02T00:00:00Z"
			);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/repos/owner/repo/commits"),
				expect.any(Object)
			);
			expect(result).toEqual(mockCommits);
		});
	});

	describe("getPullRequests", () => {
		it("should fetch pull requests with default parameters", async () => {
			const mockPRs = [
				{
					id: 1,
					number: 123,
					title: "Test PR",
					body: "Test description",
					state: "open" as const,
					merged: false,
					user: { id: 1, login: "testuser", avatar_url: "avatar.jpg" },
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
					merged_at: null,
					additions: 10,
					deletions: 5,
					changed_files: 2,
					html_url: "https://github.com/owner/repo/pull/123",
					head: { ref: "feature", sha: "abc123" },
					base: { ref: "main", sha: "def456" },
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockPRs),
			});

			const result = await client.getPullRequests("owner", "repo");
			expect(result).toEqual(mockPRs);
		});

		it("should filter PRs by date when since parameter is provided", async () => {
			const mockPRs = [
				{
					id: 1,
					number: 123,
					updated_at: "2024-01-02T00:00:00Z",
				},
				{
					id: 2,
					number: 124,
					updated_at: "2023-12-31T00:00:00Z",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockPRs),
			});

			const result = await client.getPullRequests(
				"owner",
				"repo",
				"all",
				"2024-01-01T00:00:00Z"
			);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(1);
		});
	});

	describe("getPullRequestDetails", () => {
		it("should fetch PR with file changes", async () => {
			const mockPR = {
				id: 1,
				number: 123,
				title: "Test PR",
				additions: 10,
				deletions: 5,
				changed_files: 2,
			};

			const mockFiles = [
				{
					filename: "src/test.ts",
					status: "modified" as const,
					additions: 5,
					deletions: 2,
					changes: 7,
				},
			];

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockPR),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockFiles),
				});

			const result = await client.getPullRequestDetails("owner", "repo", 123);

			expect(result).toEqual({ ...mockPR, files: mockFiles });
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("getIssues", () => {
		it("should fetch issues and filter out pull requests", async () => {
			const mockIssues = [
				{
					id: 1,
					number: 1,
					title: "Real issue",
					body: "Issue description",
					state: "open" as const,
					user: { id: 1, login: "testuser", avatar_url: "avatar.jpg" },
					assignees: [],
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
					closed_at: null,
					html_url: "https://github.com/owner/repo/issues/1",
					labels: [],
				},
				{
					id: 2,
					number: 2,
					title: "Pull request",
					pull_request: {
						url: "https://api.github.com/repos/owner/repo/pulls/2",
					},
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockIssues),
			});

			const result = await client.getIssues("owner", "repo");

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe("Real issue");
		});
	});
});

describe("createGitHubClient", () => {
	it("should create client from GitHub integration", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "github",
			access_token: "test-token",
			settings: {},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		const client = createGitHubClient(integration);
		expect(client).toBeInstanceOf(GitHubClient);
	});

	it("should throw error for non-GitHub integration", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "slack",
			access_token: "test-token",
			settings: {},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		expect(() => createGitHubClient(integration)).toThrow(
			"Integration is not a GitHub integration"
		);
	});

	it("should throw error for missing access token", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "github",
			access_token: null,
			settings: {},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		expect(() => createGitHubClient(integration)).toThrow(
			"GitHub integration missing access token"
		);
	});
});

describe("GitHubAPIError", () => {
	it("should create error with message and status", () => {
		const error = new GitHubAPIError("Test error", 404, {
			message: "Not found",
		});

		expect(error.message).toBe("Test error");
		expect(error.status).toBe(404);
		expect(error.response).toEqual({ message: "Not found" });
		expect(error.name).toBe("GitHubAPIError");
	});
});
