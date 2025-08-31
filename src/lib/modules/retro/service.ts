import { createClient as createClientClient } from "@/lib/supabase/client";
import {
	Retro,
	RetroInsert,
	RetroUpdate,
	RetroNote,
	RetroNoteInsert,
	RetroNoteUpdate,
	RetroWithDetails,
	RetroNoteWithAuthor,
	RetroStatus,
	RetroColumn,
	CreateRetroRequest,
	CreateRetroNoteRequest,
	UpdateRetroNoteRequest,
} from "./types";
import {
	RetroExportService,
	ExportOptions,
	NotionExportOptions,
} from "./export-service";

export class RetroService {
	private supabase;

	constructor(supabaseClient?: any) {
		this.supabase = supabaseClient || createClientClient();
	}

	// Retro CRUD operations
	async createRetro(
		orgId: string,
		createdBy: string,
		data: CreateRetroRequest
	): Promise<Retro> {
		const { data: retro, error } = await this.supabase
			.from("retros")
			.insert({
				org_id: orgId,
				created_by: createdBy,
				title: data.title,
				sprint: data.sprint,
				status: "planning" as RetroStatus,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create retro: ${error.message}`);
		}

		return retro;
	}

	async getRetro(retroId: string): Promise<RetroWithDetails | null> {
		const { data: retro, error } = await this.supabase
			.from("retros")
			.select(
				`
				*,
				created_by_member:members!retros_created_by_fkey(
					id,
					email,
					github_login,
					avatar_url
				)
			`
			)
			.eq("id", retroId)
			.single();

		if (error) {
			if (error.code === "PGRST116") return null; // Not found
			throw new Error(`Failed to get retro: ${error.message}`);
		}

		return retro;
	}

	async getRetros(
		orgId: string,
		options: {
			status?: RetroStatus;
			createdBy?: string;
			limit?: number;
			cursor?: string;
			orderBy?: string;
			orderDir?: "asc" | "desc";
		} = {}
	): Promise<{ retros: RetroWithDetails[]; nextCursor?: string }> {
		let query = this.supabase
			.from("retros")
			.select(
				`
				*,
				created_by_member:members!retros_created_by_fkey(
					id,
					email,
					github_login,
					avatar_url
				),
				note_count:retro_notes(count)
			`
			)
			.eq("org_id", orgId);

		// Apply filters
		if (options.status) {
			query = query.eq("status", options.status);
		}

		if (options.createdBy) {
			query = query.eq("created_by", options.createdBy);
		}

		// Apply cursor pagination
		if (options.cursor) {
			query = query.gt("created_at", options.cursor);
		}

		// Apply ordering
		const orderBy = options.orderBy || "created_at";
		const orderDir = options.orderDir || "desc";
		query = query.order(orderBy, { ascending: orderDir === "asc" });

		// Apply limit
		const limit = Math.min(options.limit || 20, 100);
		query = query.limit(limit + 1); // Get one extra to check for next page

		const { data: retros, error } = await query;

		if (error) {
			throw new Error(`Failed to get retros: ${error.message}`);
		}

		// Handle pagination
		const hasMore = retros.length > limit;
		const results = hasMore ? retros.slice(0, limit) : retros;
		const nextCursor = hasMore
			? results[results.length - 1].created_at
			: undefined;

		return {
			retros: results.map((retro: any) => ({
				...retro,
				note_count: Array.isArray(retro.note_count)
					? retro.note_count.length
					: 0,
			})),
			nextCursor,
		};
	}

	async updateRetro(retroId: string, data: RetroUpdate): Promise<Retro> {
		const { data: retro, error } = await this.supabase
			.from("retros")
			.update(data)
			.eq("id", retroId)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update retro: ${error.message}`);
		}

		return retro;
	}

	async deleteRetro(retroId: string): Promise<void> {
		const { error } = await this.supabase
			.from("retros")
			.delete()
			.eq("id", retroId);

		if (error) {
			throw new Error(`Failed to delete retro: ${error.message}`);
		}
	}

	// Retro Note CRUD operations
	async createRetroNote(
		retroId: string,
		authorId: string | null,
		data: CreateRetroNoteRequest
	): Promise<RetroNoteWithAuthor> {
		const { data: note, error } = await this.supabase
			.from("retro_notes")
			.insert({
				retro_id: retroId,
				author_member_id: data.is_anonymous ? null : authorId,
				column_key: data.column_key,
				text: data.text,
				color: data.color || "#fbbf24",
				is_anonymous: data.is_anonymous || false,
			})
			.select(
				`
				*,
				author:members(
					id,
					email,
					github_login,
					avatar_url
				)
			`
			)
			.single();

		if (error) {
			throw new Error(`Failed to create retro note: ${error.message}`);
		}

		return note;
	}

	async getRetroNotes(retroId: string): Promise<RetroNoteWithAuthor[]> {
		const { data: notes, error } = await this.supabase
			.from("retro_notes")
			.select(
				`
				*,
				author:members(
					id,
					email,
					github_login,
					avatar_url
				)
			`
			)
			.eq("retro_id", retroId)
			.order("created_at", { ascending: true });

		if (error) {
			throw new Error(`Failed to get retro notes: ${error.message}`);
		}

		return notes || [];
	}

	async updateRetroNote(
		noteId: string,
		data: UpdateRetroNoteRequest
	): Promise<RetroNoteWithAuthor> {
		const { data: note, error } = await this.supabase
			.from("retro_notes")
			.update(data)
			.eq("id", noteId)
			.select(
				`
				*,
				author:members(
					id,
					email,
					github_login,
					avatar_url
				)
			`
			)
			.single();

		if (error) {
			throw new Error(`Failed to update retro note: ${error.message}`);
		}

		return note;
	}

	async deleteRetroNote(noteId: string): Promise<void> {
		const { error } = await this.supabase
			.from("retro_notes")
			.delete()
			.eq("id", noteId);

		if (error) {
			throw new Error(`Failed to delete retro note: ${error.message}`);
		}
	}

	// Voting operations
	async voteOnNote(
		noteId: string,
		increment: boolean
	): Promise<RetroNoteWithAuthor> {
		// Get current vote count
		const { data: currentNote, error: fetchError } = await this.supabase
			.from("retro_notes")
			.select("votes")
			.eq("id", noteId)
			.single();

		if (fetchError) {
			throw new Error(`Failed to get current note: ${fetchError.message}`);
		}

		const newVotes = Math.max(0, currentNote.votes + (increment ? 1 : -1));

		const { data: note, error } = await this.supabase
			.from("retro_notes")
			.update({ votes: newVotes })
			.eq("id", noteId)
			.select(
				`
				*,
				author:members(
					id,
					email,
					github_login,
					avatar_url
				)
			`
			)
			.single();

		if (error) {
			throw new Error(`Failed to vote on note: ${error.message}`);
		}

		return note;
	}

	// Status management
	async updateRetroStatus(
		retroId: string,
		status: RetroStatus
	): Promise<Retro> {
		return this.updateRetro(retroId, { status });
	}

	// Utility methods
	async getRetroNotesByColumn(
		retroId: string,
		column: RetroColumn
	): Promise<RetroNoteWithAuthor[]> {
		const { data: notes, error } = await this.supabase
			.from("retro_notes")
			.select(
				`
				*,
				author:members(
					id,
					email,
					github_login,
					avatar_url
				)
			`
			)
			.eq("retro_id", retroId)
			.eq("column_key", column)
			.order("votes", { ascending: false })
			.order("created_at", { ascending: true });

		if (error) {
			throw new Error(`Failed to get retro notes by column: ${error.message}`);
		}

		return notes || [];
	}

	async getRetroStats(retroId: string): Promise<{
		totalNotes: number;
		notesByColumn: Record<RetroColumn, number>;
		totalVotes: number;
	}> {
		const { data: notes, error } = await this.supabase
			.from("retro_notes")
			.select("column_key, votes")
			.eq("retro_id", retroId);

		if (error) {
			throw new Error(`Failed to get retro stats: ${error.message}`);
		}

		const stats = {
			totalNotes: notes.length,
			notesByColumn: {
				went_well: 0,
				went_poorly: 0,
				ideas: 0,
				action_items: 0,
			} as Record<RetroColumn, number>,
			totalVotes: 0,
		};

		notes.forEach((note: any) => {
			stats.notesByColumn[note.column_key as RetroColumn]++;
			stats.totalVotes += note.votes;
		});

		return stats;
	}

	// Export functionality
	async exportRetroToMarkdown(
		retroId: string,
		options: ExportOptions = {}
	): Promise<string> {
		const retro = await this.getRetro(retroId);
		if (!retro) {
			throw new Error("Retro not found");
		}

		const notes = await this.getRetroNotes(retroId);
		return RetroExportService.exportToMarkdown(retro, notes, options);
	}

	async exportRetroToNotion(
		retroId: string,
		notionToken: string,
		options: NotionExportOptions = {}
	): Promise<{ success: boolean; pageUrl?: string; error?: string }> {
		const retro = await this.getRetro(retroId);
		if (!retro) {
			throw new Error("Retro not found");
		}

		const notes = await this.getRetroNotes(retroId);
		return RetroExportService.exportToNotion(
			retro,
			notes,
			notionToken,
			options
		);
	}

	async findDuplicateNotes(
		retroId: string,
		similarityThreshold: number = 0.8
	): Promise<{
		mergedNotes: RetroNoteWithAuthor[];
		duplicateGroups: RetroNoteWithAuthor[][];
	}> {
		const notes = await this.getRetroNotes(retroId);
		return RetroExportService.mergeDuplicateNotes(notes, similarityThreshold);
	}
}

// Factory function for server-side usage
export function createRetroService(supabaseClient?: any) {
	return new RetroService(supabaseClient);
}

// Lazy singleton for client-side usage
let _retroClientService: RetroService | null = null;
export function getRetroClientService(): RetroService {
	if (!_retroClientService) {
		_retroClientService = new RetroService();
	}
	return _retroClientService;
}
