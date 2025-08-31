import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPRRadarService } from "@/lib/modules/pr-radar/service";
import { createAPIError } from "@/lib/shared/api-error";

const getReviewerSuggestionsSchema = z.object({
	touched_paths: z.string().optional(), // Comma-separated list of file paths
	author_github_login: z.string().optional(),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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

		// Get PR insight to verify access and get data
		const prRadarService = createPRRadarService();
		const prInsight = await prRadarService.getPRInsightById(
			member.org_id,
			params.id
		);

		// Parse query parameters
		const { searchParams } = new URL(request.url);
		const queryParams = Object.fromEntries(searchParams.entries());
		const validatedParams = getReviewerSuggestionsSchema.parse(queryParams);

		// Use touched paths from query params or PR insight
		const touchedPaths = validatedParams.touched_paths
			? validatedParams.touched_paths.split(",").map((path) => path.trim())
			: prInsight.touched_paths;

		// Use author from query params or try to get from PR insight
		let authorGithubLogin = validatedParams.author_github_login;
		if (!authorGithubLogin && prInsight.author_member_id) {
			const { data: authorMember } = await supabase
				.from("members")
				.select("github_login")
				.eq("id", prInsight.author_member_id)
				.single();

			authorGithubLogin = authorMember?.github_login || "";
		}

		// Get reviewer suggestions
		const result = await prRadarService.getReviewerSuggestions(member.org_id, {
			repo: prInsight.repo,
			number: prInsight.number,
			touched_paths: touchedPaths,
			author_github_login: authorGithubLogin || "",
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Get reviewer suggestions error:", error);

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
			if (error.message.includes("not found")) {
				return NextResponse.json(
					createAPIError("NOT_FOUND", "PR insight not found"),
					{ status: 404 }
				);
			}

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
