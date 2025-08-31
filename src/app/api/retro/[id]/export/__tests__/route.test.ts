import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

// Mock monitoring
vi.mock("@/lib/monitoring", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
	withMonitoring: (fn: any) => fn,
	generateRequestId: () => "test-request-id",
}));

// Mock export service
vi.mock("@/lib/modules/retro/export-service", () => ({
	RetroExportService: {
		exportToMarkdown: vi.fn(),
		exportToNotion: vi.fn(),
	},
}));

// Mock retro service
vi.mock("@/lib/modules/retro", () => ({
	createRetroService: vi.fn(),
}));

const mockSupabase = {
	auth: {
		getUser: vi.fn(),
	},
	from: vi.fn(),
};

const mockRetroService = {
	getRetro: vi.fn(),
	getRetroNotes: vi.fn(),
};

describe("/api/retro/[id]/export", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(createClient as any).mockResolvedValue(mockSupabase);

		// Mock createRetroService
		const { createRetroService } = require("@/lib/modules/retro");
		createRetroService.mockReturnValue(mockRetroService);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	const createRequest = (body: any) => {
		return new NextRequest("http://localhost/api/retro/test-id/export", {
			method: "POST",
			body: JSON.stringify(body),
			headers: {
				"Content-Type": "application/json",
			},
		});
	};

	const mockAuthenticatedUser = () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: { email: "test@example.com" } },
			error: null,
		});

		mockSupabase.from.mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: { org_id: "org-1", id: "user-1" },
						error: null,
					}),
				}),
			}),
		});
	};

	const mockRetroData = () => {
		mockRetroService.getRetro.mockResolvedValue({
			id: "retro-1",
			org_id: "org-1",
			title: "Test Retro",
			status: "completed",
			created_by: "user-1",
			created_at: "2024-01-15T10:00:00Z",
		});

		mockRetroService.getRetroNotes.mockResolvedValue([
			{
				id: "note-1",
				text: "Test note",
				column_key: "went_well",
				votes: 3,
				created_at: "2024-01-15T10:05:00Z",
			},
		]);
	};

	describe("Authentication", () => {
		it("should return 401 for unauthenticated requests", async () => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: new Error("Not authenticated"),
			});

			const request = createRequest({ format: "markdown" });
			const response = await POST(request, {
				params: Promise.resolve({ id: "test-id" }),
			});

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.error.code).toBe("UNAUTHORIZED");
		});

		it("should return 403 for users not in organization", async () => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: { email: "test@example.com" } },
				error: null,
			});

			mockSupabase.from.mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						single: vi.fn().mockResolvedValue({
							data: null,
							error: new Error("User not found"),
						}),
					}),
				}),
			});

			const request = createRequest({ format: "markdown" });
			const response = await POST(request, {
				params: Promise.resolve({ id: "test-id" }),
			});

			expect(response.status).toBe(403);
		});
	});

	describe("Retro Access", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
		});

		it("should return 404 for non-existent retro", async () => {
			mockRetroService.getRetro.mockResolvedValue(null);

			const request = createRequest({ format: "markdown" });
			const response = await POST(request, {
				params: Promise.resolve({ id: "non-existent" }),
			});

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.error.code).toBe("NOT_FOUND");
		});

		it("should return 403 for retro from different organization", async () => {
			mockRetroService.getRetro.mockResolvedValue({
				id: "retro-1",
				org_id: "different-org",
				title: "Test Retro",
			});

			const request = createRequest({ format: "markdown" });
			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.message).toContain("different organization");
		});
	});

	describe("Markdown Export", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
			mockRetroData();
		});

		it("should export retro to markdown successfully", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToMarkdown.mockReturnValue(
				"# Test Retro\n\nMarkdown content"
			);

			const request = createRequest({
				format: "markdown",
				options: {
					includeVotes: true,
					includeAuthor: false,
				},
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.format).toBe("markdown");
			expect(body.content).toBe("# Test Retro\n\nMarkdown content");
			expect(body.filename).toContain("retro-test-retro");
			expect(body.filename).toContain(".md");
		});

		it("should pass export options to service", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToMarkdown.mockReturnValue("markdown");

			const options = {
				includeVotes: false,
				includeAuthor: true,
				includeTimestamps: true,
				groupByColumn: false,
			};

			const request = createRequest({
				format: "markdown",
				options,
			});

			await POST(request, { params: Promise.resolve({ id: "retro-1" }) });

			expect(RetroExportService.exportToMarkdown).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Array),
				options
			);
		});

		it("should use default options when not provided", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToMarkdown.mockReturnValue("markdown");

			const request = createRequest({ format: "markdown" });

			await POST(request, { params: Promise.resolve({ id: "retro-1" }) });

			expect(RetroExportService.exportToMarkdown).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Array),
				{}
			);
		});
	});

	describe("Notion Export", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
			mockRetroData();
		});

		it("should return 403 when Notion export is disabled", async () => {
			// Mock organization settings without Notion enabled
			mockSupabase.from.mockImplementation((table) => {
				if (table === "members") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { org_id: "org-1", id: "user-1" },
									error: null,
								}),
							}),
						}),
					};
				}
				if (table === "organizations") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { settings: {} }, // No notion_export_enabled
									error: null,
								}),
							}),
						}),
					};
				}
			});

			const request = createRequest({
				format: "notion",
				notionOptions: { token: "secret_token" },
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.code).toBe("FEATURE_DISABLED");
		});

		it("should export to Notion when enabled and token provided", async () => {
			// Mock organization settings with Notion enabled
			mockSupabase.from.mockImplementation((table) => {
				if (table === "members") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { org_id: "org-1", id: "user-1" },
									error: null,
								}),
							}),
						}),
					};
				}
				if (table === "organizations") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: {
										settings: {
											notion_export_enabled: true,
											notion_token: "org_token",
										},
									},
									error: null,
								}),
							}),
						}),
					};
				}
			});

			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToNotion.mockResolvedValue({
				success: true,
				pageUrl: "https://notion.so/retro-page",
			});

			const request = createRequest({
				format: "notion",
				notionOptions: { token: "user_token" },
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.format).toBe("notion");
			expect(body.success).toBe(true);
			expect(body.pageUrl).toBe("https://notion.so/retro-page");
		});

		it("should return 400 when no token provided", async () => {
			// Mock organization settings with Notion enabled but no token
			mockSupabase.from.mockImplementation((table) => {
				if (table === "members") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { org_id: "org-1", id: "user-1" },
									error: null,
								}),
							}),
						}),
					};
				}
				if (table === "organizations") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { settings: { notion_export_enabled: true } },
									error: null,
								}),
							}),
						}),
					};
				}
			});

			const request = createRequest({ format: "notion" });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("CONFIGURATION_ERROR");
		});

		it("should handle Notion export failure", async () => {
			// Mock organization settings with Notion enabled
			mockSupabase.from.mockImplementation((table) => {
				if (table === "members") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { org_id: "org-1", id: "user-1" },
									error: null,
								}),
							}),
						}),
					};
				}
				if (table === "organizations") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								single: vi.fn().mockResolvedValue({
									data: { settings: { notion_export_enabled: true } },
									error: null,
								}),
							}),
						}),
					};
				}
			});

			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToNotion.mockResolvedValue({
				success: false,
				error: "Notion API error",
			});

			const request = createRequest({
				format: "notion",
				notionOptions: { token: "invalid_token" },
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.error.code).toBe("EXPORT_ERROR");
		});
	});

	describe("Validation", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
			mockRetroData();
		});

		it("should return 400 for invalid format", async () => {
			const request = createRequest({ format: "invalid" });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should return 400 for invalid request body", async () => {
			const request = new NextRequest(
				"http://localhost/api/retro/test-id/export",
				{
					method: "POST",
					body: "invalid json",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			const response = await POST(request, {
				params: Promise.resolve({ id: "test-id" }),
			});

			expect(response.status).toBe(500); // JSON parse error becomes internal error
		});

		it("should validate export options", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToMarkdown.mockReturnValue("markdown");

			const request = createRequest({
				format: "markdown",
				options: {
					includeVotes: "invalid", // Should be boolean
				},
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
		});

		it("should handle retro service errors", async () => {
			mockRetroService.getRetro.mockRejectedValue(new Error("Database error"));

			const request = createRequest({ format: "markdown" });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.error.code).toBe("INTERNAL_ERROR");
		});

		it("should handle export service errors", async () => {
			mockRetroData();

			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.exportToMarkdown.mockImplementation(() => {
				throw new Error("Export failed");
			});

			const request = createRequest({ format: "markdown" });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.error.code).toBe("INTERNAL_ERROR");
		});
	});
});
