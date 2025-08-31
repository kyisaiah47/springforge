import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRetroService } from "../service";
import { RetroStatus, RetroColumn } from "../types";

describe("RetroService", () => {
	let retroService: any;
	let mockSupabase: unknown;

	beforeEach(() => {
		vi.clearAllMocks();

		// Create a mock Supabase client
		mockSupabase = {
			from: vi.fn(() => ({
				insert: vi.fn(() => ({
					select: vi.fn(() => ({
						single: vi.fn(),
					})),
				})),
				select: vi.fn(() => ({
					eq: vi.fn(() => ({
						single: vi.fn(),
					})),
				})),
				update: vi.fn(() => ({
					eq: vi.fn(() => ({
						select: vi.fn(() => ({
							single: vi.fn(),
						})),
					})),
				})),
			})),
		};

		retroService = createRetroService(mockSupabase);
	});

	describe("createRetro", () => {
		it("should create a retro with correct data", async () => {
			const mockRetro = {
				id: "test-id",
				org_id: "org-1",
				title: "Test Retro",
				sprint: "Sprint 1",
				status: "planning" as RetroStatus,
				created_by: "user-1",
				created_at: new Date().toISOString(),
			};

			// Mock the chain
			const singleMock = vi.fn().mockResolvedValue({
				data: mockRetro,
				error: null,
			});

			const selectMock = vi.fn(() => ({ single: singleMock }));
			const insertMock = vi.fn(() => ({ select: selectMock }));
			const fromMock = vi.fn(() => ({ insert: insertMock }));

			mockSupabase.from = fromMock;

			const result = await retroService.createRetro("org-1", "user-1", {
				title: "Test Retro",
				sprint: "Sprint 1",
			});

			expect(mockSupabase.from).toHaveBeenCalledWith("retros");
			expect(result).toEqual(mockRetro);
		});

		it("should throw error when creation fails", async () => {
			// Mock the chain for error case
			const singleMock = vi.fn().mockResolvedValue({
				data: null,
				error: { message: "Creation failed" },
			});

			const selectMock = vi.fn(() => ({ single: singleMock }));
			const insertMock = vi.fn(() => ({ select: selectMock }));
			const fromMock = vi.fn(() => ({ insert: insertMock }));

			mockSupabase.from = fromMock;

			await expect(
				retroService.createRetro("org-1", "user-1", {
					title: "Test Retro",
				})
			).rejects.toThrow("Failed to create retro: Creation failed");
		});
	});

	describe("voteOnNote", () => {
		it("should increment vote count", async () => {
			// Mock getting current note
			const getCurrentNoteMock = vi.fn().mockResolvedValue({
				data: { votes: 2 },
				error: null,
			});

			// Mock updating note
			const updateNoteMock = vi.fn().mockResolvedValue({
				data: { id: "note-id", votes: 3, author: null },
				error: null,
			});

			// Setup the mock chain for select (get current note)
			const selectSingleMock = vi.fn(() => ({ single: getCurrentNoteMock }));
			const selectEqMock = vi.fn(() => ({ single: getCurrentNoteMock }));
			const selectMock = vi.fn(() => ({ eq: selectEqMock }));

			// Setup the mock chain for update
			const updateSingleMock = vi.fn(() => ({ single: updateNoteMock }));
			const updateSelectMock = vi.fn(() => ({ single: updateSingleMock }));
			const updateEqMock = vi.fn(() => ({ select: updateSelectMock }));
			const updateChainMock = vi.fn(() => ({ eq: updateEqMock }));

			let callCount = 0;
			mockSupabase.from = vi.fn(() => {
				callCount++;
				if (callCount === 1) {
					// First call for getting current note
					return { select: selectMock };
				} else {
					// Second call for updating note
					return { update: updateChainMock };
				}
			});

			const result = await retroService.voteOnNote("note-id", true);

			expect(result.votes).toBe(3);
		});
	});

	describe("getRetroStats", () => {
		it("should calculate correct statistics", async () => {
			const mockNotes = [
				{ column_key: "went_well", votes: 3 },
				{ column_key: "went_well", votes: 2 },
				{ column_key: "went_poorly", votes: 1 },
				{ column_key: "ideas", votes: 4 },
				{ column_key: "action_items", votes: 0 },
			];

			const eqMock = vi.fn().mockResolvedValue({
				data: mockNotes,
				error: null,
			});

			const selectMock = vi.fn(() => ({ eq: eqMock }));
			const fromMock = vi.fn(() => ({ select: selectMock }));

			mockSupabase.from = fromMock;

			const stats = await retroService.getRetroStats("retro-1");

			expect(stats.totalNotes).toBe(5);
			expect(stats.totalVotes).toBe(10);
			expect(stats.notesByColumn.went_well).toBe(2);
			expect(stats.notesByColumn.went_poorly).toBe(1);
			expect(stats.notesByColumn.ideas).toBe(1);
			expect(stats.notesByColumn.action_items).toBe(1);
		});
	});
});
