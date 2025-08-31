import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAutoStandCronService } from "@/lib/modules/autostand/cron-service";
import { createAPIError } from "@/lib/shared/api-error";

const triggerSchema = z.object({
	force: z.boolean().default(false),
});

/**
 * Manual trigger for daily standup generation
 * This endpoint allows admins to manually trigger the daily standup job
 */
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

		// Check if user is admin
		const { data: member, error: memberError } = await supabase
			.from("members")
			.select("role, org_id")
			.eq("email", user.email!)
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		if (member.role !== "admin") {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "Admin access required"),
				{ status: 403 }
			);
		}

		// Parse request body
		const body = await request.json().catch(() => ({}));
		const { force } = triggerSchema.parse(body);

		console.log(
			`Manual standup trigger initiated by ${user.email} (force: ${force})`
		);

		// Check if job is already running (unless forced)
		const cronService = createAutoStandCronService();
		if (!force) {
			const isLocked = await cronService.isJobLocked();
			if (isLocked) {
				return NextResponse.json(
					createAPIError(
						"CONFLICT",
						"Daily standup job is already running. Use force=true to override."
					),
					{ status: 409 }
				);
			}
		}

		// Execute the cron job
		const result = await cronService.executeDailyStandupJob();

		// Log the results
		console.log("Manual standup trigger completed:", {
			success: result.success,
			processed_orgs: result.processed_orgs,
			processed_members: result.processed_members,
			generated_standups: result.generated_standups,
			sent_messages: result.sent_messages,
			execution_time_ms: result.execution_time_ms,
			error_count: result.errors.length,
		});

		if (result.errors.length > 0) {
			console.error("Manual trigger errors:", result.errors);
		}

		// Return detailed response
		return NextResponse.json({
			success: result.success,
			message: result.success
				? "Daily standup job triggered successfully"
				: "Daily standup job completed with errors",
			details: {
				processed_organizations: result.processed_orgs,
				processed_members: result.processed_members,
				generated_standups: result.generated_standups,
				sent_messages: result.sent_messages,
				execution_time_ms: result.execution_time_ms,
				errors: result.errors,
			},
			triggered_by: user.email,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Manual standup trigger failed:", error);

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

		return NextResponse.json(
			createAPIError(
				"INTERNAL_ERROR",
				`Manual trigger failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			),
			{ status: 500 }
		);
	}
}
