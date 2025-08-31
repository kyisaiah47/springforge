import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRetroService } from "@/lib/modules/retro";
import { RetroExportService } from "@/lib/modules/retro/export-service";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const mergeDuplicatesSchema = z.object({
	similarityThreshold: z.number().min(0).max(1).default(0.8),
	dryRun: z.boolean().default(false), // Preview mode without actually merging
});

export const POST = withMonitoring(async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const requestId = generateRequestId();
	logger.info("POST /api/retro/[id]/merge-duplicates", {
		requestId,
		retroId: id,
	});

	try {
		const supabase = await createClient();

		// Check authentication
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				createAPIError("UNAUTHORIZED", "Authentication required"),
				{ status: 401 }
			);
		}

		// Get user's organization and role
		const { data: member, error: memberError } = await supabase
			.from("members")
			.select("org_id, id, role")
			.eq("email", user.email!)
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const { similarityThreshold, dryRun } = mergeDuplicatesSchema.parse(body);

		// Get retro and verify organization access
		const retroService = createRetroService(supabase);
		const retro = await retroService.getRetro(id);

		if (!retro) {
			return NextResponse.json(createAPIError("NOT_FOUND", "Retro not found"), {
				status: 404,
			});
		}

		if (retro.org_id !== member.org_id) {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Cannot access retro from different organization"
				),
				{ status: 403 }
			);
		}

		// Only allow retro creator or admin to merge duplicates
		if (retro.created_by !== member.id && member.role !== "admin") {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Only retro creator or admin can merge duplicate notes"
				),
				{ status: 403 }
			);
		}

		// Get retro notes
		const notes = await retroService.getRetroNotes(id);

		// Find and merge duplicates
		const { mergedNotes, duplicateGroups } =
			RetroExportService.mergeDuplicateNotes(notes, similarityThreshold);

		if (dryRun) {
			// Return preview without making changes
			logger.info("Duplicate merge preview generated", {
				requestId,
				retroId: id,
				originalCount: notes.length,
				mergedCount: mergedNotes.length,
				duplicateGroupsCount: duplicateGroups.length,
			});

			return NextResponse.json({
				dryRun: true,
				originalCount: notes.length,
				mergedCount: mergedNotes.length,
				duplicateGroups: duplicateGroups.map((group) => ({
					count: group.length,
					notes: group.map((note) => ({
						id: note.id,
						text: note.text,
						votes: note.votes,
						column_key: note.column_key,
					})),
				})),
				preview: mergedNotes.map((note) => ({
					id: note.id,
					text: note.text,
					votes: note.votes,
					column_key: note.column_key,
				})),
			});
		}

		// Actually perform the merge
		const mergeResults = [];

		for (const duplicateGroup of duplicateGroups) {
			if (duplicateGroup.length <= 1) continue;

			// Keep the first note (with highest votes) and delete the others
			const [keepNote, ...deleteNotes] = duplicateGroup.sort(
				(a, b) => b.votes - a.votes
			);

			// Update the kept note with merged data
			const totalVotes = duplicateGroup.reduce(
				(sum, note) => sum + note.votes,
				0
			);
			const uniqueTexts = [...new Set(duplicateGroup.map((n) => n.text))];
			const mergedText =
				uniqueTexts.length > 1 ? uniqueTexts.join(" / ") : keepNote.text;

			// Update the note
			await retroService.updateRetroNote(keepNote.id, {
				text: mergedText,
			});

			// Update votes separately (since votes are handled differently)
			if (totalVotes !== keepNote.votes) {
				const voteDifference = totalVotes - keepNote.votes;
				for (let i = 0; i < Math.abs(voteDifference); i++) {
					await retroService.voteOnNote(keepNote.id, voteDifference > 0);
				}
			}

			// Delete the duplicate notes
			for (const deleteNote of deleteNotes) {
				await retroService.deleteRetroNote(deleteNote.id);
			}

			mergeResults.push({
				keptNoteId: keepNote.id,
				deletedNoteIds: deleteNotes.map((n) => n.id),
				originalTexts: duplicateGroup.map((n) => n.text),
				mergedText,
				totalVotes,
			});
		}

		logger.info("Duplicate notes merged successfully", {
			requestId,
			retroId: id,
			orgId: member.org_id,
			originalCount: notes.length,
			mergedCount: mergedNotes.length,
			mergeOperations: mergeResults.length,
		});

		return NextResponse.json({
			dryRun: false,
			originalCount: notes.length,
			mergedCount: mergedNotes.length,
			mergeOperations: mergeResults.length,
			results: mergeResults,
		});
	} catch (error) {
		logger.error("Merge duplicates error", error as Error, {
			requestId,
			retroId: id,
		});

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				createAPIError(
					"VALIDATION_ERROR",
					"Invalid request data",
					error.issues
				),
				{ status: 400 }
			);
		}

		if (error instanceof Error) {
			return NextResponse.json(
				createAPIError("INTERNAL_ERROR", error.message),
				{ status: 500 }
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
},
"POST /api/retro/[id]/merge-duplicates");
