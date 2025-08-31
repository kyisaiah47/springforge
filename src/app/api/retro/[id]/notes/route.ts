import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRetroService } from "@/lib/modules/retro";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const createNoteSchema = z.object({
	column_key: z.enum(["went_well", "went_poorly", "ideas", "action_items"]),
	text: z.string().min(1).max(500),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.optional(),
	is_anonymous: z.boolean().default(false),
});

export const POST = withMonitoring(async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const requestId = generateRequestId();
	logger.info("POST /api/retro/[id]/notes", { requestId, retroId: id });

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

		// Check if retro is in a state that allows adding notes
		if (retro.status === "completed" || retro.status === "archived") {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Cannot add notes to completed or archived retro"
				),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = createNoteSchema.parse(body);

		// Create note
		const note = await retroService.createRetroNote(
			id,
			member.id,
			validatedData
		);

		logger.info("Retro note created successfully", {
			requestId,
			retroId: id,
			noteId: note.id,
			orgId: member.org_id,
		});
		return NextResponse.json(note, { status: 201 });
	} catch (error) {
		logger.error("Create retro note error", error as Error, {
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
"POST /api/retro/[id]/notes");
