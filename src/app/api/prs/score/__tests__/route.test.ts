import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/modules/pr-radar/service");

const mockSupabase = {
	from: vi.fn(),
	auth: {
		getUser: vi.fn(),
	},
};

const mockPRRadarService = {
	scorePR: vi.fn(),
};

const mockUser = {
	id: "user-id",
	email: "test@example.com",
};

const mockMember = {
	id: "member-id",
	org_id: "test-org-id",
	email: "test@example.com",
};

const sampleGitHubPRData = {
	number: 123,
	title: "Add new feature",
	body: "This PR adds a new feature",
	state: "open" as const,
	merged: false,
	additions: 150,
	deletions: 25,
	changed_files: 5,
	commits: 3,
	author: {
		login: "testuser",
		id: 12345,
	},
	base: {
		ref: "main",
		repo: {
			name: "test-repo",
			full_name: "testorg/test-repo",
		},
	},
	head: {
		ref: "feature-branch",
	},
	created_at: "2024-01-01T10:00:00Z",
	updated_at: "2024-01-01T10:00:00Z",
	merged_at: null,
	files: [
		{
			filename: "src/components/feature.tsx",
			status: "added" as const,
			additions: 100,
			deletions: 0,
			changes: 100,
		},
	],
};

const mockScoreResult = {
	score_result: {
		size_score: 3.5,
		risk_score: 6.2,
		risk_factors: {
			size_factor: 3.0,
			complexity_factor: 4.5,
			test_coverage_factor: 8.0,
			file_type_factor: 2.0,
			author_experience_factor: 2.0,
		},
		size_metrics: {
			additions: 150,
			deletions: 25,
			files_changed: 5,
			tests_changed: 50,
			total_changes: 175,
		},
	},
	pr_insight: {
		id: "pr-insight-id",
		repo: "testorg/test-repo",
		number: 123,
	},
};

describe("PR Score API Route", () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock createClient
		vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

		// Mock PR Radar service
		const prRadarModule = await import("@/lib/modules/pr-radar/service");
		vi.mocked(prRadarModule.createPRRadarService).mockReturnValue(
			mockPRRadarService as never
		);

		// Mock successful authentication
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: mockUser },
			error: null,
		});

		// Mock member lookup
		mockSupabase.from.mockImplementation((table: string) => {
			if (table === "members") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							single: vi.fn().mockResolvedValue({
								data: mockMember,
								error: null,
							}),
						}),
					}),
				};
			}
			return { select: vi.fn(), eq: vi.fn() };
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should score PR with provided GitHub data", async () => {
		mockPRRadarService.scorePR.mockResolvedValue(mockScoreResult);

		const requestBody = {
			repo: "testorg/test-repo",
			number: 123,
			github_data: sampleGitHubPRData,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(requestBody),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData).toEqual(mockScoreResult);
		expect(mockPRRadarService.scorePR).toHaveBeenCalledWith(
			"test-org-id",
			requestBody
		);
	});

	it("should score PR without GitHub data (fetch from API)", async () => {
		mockPRRadarService.scorePR.mockResolvedValue(mockScoreResult);

		const requestBody = {
			repo: "testorg/test-repo",
			number: 123,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(requestBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData).toEqual(mockScoreResult);
		expect(mockPRRadarService.scorePR).toHaveBeenCalledWith(
			"test-org-id",
			requestBody
		);
	});

	it("should handle authentication failure", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: null },
			error: new Error("Not authenticated"),
		});

		const requestBody = {
			repo: "testorg/test-repo",
			number: 123,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(requestBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(401);
		expect(responseData.error.code).toBe("UNAUTHORIZED");
	});

	it("should handle invalid request body", async () => {
		const invalidBody = {
			repo: "", // Invalid empty repo
			number: -1, // Invalid negative number
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(invalidBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error.code).toBe("VALIDATION_ERROR");
	});

	it("should handle missing required fields", async () => {
		const invalidBody = {
			// Missing repo and number
			github_data: sampleGitHubPRData,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(invalidBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error.code).toBe("VALIDATION_ERROR");
	});

	it("should handle service errors", async () => {
		mockPRRadarService.scorePR.mockRejectedValue(
			new Error("GitHub integration not found")
		);

		const requestBody = {
			repo: "testorg/test-repo",
			number: 123,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(requestBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(500);
		expect(responseData.error.code).toBe("INTERNAL_ERROR");
	});

	it("should handle member not found", async () => {
		mockSupabase.from.mockImplementation((table: string) => {
			if (table === "members") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							single: vi.fn().mockResolvedValue({
								data: null,
								error: new Error("Member not found"),
							}),
						}),
					}),
				};
			}
			return { select: vi.fn(), eq: vi.fn() };
		});

		const requestBody = {
			repo: "testorg/test-repo",
			number: 123,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(requestBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(403);
		expect(responseData.error.code).toBe("FORBIDDEN");
	});

	it("should validate GitHub data structure when provided", async () => {
		const invalidGitHubData = {
			number: 123,
			title: "Test PR",
			// Missing required fields
		};

		const requestBody = {
			repo: "testorg/test-repo",
			number: 123,
			github_data: invalidGitHubData,
		};

		const request = new NextRequest("http://localhost:3000/api/prs/score", {
			method: "POST",
			body: JSON.stringify(requestBody),
		});

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error.code).toBe("VALIDATION_ERROR");
	});
});
