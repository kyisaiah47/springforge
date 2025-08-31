import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRetroService } from "@/lib/modules/retro";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const voteSchema = z.object({
	increment: z.boolean(),
});

export const POST = withMonitoring(async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; noteId: string }> }
) {
	const { id, noteId } = await params;
	const requestId = generateRequestId();
	logger.info("POST /api/retro/[id]/notes/[noteId]/vote", {
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

		// Verify note exists and belongs to this retro
		const { data: existingNote, error: noteError } = await supabase
			.from("retro_notes")
			.select("retro_id")
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

		// Check if retro is in voting phase
		if (retro.status !== "voting" && retro.status !== "active") {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Voting is only allowed in active or voting phase"
				),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = voteSchema.parse(body);

		// Vote on note
		const updatedNote = await retroService.voteOnNote(
			noteId,
			validatedData.increment
		);

		logger.info("Vote cast successfully", {
			requestId,
			retroId: id,
			noteId,
			increment: validatedData.increment,
			newVotes: updatedNote.votes,
			orgId: member.org_id,
		});
		return NextResponse.json(updatedNote);
	} catch (error) {
		logger.error("Vote on note error", error as Error, {
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
"POST /api/retro/[id]/notes/[noteId]/vote");
