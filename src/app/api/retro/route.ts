import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { retroService } from "@/lib/modules/retro";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const getRetrosSchema = z.object({
	status: z
		.enum(["planning", "active", "voting", "completed", "archived"])
		.optional(),
	created_by: z.string().uuid().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	cursor: z.string().optional(),
	order_by: z.enum(["created_at", "title", "status"]).default("created_at"),
	order_dir: z.enum(["asc", "desc"]).default("desc"),
});

const createRetroSchema = z.object({
	title: z.string().min(1).max(200),
	sprint: z.string().max(100).optional(),
});

export const GET = withMonitoring(async function GET(request: NextRequest) {
	const requestId = generateRequestId();
	logger.info("GET /api/retro", { requestId });

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

		// Parse and validate query parameters
		const { searchParams } = new URL(request.url);
		const queryParams = Object.fromEntries(searchParams.entries());
		const validatedParams = getRetrosSchema.parse(queryParams);

		// If created_by is specified, verify it belongs to same organization
		if (validatedParams.created_by) {
			const { data: targetMember, error: targetMemberError } = await supabase
				.from("members")
				.select("org_id")
				.eq("id", validatedParams.created_by)
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
						"Cannot access retros for member in different organization"
					),
					{ status: 403 }
				);
			}
		}

		// Get retros
		const result = await retroService.getRetros(member.org_id, validatedParams);

		logger.info("Retros retrieved successfully", {
			requestId,
			count: result.retros.length,
			orgId: member.org_id,
		});
		return NextResponse.json(result);
	} catch (error) {
		logger.error("Get retros error", error as Error, { requestId });

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
}, "GET /api/retro");

export const POST = withMonitoring(async function POST(request: NextRequest) {
	const requestId = generateRequestId();
	logger.info("POST /api/retro", { requestId });

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

		// Parse and validate request body
		const body = await request.json();
		const validatedData = createRetroSchema.parse(body);

		// Create retro
		const retro = await retroService.createRetro(
			member.org_id,
			member.id,
			validatedData
		);

		logger.info("Retro created successfully", {
			requestId,
			retroId: retro.id,
			orgId: member.org_id,
		});
		return NextResponse.json(retro, { status: 201 });
	} catch (error) {
		logger.error("Create retro error", error as Error, { requestId });

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
}, "POST /api/retro");
