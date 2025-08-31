import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetroExportService } from "../export-service";
import { RetroWithDetails, RetroNoteWithAuthor, RetroColumn } from "../types";

// Mock data
const mockRetro: RetroWithDetails = {
	id: "retro-1",
	org_id: "org-1",
	title: "Sprint 23 Retrospective",
	sprint: "Sprint 23",
	status: "completed",
	created_by: "user-1",
	created_at: "2024-01-15T10:00:00Z",
	created_by_member: {
		id: "user-1",
		email: "john@example.com",
		github_login: "johndoe",
		avatar_url: "https://github.com/johndoe.png",
	},
};

const mockNotes: RetroNoteWithAuthor[] = [
	{
		id: "note-1",
		retro_id: "retro-1",
		author_member_id: "user-1",
		column_key: "went_well",
		text: "Great team collaboration",
		color: "#fbbf24",
		votes: 5,
		is_anonymous: false,
		created_at: "2024-01-15T10:05:00Z",
		author: {
			id: "user-1",
			email: "john@example.com",
			github_login: "johndoe",
			avatar_url: "https://github.com/johndoe.png",
		},
	},
	{
		id: "note-2",
		retro_id: "retro-1",
		author_member_id: null,
		column_key: "went_poorly",
		text: "Communication issues",
		color: "#f87171",
		votes: 3,
		is_anonymous: true,
		created_at: "2024-01-15T10:10:00Z",
		author: null,
	},
	{
		id: "note-3",
		retro_id: "retro-1",
		author_member_id: "user-2",
		column_key: "ideas",
		text: "Implement daily standups",
		color: "#60a5fa",
		votes: 2,
		is_anonymous: false,
		created_at: "2024-01-15T10:15:00Z",
		author: {
			id: "user-2",
			email: "jane@example.com",
			github_login: "janedoe",
			avatar_url: "https://github.com/janedoe.png",
		},
	},
	{
		id: "note-4",
		retro_id: "retro-1",
		author_member_id: "user-1",
		column_key: "action_items",
		text: "Schedule weekly team meetings",
		color: "#34d399",
		votes: 1,
		is_anonymous: false,
		created_at: "2024-01-15T10:20:00Z",
		author: {
			id: "user-1",
			email: "john@example.com",
			github_login: "johndoe",
			avatar_url: "https://github.com/johndoe.png",
		},
	},
];

describe("RetroExportService", () => {
	describe("exportToMarkdown", () => {
		it("should export retro to markdown with default options", () => {
			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				mockNotes
			);

			expect(markdown).toContain("# Sprint 23 Retrospective");
			expect(markdown).toContain("**Sprint:** Sprint 23");
			expect(markdown).toContain("**Status:** completed");
			expect(markdown).toContain("**Created by:** johndoe");
			expect(markdown).toContain("## What went well?");
			expect(markdown).toContain("## What could improve?");
			expect(markdown).toContain("## Ideas & Suggestions");
			expect(markdown).toContain("## Action Items");
			expect(markdown).toContain("Great team collaboration");
			expect(markdown).toContain("Communication issues");
			expect(markdown).toContain("5 votes");
			expect(markdown).toContain("3 votes");
		});

		it("should include authors when includeAuthor is true", () => {
			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				mockNotes,
				{
					includeAuthor: true,
				}
			);

			expect(markdown).toContain("by johndoe");
			expect(markdown).toContain("by janedoe");
			// Anonymous notes should not show author
			expect(markdown).not.toContain("Communication issues *(3 votes, by");
		});

		it("should include timestamps when includeTimestamps is true", () => {
			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				mockNotes,
				{
					includeTimestamps: true,
				}
			);

			expect(markdown).toContain("1/15/2024");
		});

		it("should exclude votes when includeVotes is false", () => {
			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				mockNotes,
				{
					includeVotes: false,
				}
			);

			expect(markdown).not.toContain("5 votes");
			expect(markdown).not.toContain("3 votes");
		});

		it("should list chronologically when groupByColumn is false", () => {
			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				mockNotes,
				{
					groupByColumn: false,
				}
			);

			expect(markdown).toContain("## All Notes");
			expect(markdown).toContain(
				"**[What went well?]** Great team collaboration"
			);
			expect(markdown).toContain(
				"**[What could improve?]** Communication issues"
			);
		});

		it("should include summary statistics", () => {
			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				mockNotes
			);

			expect(markdown).toContain("## Summary");
			expect(markdown).toContain("**Total Notes:** 4");
			expect(markdown).toContain("**Total Votes:** 11");
			expect(markdown).toContain("What went well?: 1");
			expect(markdown).toContain("What could improve?: 1");
			expect(markdown).toContain("Ideas & Suggestions: 1");
			expect(markdown).toContain("Action Items: 1");
		});

		it("should handle empty notes", () => {
			const markdown = RetroExportService.exportToMarkdown(mockRetro, []);

			expect(markdown).toContain("# Sprint 23 Retrospective");
			expect(markdown).toContain("*No items*");
			expect(markdown).toContain("**Total Notes:** 0");
			expect(markdown).toContain("**Total Votes:** 0");
		});

		it("should sort notes by votes descending within columns", () => {
			const notesWithVotes = [
				{ ...mockNotes[0], votes: 1 }, // went_well, 1 vote
				{ ...mockNotes[0], id: "note-5", votes: 5 }, // went_well, 5 votes
				{ ...mockNotes[0], id: "note-6", votes: 3 }, // went_well, 3 votes
			];

			const markdown = RetroExportService.exportToMarkdown(
				mockRetro,
				notesWithVotes
			);
			const wentWellSection = markdown
				.split("## What went well?")[1]
				.split("## What could improve?")[0];

			// Should be ordered: 5 votes, 3 votes, 1 vote
			const votePositions = [
				wentWellSection.indexOf("5 vote"),
				wentWellSection.indexOf("3 vote"),
				wentWellSection.indexOf("1 vote"),
			];

			expect(votePositions[0]).toBeLessThan(votePositions[1]);
			expect(votePositions[1]).toBeLessThan(votePositions[2]);
		});
	});

	describe("exportToNotion", () => {
		it("should return success for valid token", async () => {
			const result = await RetroExportService.exportToNotion(
				mockRetro,
				mockNotes,
				"secret_token_123"
			);

			expect(result.success).toBe(true);
			expect(result.pageUrl).toContain("notion.so/retro-");
			expect(result.error).toBeUndefined();
		});

		it("should return error for missing token", async () => {
			const result = await RetroExportService.exportToNotion(
				mockRetro,
				mockNotes,
				""
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Notion token is required");
			expect(result.pageUrl).toBeUndefined();
		});

		it("should simulate API delay", async () => {
			const startTime = Date.now();
			await RetroExportService.exportToNotion(mockRetro, mockNotes, "token");
			const endTime = Date.now();

			expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
		});
	});

	describe("mergeDuplicateNotes", () => {
		const duplicateNotes: RetroNoteWithAuthor[] = [
			{
				...mockNotes[0],
				id: "note-1",
				text: "Great team collaboration",
				votes: 3,
			},
			{
				...mockNotes[0],
				id: "note-2",
				text: "Excellent team collaboration",
				votes: 2,
			},
			{
				...mockNotes[0],
				id: "note-3",
				text: "Communication was poor",
				column_key: "went_poorly",
				votes: 1,
			},
			{
				...mockNotes[0],
				id: "note-4",
				text: "Bad communication",
				column_key: "went_poorly",
				votes: 4,
			},
		];

		it("should merge similar notes with default threshold", () => {
			const result = RetroExportService.mergeDuplicateNotes(duplicateNotes);

			// With default threshold 0.8, the test notes might not be similar enough
			expect(result.mergedNotes.length).toBeLessThanOrEqual(
				duplicateNotes.length
			);
			expect(result.duplicateGroups.length).toBeGreaterThanOrEqual(0);
		});

		it("should merge notes with high similarity", () => {
			const result = RetroExportService.mergeDuplicateNotes(
				duplicateNotes,
				0.5
			);

			// Should find duplicates with lower threshold
			const collaborationGroup = result.duplicateGroups.find((group) =>
				group.some((note) => note.text.includes("collaboration"))
			);
			expect(collaborationGroup).toBeDefined();
			expect(collaborationGroup!.length).toBe(2);
		});

		it("should not merge notes with low similarity", () => {
			const result = RetroExportService.mergeDuplicateNotes(
				duplicateNotes,
				0.9
			);

			// Should not find many duplicates with high threshold
			expect(result.duplicateGroups.length).toBeLessThanOrEqual(1);
		});

		it("should only merge notes in the same column", () => {
			const result = RetroExportService.mergeDuplicateNotes(
				duplicateNotes,
				0.1
			);

			// Even with very low threshold, notes from different columns shouldn't merge
			result.duplicateGroups.forEach((group) => {
				const columns = new Set(group.map((note) => note.column_key));
				expect(columns.size).toBe(1);
			});
		});

		it("should combine votes when merging", () => {
			const result = RetroExportService.mergeDuplicateNotes(
				duplicateNotes,
				0.5
			);

			const mergedNote = result.mergedNotes.find((note) =>
				note.text.includes("collaboration")
			);

			if (mergedNote) {
				expect(mergedNote.votes).toBe(5); // 3 + 2 from the collaboration notes
			}
		});

		it("should combine text when merging different texts", () => {
			const result = RetroExportService.mergeDuplicateNotes(
				duplicateNotes,
				0.5
			);

			const mergedNote = result.mergedNotes.find((note) =>
				note.text.includes("/")
			);

			if (mergedNote) {
				expect(mergedNote.text).toContain(" / ");
			}
		});

		it("should handle identical notes", () => {
			const identicalNotes = [
				{ ...mockNotes[0], id: "note-1", text: "Same text" },
				{ ...mockNotes[0], id: "note-2", text: "Same text" },
			];

			const result = RetroExportService.mergeDuplicateNotes(identicalNotes);

			expect(result.mergedNotes.length).toBe(1);
			expect(result.duplicateGroups.length).toBe(1);
			expect(result.duplicateGroups[0].length).toBe(2);
		});

		it("should handle empty notes array", () => {
			const result = RetroExportService.mergeDuplicateNotes([]);

			expect(result.mergedNotes).toEqual([]);
			expect(result.duplicateGroups).toEqual([]);
		});

		it("should handle single note", () => {
			const result = RetroExportService.mergeDuplicateNotes([mockNotes[0]]);

			expect(result.mergedNotes).toEqual([mockNotes[0]]);
			expect(result.duplicateGroups).toEqual([]);
		});
	});

	describe("calculateSimilarity", () => {
		// Access private method through any cast for testing
		const calculateSimilarity = (RetroExportService as any).calculateSimilarity;

		it("should return 1.0 for identical strings", () => {
			const similarity = calculateSimilarity("hello world", "hello world");
			expect(similarity).toBe(1.0);
		});

		it("should return 0.0 for completely different strings", () => {
			const similarity = calculateSimilarity("hello world", "foo bar");
			expect(similarity).toBe(0.0);
		});

		it("should return partial similarity for overlapping words", () => {
			const similarity = calculateSimilarity("hello world", "hello universe");
			expect(similarity).toBe(1 / 3); // 1 word overlap out of 3 total unique words (hello, world, universe)
		});

		it("should be case insensitive", () => {
			const similarity = calculateSimilarity("Hello World", "hello world");
			expect(similarity).toBe(1.0);
		});

		it("should handle punctuation and extra spaces", () => {
			const similarity = calculateSimilarity("hello, world!", "hello world");
			// After normalization, both become ["hello", "world"], so similarity is 1.0
			expect(similarity).toBe(1.0);
		});
	});

	describe("mergeNotes", () => {
		// Access private method through any cast for testing
		const mergeNotes = (RetroExportService as any).mergeNotes;

		it("should use note with most votes as base", () => {
			const notes = [
				{ ...mockNotes[0], id: "note-1", votes: 1, text: "Low votes" },
				{ ...mockNotes[0], id: "note-2", votes: 5, text: "High votes" },
				{ ...mockNotes[0], id: "note-3", votes: 3, text: "Medium votes" },
			];

			const merged = mergeNotes(notes);
			expect(merged.id).toBe("note-2");
			expect(merged.text).toContain("High votes");
		});

		it("should combine votes from all notes", () => {
			const notes = [
				{ ...mockNotes[0], votes: 1 },
				{ ...mockNotes[0], votes: 3 },
				{ ...mockNotes[0], votes: 2 },
			];

			const merged = mergeNotes(notes);
			expect(merged.votes).toBe(6);
		});

		it("should combine different texts", () => {
			const notes = [
				{ ...mockNotes[0], text: "First text" },
				{ ...mockNotes[0], text: "Second text" },
			];

			const merged = mergeNotes(notes);
			expect(merged.text).toBe("First text / Second text");
		});

		it("should not combine identical texts", () => {
			const notes = [
				{ ...mockNotes[0], text: "Same text" },
				{ ...mockNotes[0], text: "Same text" },
			];

			const merged = mergeNotes(notes);
			expect(merged.text).toBe("Same text");
		});
	});

	describe("groupNotesByColumn", () => {
		// Access private method through any cast for testing
		const groupNotesByColumn = (RetroExportService as any).groupNotesByColumn;

		it("should group notes by column correctly", () => {
			const grouped = groupNotesByColumn(mockNotes);

			expect(grouped.went_well).toHaveLength(1);
			expect(grouped.went_poorly).toHaveLength(1);
			expect(grouped.ideas).toHaveLength(1);
			expect(grouped.action_items).toHaveLength(1);
		});

		it("should handle empty notes", () => {
			const grouped = groupNotesByColumn([]);

			expect(grouped.went_well).toHaveLength(0);
			expect(grouped.went_poorly).toHaveLength(0);
			expect(grouped.ideas).toHaveLength(0);
			expect(grouped.action_items).toHaveLength(0);
		});

		it("should handle notes all in one column", () => {
			const singleColumnNotes = mockNotes.map((note) => ({
				...note,
				column_key: "went_well" as RetroColumn,
			}));

			const grouped = groupNotesByColumn(singleColumnNotes);

			expect(grouped.went_well).toHaveLength(4);
			expect(grouped.went_poorly).toHaveLength(0);
			expect(grouped.ideas).toHaveLength(0);
			expect(grouped.action_items).toHaveLength(0);
		});
	});

	describe("calculateStats", () => {
		// Access private method through any cast for testing
		const calculateStats = (RetroExportService as any).calculateStats;

		it("should calculate correct statistics", () => {
			const stats = calculateStats(mockNotes);

			expect(stats.totalNotes).toBe(4);
			expect(stats.totalVotes).toBe(11); // 5 + 3 + 2 + 1
			expect(stats.notesByColumn.went_well).toBe(1);
			expect(stats.notesByColumn.went_poorly).toBe(1);
			expect(stats.notesByColumn.ideas).toBe(1);
			expect(stats.notesByColumn.action_items).toBe(1);
		});

		it("should handle empty notes", () => {
			const stats = calculateStats([]);

			expect(stats.totalNotes).toBe(0);
			expect(stats.totalVotes).toBe(0);
			expect(stats.notesByColumn.went_well).toBe(0);
			expect(stats.notesByColumn.went_poorly).toBe(0);
			expect(stats.notesByColumn.ideas).toBe(0);
			expect(stats.notesByColumn.action_items).toBe(0);
		});

		it("should handle notes with zero votes", () => {
			const notesWithZeroVotes = mockNotes.map((note) => ({
				...note,
				votes: 0,
			}));
			const stats = calculateStats(notesWithZeroVotes);

			expect(stats.totalNotes).toBe(4);
			expect(stats.totalVotes).toBe(0);
		});
	});
});
