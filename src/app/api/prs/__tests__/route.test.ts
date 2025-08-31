import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
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
	getPRInsights: vi.fn(),
	createPRInsight: vi.fn(),
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

const mockPRInsight = {
	id: "pr-insight-id",
	org_id: "test-org-id",
	repo: "testorg/test-repo",
	number: 123,
	author_member_id: "member-id",
	additions: 150,
	deletions: 25,
	files_changed: 5,
	tests_changed: 50,
	touched_paths: ["src/components/feature.tsx"],
	size_score: 3.5,
	risk_score: 6.2,
	suggested_reviewers: ["reviewer1", "reviewer2"],
	status: "open",
	opened_at: "2024-01-01T10:00:00Z",
	updated_at: "2024-01-01T10:00:00Z",
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

describe("PR API Routes", () => {
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

	describe("GET /api/prs", () => {
		it("should get PR insights with default parameters", async () => {
			const mockResponse = {
				pr_insights: [mockPRInsight],
				next_cursor: undefined,
				has_more: false,
			};

			mockPRRadarService.getPRInsights.mockResolvedValue(mockResponse);

			const request = new NextRequest("http://localhost:3000/api/prs");
			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual(mockResponse);
			expect(mockPRRadarService.getPRInsights).toHaveBeenCalledWith(
				"test-org-id",
				{
					limit: 20,
					order_by: "updated_at",
					order_dir: "desc",
				}
			);
		});

		it("should get PR insights with query parameters", async () => {
			const mockResponse = {
				pr_insights: [mockPRInsight],
				next_cursor: "next-cursor",
				has_more: true,
			};

			mockPRRadarService.getPRInsights.mockResolvedValue(mockResponse);

			const request = new NextRequest(
				"http://localhost:3000/api/prs?status=open&repo=testorg/test-repo&risk_min=5&limit=10&order_by=risk_score&order_dir=desc"
			);
			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual(mockResponse);
			expect(mockPRRadarService.getPRInsights).toHaveBeenCalledWith(
				"test-org-id",
				{
					status: "open",
					repo: "testorg/test-repo",
					risk_min: 5,
					limit: 10,
					order_by: "risk_score",
					order_dir: "desc",
				}
			);
		});

		it("should validate author_member_id belongs to same organization", async () => {
			// Mock target member in different org
			mockSupabase.from.mockImplementation((table: string) => {
				if (table === "members") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockImplementation((field: string, value: string) => {
								if (field === "email") {
									return {
										single: vi.fn().mockResolvedValue({
											data: mockMember,
											error: null,
										}),
									};
								} else if (
									field === "id" &&
									value === "550e8400-e29b-41d4-a716-446655440000"
								) {
									return {
										single: vi.fn().mockResolvedValue({
											data: { org_id: "different-org-id" },
											error: null,
										}),
									};
								}
								return { single: vi.fn() };
							}),
						}),
					};
				}
				return { select: vi.fn(), eq: vi.fn() };
			});

			const request = new NextRequest(
				"http://localhost:3000/api/prs?author_member_id=550e8400-e29b-41d4-a716-446655440000"
			);
			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(403);
			expect(responseData.error.code).toBe("FORBIDDEN");
		});

		it("should handle authentication failure", async () => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: new Error("Not authenticated"),
			});

			const request = new NextRequest("http://localhost:3000/api/prs");
			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(401);
			expect(responseData.error.code).toBe("UNAUTHORIZED");
		});

		it("should handle invalid query parameters", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/prs?limit=invalid&risk_min=15"
			);
			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error.code).toBe("VALIDATION_ERROR");
		});
	});

	describe("POST /api/prs", () => {
		it("should create new PR insight", async () => {
			const mockResponse = {
				pr_insight: mockPRInsight,
				created: true,
			};

			mockPRRadarService.createPRInsight.mockResolvedValue(mockResponse);

			const requestBody = {
				repo: "testorg/test-repo",
				number: 123,
				github_data: sampleGitHubPRData,
			};

			const request = new NextRequest("http://localhost:3000/api/prs", {
				method: "POST",
				body: JSON.stringify(requestBody),
				headers: {
					"content-type": "application/json",
				},
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(201);
			expect(responseData).toEqual(mockResponse);
			expect(mockPRRadarService.createPRInsight).toHaveBeenCalledWith(
				"test-org-id",
				requestBody
			);
		});

		it("should update existing PR insight", async () => {
			const mockResponse = {
				pr_insight: mockPRInsight,
				created: false,
			};

			mockPRRadarService.createPRInsight.mockResolvedValue(mockResponse);

			const requestBody = {
				repo: "testorg/test-repo",
				number: 123,
				github_data: sampleGitHubPRData,
			};

			const request = new NextRequest("http://localhost:3000/api/prs", {
				method: "POST",
				body: JSON.stringify(requestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual(mockResponse);
		});

		it("should handle invalid request body", async () => {
			const invalidBody = {
				repo: "", // Invalid empty repo
				number: -1, // Invalid negative number
			};

			const request = new NextRequest("http://localhost:3000/api/prs", {
				method: "POST",
				body: JSON.stringify(invalidBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error.code).toBe("VALIDATION_ERROR");
		});

		it("should handle service errors", async () => {
			mockPRRadarService.createPRInsight.mockRejectedValue(
				new Error("Database error")
			);

			const requestBody = {
				repo: "testorg/test-repo",
				number: 123,
				github_data: sampleGitHubPRData,
			};

			const request = new NextRequest("http://localhost:3000/api/prs", {
				method: "POST",
				body: JSON.stringify(requestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData.error.code).toBe("INTERNAL_ERROR");
		});
	});
});
