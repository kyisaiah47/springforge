import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAutoStandService } from "@/lib/modules/autostand/service";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const getStandupsSchema = z.object({
	member_id: z.string().uuid().optional(),
	date_from: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	date_to: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	cursor: z.string().optional(),
	order_by: z.enum(["date", "created_at"]).default("date"),
	order_dir: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = withMonitoring(async function GET(request: NextRequest) {
	const requestId = generateRequestId();
	logger.info("GET /api/standups", { requestId });

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
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Parse and validate query parameters
		const { searchParams } = new URL(request.url);
		const queryParams = Object.fromEntries(searchParams.entries());
		const validatedParams = getStandupsSchema.parse(queryParams);

		// If member_id is specified, verify it belongs to same organization
		if (validatedParams.member_id) {
			const { data: targetMember, error: targetMemberError } = await supabase
				.from("members")
				.select("org_id")
				.eq("id", validatedParams.member_id)
				.single();

			if (targetMemberError || !targetMember) {
				return NextResponse.json(
					createAPIError("NOT_FOUND", "Member not found"),
					{ status: 404 }
				);
			}

			if (targetMember.org_id !== member.org_id) {
				return NextResponse.json(
					createAPIError(
						"FORBIDDEN",
						"Cannot access standups for member in different organization"
					),
					{ status: 403 }
				);
			}
		}

		// Get standups
		const autoStandService = createAutoStandService();
		const result = await autoStandService.getStandups(
			member.org_id,
			validatedParams
		);

		logger.info("Standups retrieved successfully", {
			requestId,
			count: Array.isArray(result.standups) ? result.standups.length : 0,
			orgId: member.org_id,
		});
		return NextResponse.json(result);
	} catch (error) {
		logger.error("Get standups error", error as Error, { requestId });

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				createAPIError(
					"VALIDATION_ERROR",
					"Invalid request parameters",
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
}, "GET /api/standups");
