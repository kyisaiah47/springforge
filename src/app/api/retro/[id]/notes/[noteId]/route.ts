import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRetroService } from "@/lib/modules/retro";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const updateNoteSchema = z.object({
	text: z.string().min(1).max(500).optional(),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.optional(),
});

export const PUT = withMonitoring(async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; noteId: string }> }
) {
	const { id, noteId } = await params;
	const requestId = generateRequestId();
	logger.info("PUT /api/retro/[id]/notes/[noteId]", {
		requestId,
		retroId: id,
		noteId,
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

		// Get user's organization
		const { data: member, error: memberError } = await supabase
			.from("members")
			.select("org_id, id")
			.eq("email", user.email!)
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Verify retro exists and user has access
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

		// Get the note to verify ownership
		const { data: existingNote, error: noteError } = await supabase
			.from("retro_notes")
			.select("author_member_id, retro_id")
			.eq("id", noteId)
			.single();

		if (noteError || !existingNote) {
			return NextResponse.json(createAPIError("NOT_FOUND", "Note not found"), {
				status: 404,
			});
		}

		if (existingNote.retro_id !== id) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "Note does not belong to this retro"),
				{ status: 403 }
			);
		}

		// Only allow author to edit their own notes (unless anonymous)
		if (
			existingNote.author_member_id &&
			existingNote.author_member_id !== member.id
		) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "Can only edit your own notes"),
				{ status: 403 }
			);
		}

		// Check if retro is in a state that allows editing notes
		if (retro.status === "completed" || retro.status === "archived") {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Cannot edit notes in completed or archived retro"
				),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = updateNoteSchema.parse(body);

		// Update note
		const updatedNote = await retroService.updateRetroNote(
			noteId,
			validatedData
		);

		logger.info("Retro note updated successfully", {
			requestId,
			retroId: id,
			noteId,
			orgId: member.org_id,
		});
		return NextResponse.json(updatedNote);
	} catch (error) {
		logger.error("Update retro note error", error as Error, {
			requestId,
			retroId: id,
			noteId,
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
				{
					status: 500,
				}
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
},
"PUT /api/retro/[id]/notes/[noteId]");

export const DELETE = withMonitoring(async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; noteId: string }> }
) {
	const { id, noteId } = await params;
	const requestId = generateRequestId();
	logger.info("DELETE /api/retro/[id]/notes/[noteId]", {
		requestId,
		retroId: id,
		noteId,
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

		// Get user's organization
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

		// Verify retro exists and user has access
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

		// Get the note to verify ownership
		const { data: existingNote, error: noteError } = await supabase
			.from("retro_notes")
			.select("author_member_id, retro_id")
			.eq("id", noteId)
			.single();

		if (noteError || !existingNote) {
			return NextResponse.json(createAPIError("NOT_FOUND", "Note not found"), {
				status: 404,
			});
		}

		if (existingNote.retro_id !== id) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "Note does not belong to this retro"),
				{ status: 403 }
			);
		}

		// Only allow author or admin to delete notes
		if (
			existingNote.author_member_id !== member.id &&
			member.role !== "admin"
		) {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Can only delete your own notes or admin can delete any"
				),
				{ status: 403 }
			);
		}

		// Check if retro is in a state that allows deleting notes
		if (retro.status === "completed" || retro.status === "archived") {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Cannot delete notes in completed or archived retro"
				),
				{ status: 403 }
			);
		}

		// Delete note
		await retroService.deleteRetroNote(noteId);

		logger.info("Retro note deleted successfully", {
			requestId,
			retroId: id,
			noteId,
			orgId: member.org_id,
		});
		return NextResponse.json({ success: true });
	} catch (error) {
		logger.error("Delete retro note error", error as Error, {
			requestId,
			retroId: id,
			noteId,
		});

		if (error instanceof Error) {
			return NextResponse.json(
				createAPIError("INTERNAL_ERROR", error.message),
				{
					status: 500,
				}
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
},
"DELETE /api/retro/[id]/notes/[noteId]");
