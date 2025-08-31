import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { createClient } from "@/lib/supabase/server";
import { WebhookVerificationFactory } from "@/lib/shared/webhook-verification";

// Mock dependencies
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/shared/webhook-verification");
vi.mock("@/lib/modules/pr-radar/service");

const mockSupabase = {
	from: vi.fn(),
	auth: {
		getUser: vi.fn(),
	},
};

const mockVerifier = {
	verifyRequest: vi.fn(),
};

const mockPRRadarService = {
	createPRInsight: vi.fn(),
};

// Sample GitHub webhook payload
const samplePRWebhookPayload = {
	action: "opened",
	number: 123,
	pull_request: {
		id: 456789,
		number: 123,
		title: "Add new feature",
		body: "This PR adds a new feature",
		state: "open",
		merged: false,
		additions: 150,
		deletions: 25,
		changed_files: 5,
		commits: 3,
		user: {
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
	},
	repository: {
		name: "test-repo",
		full_name: "testorg/test-repo",
		owner: {
			login: "testorg",
		},
	},
};

const samplePRFiles = [
	{
		filename: "src/components/feature.tsx",
		status: "added" as const,
		additions: 100,
		deletions: 0,
		changes: 100,
		patch: "@@ -0,0 +1,100 @@\n+// New feature component",
	},
	{
		filename: "src/components/__tests__/feature.test.tsx",
		status: "added" as const,
		additions: 50,
		deletions: 0,
		changes: 50,
		patch: "@@ -0,0 +1,50 @@\n+// Test file",
	},
];

describe("GitHub Webhook Handler", () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock createClient
		vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

		// Mock webhook verifier
		vi.mocked(WebhookVerificationFactory.createGitHubVerifier).mockReturnValue(
			mockVerifier as never
		);

		// Mock PR Radar service
		const prRadarModule = await import("@/lib/modules/pr-radar/service");
		vi.mocked(prRadarModule.createPRRadarService).mockReturnValue(
			mockPRRadarService as never
		);

		// Mock successful verification by default
		mockVerifier.verifyRequest.mockImplementation(() => {});

		// Mock successful organization lookup
		mockSupabase.from.mockImplementation((table: string) => {
			if (table === "integrations") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockImplementation((field: string, value: string) => {
							if (field === "type" && value === "github") {
								// First call - get all GitHub integrations
								return Promise.resolve({
									data: [
										{
											org_id: "test-org-id",
											settings: {},
										},
									],
									error: null,
								});
							} else if (field === "org_id" && value === "test-org-id") {
								// Second call - get specific integration
								return {
									eq: vi.fn().mockReturnValue({
										single: vi.fn().mockResolvedValue({
											data: {
												org_id: "test-org-id",
												access_token: "test-token",
											},
											error: null,
										}),
									}),
								};
							}
							return Promise.resolve({ data: [], error: null });
						}),
					}),
				};
			}
			return {
				select: vi.fn(),
				eq: vi.fn(),
				single: vi.fn(),
			};
		});

		// Mock successful PR insight creation
		mockPRRadarService.createPRInsight.mockResolvedValue({
			pr_insight: {
				id: "test-pr-insight-id",
				repo: "testorg/test-repo",
				number: 123,
			},
			created: true,
		});

		// Mock GitHub API call for files
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(samplePRFiles),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should process valid PR opened webhook", async () => {
		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(samplePRWebhookPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
					"content-type": "application/json",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.message).toBe("Webhook processed successfully");
		expect(responseData.pr_insight_id).toBe("test-pr-insight-id");
		expect(responseData.created).toBe(true);

		// Verify webhook signature was checked
		expect(mockVerifier.verifyRequest).toHaveBeenCalled();

		// Verify PR insight was created with correct data
		expect(mockPRRadarService.createPRInsight).toHaveBeenCalledWith(
			"test-org-id",
			expect.objectContaining({
				repo: "testorg/test-repo",
				number: 123,
				github_data: expect.objectContaining({
					number: 123,
					title: "Add new feature",
					state: "open",
					merged: false,
					additions: 150,
					deletions: 25,
					files: samplePRFiles,
				}),
			})
		);
	});

	it("should handle PR synchronize webhook", async () => {
		const synchronizePayload = {
			...samplePRWebhookPayload,
			action: "synchronize",
		};

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(synchronizePayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		expect(response.status).toBe(200);
		expect(mockPRRadarService.createPRInsight).toHaveBeenCalled();
	});

	it("should handle PR closed webhook", async () => {
		const closedPayload = {
			...samplePRWebhookPayload,
			action: "closed",
			pull_request: {
				...samplePRWebhookPayload.pull_request,
				state: "closed" as const,
				merged: true,
				merged_at: "2024-01-01T11:00:00Z",
			},
		};

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(closedPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		expect(response.status).toBe(200);
		expect(mockPRRadarService.createPRInsight).toHaveBeenCalledWith(
			"test-org-id",
			expect.objectContaining({
				github_data: expect.objectContaining({
					state: "closed",
					merged: true,
					merged_at: "2024-01-01T11:00:00Z",
				}),
			})
		);
	});

	it("should ignore non-PR events", async () => {
		const pushPayload = {
			action: "push", // Add action field to satisfy schema
			ref: "refs/heads/main",
			commits: [],
			repository: samplePRWebhookPayload.repository,
		};

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(pushPayload),
				headers: {
					"x-github-event": "push",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.message).toBe("Event type not handled");
		expect(mockPRRadarService.createPRInsight).not.toHaveBeenCalled();
	});

	it("should ignore unhandled PR actions", async () => {
		const labeledPayload = {
			...samplePRWebhookPayload,
			action: "labeled",
		};

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(labeledPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.message).toBe("Action not handled");
		expect(mockPRRadarService.createPRInsight).not.toHaveBeenCalled();
	});

	it("should handle webhook signature verification failure", async () => {
		mockVerifier.verifyRequest.mockImplementation(() => {
			throw new Error("Invalid GitHub webhook signature");
		});

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(samplePRWebhookPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=invalid-signature",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error.code).toBe("WEBHOOK_ERROR");
		expect(mockPRRadarService.createPRInsight).not.toHaveBeenCalled();
	});

	it("should handle organization not found", async () => {
		// Mock no integrations found
		mockSupabase.from.mockImplementation((table: string) => {
			if (table === "integrations") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							data: [],
							error: null,
						}),
					}),
				};
			}
			return { select: vi.fn(), eq: vi.fn() };
		});

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(samplePRWebhookPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.message).toBe("Organization not found");
		expect(mockPRRadarService.createPRInsight).not.toHaveBeenCalled();
	});

	it("should handle GitHub API failure gracefully", async () => {
		// Mock GitHub API failure
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 403,
			statusText: "Forbidden",
		});

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(samplePRWebhookPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		expect(response.status).toBe(200);

		// Should still process webhook but with empty files array
		expect(mockPRRadarService.createPRInsight).toHaveBeenCalledWith(
			"test-org-id",
			expect.objectContaining({
				github_data: expect.objectContaining({
					files: [],
				}),
			})
		);
	});

	it("should handle invalid webhook payload", async () => {
		const invalidPayload = {
			action: "opened",
			// Missing required fields
		};

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(invalidPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error.code).toBe("VALIDATION_ERROR");
		expect(mockPRRadarService.createPRInsight).not.toHaveBeenCalled();
	});

	it("should handle PR insight creation failure", async () => {
		mockPRRadarService.createPRInsight.mockRejectedValue(
			new Error("Database connection failed")
		);

		const request = new NextRequest(
			"http://localhost:3000/api/webhooks/github",
			{
				method: "POST",
				body: JSON.stringify(samplePRWebhookPayload),
				headers: {
					"x-github-event": "pull_request",
					"x-hub-signature-256": "sha256=test-signature",
				},
			}
		);

		const response = await POST(request);
		const responseData = await response.json();

		expect(response.status).toBe(500);
		expect(responseData.error.code).toBe("INTERNAL_ERROR");
	});
});
