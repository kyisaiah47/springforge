import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAutoStandService } from "@/lib/modules/autostand/service";
import { createAPIError } from "@/lib/shared/api-error";

const generateStandupSchema = z.object({
	member_id: z.string().uuid(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

export async function POST(request: NextRequest) {
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
			.select("org_id")
			.eq("email", user.email!)
			.is("deleted_at", null)
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		console.log("Generate standup request body:", body);
		const validatedData = generateStandupSchema.parse(body);

		// Verify member belongs to same organization
		const { data: targetMember, error: targetMemberError } = await supabase
			.from("members")
			.select("org_id")
			.eq("id", validatedData.member_id)
			.is("deleted_at", null)
			.single();

		if (targetMemberError || !targetMember) {
			return NextResponse.json(
				createAPIError("NOT_FOUND", "Member not found"),
				{
					status: 404,
				}
			);
		}

		if (targetMember.org_id !== member.org_id) {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Cannot generate standup for member in different organization"
				),
				{ status: 403 }
			);
		}

		// Generate standup
		const autoStandService = createAutoStandService();
		const result = await autoStandService.generateStandup(
			member.org_id,
			validatedData
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Generate standup error:", error);

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
}
