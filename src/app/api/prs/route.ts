import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPRRadarService } from "@/lib/modules/pr-radar/service";
import { createAPIError } from "@/lib/shared/api-error";

const getPRInsightsSchema = z.object({
	status: z.enum(["open", "merged", "closed"]).optional(),
	repo: z.string().optional(),
	author_member_id: z.string().uuid().optional(),
	risk_min: z.coerce.number().min(0).max(10).optional(),
	risk_max: z.coerce.number().min(0).max(10).optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	cursor: z.string().optional(),
	order_by: z
		.enum(["opened_at", "updated_at", "risk_score", "size_score"])
		.default("updated_at"),
	order_dir: z.enum(["asc", "desc"]).default("desc"),
});

const createPRInsightSchema = z.object({
	repo: z.string().min(1),
	number: z.number().int().positive(),
	github_data: z.object({
		number: z.number(),
		title: z.string(),
		body: z.string(),
		state: z.enum(["open", "closed"]),
		merged: z.boolean(),
		additions: z.number(),
		deletions: z.number(),
		changed_files: z.number(),
		commits: z.number(),
		author: z.object({
			login: z.string(),
			id: z.number(),
		}),
		base: z.object({
			ref: z.string(),
			repo: z.object({
				name: z.string(),
				full_name: z.string(),
			}),
		}),
		head: z.object({
			ref: z.string(),
		}),
		created_at: z.string(),
		updated_at: z.string(),
		merged_at: z.string().nullable(),
		files: z
			.array(
				z.object({
					filename: z.string(),
					status: z.enum(["added", "removed", "modified", "renamed"]),
					additions: z.number(),
					deletions: z.number(),
					changes: z.number(),
					patch: z.string().optional(),
				})
			)
			.optional(),
	}),
});

export async function GET(request: NextRequest) {
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
		const validatedParams = getPRInsightsSchema.parse(queryParams);

		// If author_member_id is specified, verify it belongs to same organization
		if (validatedParams.author_member_id) {
			const { data: targetMember, error: targetMemberError } = await supabase
				.from("members")
				.select("org_id")
				.eq("id", validatedParams.author_member_id)
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
						"Cannot access PRs for member in different organization"
					),
					{ status: 403 }
				);
			}
		}

		// Get PR insights
		const prRadarService = createPRRadarService();
		const result = await prRadarService.getPRInsights(
			member.org_id,
			validatedParams
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Get PR insights error:", error);

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
				{ status: 500 }
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
}

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
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = createPRInsightSchema.parse(body);

		// Create PR insight
		const prRadarService = createPRRadarService();
		const result = await prRadarService.createPRInsight(
			member.org_id,
			validatedData
		);

		return NextResponse.json(result, { status: result.created ? 201 : 200 });
	} catch (error) {
		console.error("Create PR insight error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				createAPIError(
					"VALIDATION_ERROR",
					"Invalid request body",
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
}
