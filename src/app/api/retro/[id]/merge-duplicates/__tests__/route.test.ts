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
		mergeDuplicateNotes: vi.fn(),
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
	updateRetroNote: vi.fn(),
	deleteRetroNote: vi.fn(),
	voteOnNote: vi.fn(),
};

describe("/api/retro/[id]/merge-duplicates", () => {
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
		return new NextRequest(
			"http://localhost/api/retro/test-id/merge-duplicates",
			{
				method: "POST",
				body: JSON.stringify(body),
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	};

	const mockAuthenticatedUser = (role: string = "member") => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: { email: "test@example.com" } },
			error: null,
		});

		mockSupabase.from.mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: { org_id: "org-1", id: "user-1", role },
						error: null,
					}),
				}),
			}),
		});
	};

	const mockRetroData = (createdBy: string = "user-1") => {
		mockRetroService.getRetro.mockResolvedValue({
			id: "retro-1",
			org_id: "org-1",
			title: "Test Retro",
			status: "completed",
			created_by: createdBy,
			created_at: "2024-01-15T10:00:00Z",
		});

		mockRetroService.getRetroNotes.mockResolvedValue([
			{
				id: "note-1",
				text: "Great collaboration",
				column_key: "went_well",
				votes: 3,
				created_at: "2024-01-15T10:05:00Z",
			},
			{
				id: "note-2",
				text: "Excellent collaboration",
				column_key: "went_well",
				votes: 2,
				created_at: "2024-01-15T10:06:00Z",
			},
		]);
	};

	describe("Authentication", () => {
		it("should return 401 for unauthenticated requests", async () => {
			mockSupabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: new Error("Not authenticated"),
			});

			const request = createRequest({ dryRun: true });
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

			const request = createRequest({ dryRun: true });
			const response = await POST(request, {
				params: Promise.resolve({ id: "test-id" }),
			});

			expect(response.status).toBe(403);
		});
	});

	describe("Authorization", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
		});

		it("should return 404 for non-existent retro", async () => {
			mockRetroService.getRetro.mockResolvedValue(null);

			const request = createRequest({ dryRun: true });
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
				created_by: "user-1",
			});

			const request = createRequest({ dryRun: true });
			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.message).toContain("different organization");
		});

		it("should return 403 for non-creator non-admin users", async () => {
			mockAuthenticatedUser("member");
			mockRetroData("different-user");

			const request = createRequest({ dryRun: true });
			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.message).toContain("Only retro creator or admin");
		});

		it("should allow retro creator", async () => {
			mockAuthenticatedUser("member");
			mockRetroData("user-1"); // Same as authenticated user

			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [],
				duplicateGroups: [],
			});

			const request = createRequest({ dryRun: true });
			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
		});

		it("should allow admin users", async () => {
			mockAuthenticatedUser("admin");
			mockRetroData("different-user");

			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [],
				duplicateGroups: [],
			});

			const request = createRequest({ dryRun: true });
			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
		});
	});

	describe("Dry Run Mode", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
			mockRetroData();
		});

		it("should return preview without making changes", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [
					{
						id: "note-1",
						text: "Great collaboration / Excellent collaboration",
						votes: 5,
					},
				],
				duplicateGroups: [
					[
						{
							id: "note-1",
							text: "Great collaboration",
							votes: 3,
							column_key: "went_well",
						},
						{
							id: "note-2",
							text: "Excellent collaboration",
							votes: 2,
							column_key: "went_well",
						},
					],
				],
			});

			const request = createRequest({
				dryRun: true,
				similarityThreshold: 0.8,
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.dryRun).toBe(true);
			expect(body.originalCount).toBe(2);
			expect(body.mergedCount).toBe(1);
			expect(body.duplicateGroups).toHaveLength(1);
			expect(body.duplicateGroups[0].count).toBe(2);
			expect(body.preview).toHaveLength(1);

			// Should not call any update methods
			expect(mockRetroService.updateRetroNote).not.toHaveBeenCalled();
			expect(mockRetroService.deleteRetroNote).not.toHaveBeenCalled();
			expect(mockRetroService.voteOnNote).not.toHaveBeenCalled();
		});

		it("should pass similarity threshold to service", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [],
				duplicateGroups: [],
			});

			const request = createRequest({
				dryRun: true,
				similarityThreshold: 0.6,
			});

			await POST(request, { params: Promise.resolve({ id: "retro-1" }) });

			expect(RetroExportService.mergeDuplicateNotes).toHaveBeenCalledWith(
				expect.any(Array),
				0.6
			);
		});

		it("should use default similarity threshold", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [],
				duplicateGroups: [],
			});

			const request = createRequest({ dryRun: true });

			await POST(request, { params: Promise.resolve({ id: "retro-1" }) });

			expect(RetroExportService.mergeDuplicateNotes).toHaveBeenCalledWith(
				expect.any(Array),
				0.8
			);
		});
	});

	describe("Actual Merge", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
			mockRetroData();
		});

		it("should perform actual merge operations", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [
					{
						id: "note-1",
						text: "Great collaboration / Excellent collaboration",
						votes: 5,
					},
				],
				duplicateGroups: [
					[
						{
							id: "note-1",
							text: "Great collaboration",
							votes: 3,
							column_key: "went_well",
						},
						{
							id: "note-2",
							text: "Excellent collaboration",
							votes: 2,
							column_key: "went_well",
						},
					],
				],
			});

			mockRetroService.updateRetroNote.mockResolvedValue({});
			mockRetroService.voteOnNote.mockResolvedValue({});
			mockRetroService.deleteRetroNote.mockResolvedValue(undefined);

			const request = createRequest({
				dryRun: false,
				similarityThreshold: 0.8,
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.dryRun).toBe(false);
			expect(body.originalCount).toBe(2);
			expect(body.mergedCount).toBe(1);
			expect(body.mergeOperations).toBe(1);
			expect(body.results).toHaveLength(1);

			// Should call update methods
			expect(mockRetroService.updateRetroNote).toHaveBeenCalledWith("note-1", {
				text: "Great collaboration / Excellent collaboration",
			});
			expect(mockRetroService.voteOnNote).toHaveBeenCalledWith("note-1", true);
			expect(mockRetroService.deleteRetroNote).toHaveBeenCalledWith("note-2");
		});

		it("should handle vote adjustments correctly", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [],
				duplicateGroups: [
					[
						{
							id: "note-1",
							text: "Same text",
							votes: 2,
							column_key: "went_well",
						},
						{
							id: "note-2",
							text: "Same text",
							votes: 3,
							column_key: "went_well",
						},
					],
				],
			});

			mockRetroService.updateRetroNote.mockResolvedValue({});
			mockRetroService.voteOnNote.mockResolvedValue({});
			mockRetroService.deleteRetroNote.mockResolvedValue(undefined);

			const request = createRequest({ dryRun: false });

			await POST(request, { params: Promise.resolve({ id: "retro-1" }) });

			// Should vote 3 times to go from 2 to 5 votes (2 + 3)
			expect(mockRetroService.voteOnNote).toHaveBeenCalledTimes(3);
			expect(mockRetroService.voteOnNote).toHaveBeenCalledWith("note-2", true);
		});

		it("should skip single-note groups", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [{ id: "note-1", text: "Unique note", votes: 1 }],
				duplicateGroups: [
					[{ id: "note-1", text: "Unique note", votes: 1 }], // Single note group
				],
			});

			const request = createRequest({ dryRun: false });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.mergeOperations).toBe(0);

			// Should not call any update methods for single-note groups
			expect(mockRetroService.updateRetroNote).not.toHaveBeenCalled();
			expect(mockRetroService.deleteRetroNote).not.toHaveBeenCalled();
		});

		it("should handle merge operation errors", async () => {
			const {
				RetroExportService,
			} = require("@/lib/modules/retro/export-service");
			RetroExportService.mergeDuplicateNotes.mockReturnValue({
				mergedNotes: [],
				duplicateGroups: [
					[
						{ id: "note-1", text: "Text 1", votes: 1 },
						{ id: "note-2", text: "Text 2", votes: 1 },
					],
				],
			});

			mockRetroService.updateRetroNote.mockRejectedValue(
				new Error("Update failed")
			);

			const request = createRequest({ dryRun: false });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.error.code).toBe("INTERNAL_ERROR");
		});
	});

	describe("Validation", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
			mockRetroData();
		});

		it("should validate similarity threshold range", async () => {
			const request = createRequest({
				similarityThreshold: 1.5, // Invalid: > 1
				dryRun: true,
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should validate similarity threshold minimum", async () => {
			const request = createRequest({
				similarityThreshold: -0.1, // Invalid: < 0
				dryRun: true,
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should validate dryRun as boolean", async () => {
			const request = createRequest({
				dryRun: "invalid", // Should be boolean
			});

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should handle invalid JSON", async () => {
			const request = new NextRequest(
				"http://localhost/api/retro/test-id/merge-duplicates",
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
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			mockAuthenticatedUser();
		});

		it("should handle retro service errors", async () => {
			mockRetroService.getRetro.mockRejectedValue(new Error("Database error"));

			const request = createRequest({ dryRun: true });

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
			RetroExportService.mergeDuplicateNotes.mockImplementation(() => {
				throw new Error("Merge analysis failed");
			});

			const request = createRequest({ dryRun: true });

			const response = await POST(request, {
				params: Promise.resolve({ id: "retro-1" }),
			});

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.error.code).toBe("INTERNAL_ERROR");
		});
	});
});
