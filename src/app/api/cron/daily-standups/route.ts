import { NextResponse } from "next/server";
import { createAutoStandCronService } from "@/lib/modules/autostand/cron-service";
import { createAPIError } from "@/lib/shared/api-error";
import { withMiddleware } from "@/lib/shared/middleware";

/**
 * Daily standup generation cron job endpoint
 * This endpoint is called by Vercel Cron at 9am ET daily
 */
export const POST = withMiddleware(
	async (context) => {
		try {
			// Verify the request is from Vercel Cron
			const authHeader = context.req.headers.get("authorization");
			const expectedToken = process.env.CRON_SECRET;

			if (!expectedToken) {
				console.error("CRON_SECRET environment variable not set");
				return NextResponse.json(
					createAPIError("CONFIGURATION_ERROR", "Cron secret not configured"),
					{ status: 500 }
				);
			}

			if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
				return NextResponse.json(
					createAPIError("UNAUTHORIZED", "Invalid cron authorization"),
					{ status: 401 }
				);
			}

			console.log("Starting daily standup cron job...");

			// Execute the cron job
			const cronService = createAutoStandCronService();
			const result = await cronService.executeDailyStandupJob();

			// Log the results
			console.log("Daily standup cron job completed:", {
				success: result.success,
				processed_orgs: result.processed_orgs,
				processed_members: result.processed_members,
				generated_standups: result.generated_standups,
				sent_messages: result.sent_messages,
				execution_time_ms: result.execution_time_ms,
				error_count: result.errors.length,
			});

			if (result.errors.length > 0) {
				console.error("Cron job errors:", result.errors);
			}

			// Return success response with execution details
			return NextResponse.json({
				success: result.success,
				message: result.success
					? "Daily standup job completed successfully"
					: "Daily standup job completed with errors",
				details: {
					processed_organizations: result.processed_orgs,
					processed_members: result.processed_members,
					generated_standups: result.generated_standups,
					sent_messages: result.sent_messages,
					execution_time_ms: result.execution_time_ms,
					errors: result.errors,
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Daily standup cron job failed:", error);

			return NextResponse.json(
				createAPIError(
					"INTERNAL_ERROR",
					`Cron job execution failed: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				),
				{ status: 500 }
			);
		}
	},
	{ rateLimit: "cron" }
);

/**
 * Health check endpoint for cron job
 */
export const GET = withMiddleware(
	async (context) => {
		try {
			// Check if job is currently locked/running
			const cronService = createAutoStandCronService();
			const isLocked = await cronService.isJobLocked();

			return NextResponse.json({
				status: "healthy",
				job_locked: isLocked,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Cron health check failed:", error);

			return NextResponse.json(
				createAPIError(
					"INTERNAL_ERROR",
					`Health check failed: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				),
				{ status: 500 }
			);
		}
	},
	{ rateLimit: "cron" }
);
