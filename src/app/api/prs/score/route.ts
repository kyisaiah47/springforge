import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPRRadarService } from "@/lib/modules/pr-radar/service";
import { createAPIError } from "@/lib/shared/api-error";

const scorePRSchema = z.object({
	repo: z.string().min(1),
	number: z.number().int().positive(),
	github_data: z
		.object({
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
		})
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
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = scorePRSchema.parse(body);

		// Score the PR
		const prRadarService = createPRRadarService();
		const result = await prRadarService.scorePR(member.org_id, validatedData);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Score PR error:", error);

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
