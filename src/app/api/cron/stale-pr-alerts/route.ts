import { NextResponse } from "next/server";
import { createStalePRAlertService } from "@/lib/modules/pr-radar/stale-pr-service";
import { createAPIError } from "@/lib/shared/api-error";
import { withMiddleware } from "@/lib/shared/middleware";

/**
 * Stale PR alert cron job endpoint
 * This endpoint is called by Vercel Cron hourly to detect and alert on stale PRs
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

			console.log("Starting stale PR alert cron job...");

			// Execute the cron job
			const alertService = createStalePRAlertService();
			const result = await alertService.executeStaleAlertJob();

			// Log the results
			console.log("Stale PR alert cron job completed:", {
				success: result.success,
				processed_orgs: result.processed_orgs,
				detected_stale_prs: result.detected_stale_prs,
				sent_alerts: result.sent_alerts,
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
					? "Stale PR alert job completed successfully"
					: "Stale PR alert job completed with errors",
				details: {
					processed_organizations: result.processed_orgs,
					detected_stale_prs: result.detected_stale_prs,
					sent_alerts: result.sent_alerts,
					execution_time_ms: result.execution_time_ms,
					errors: result.errors,
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Stale PR alert cron job failed:", error);

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
 * Health check endpoint for stale PR alert cron job
 */
export const GET = withMiddleware(
	async (context) => {
		try {
			// Check if job is currently locked/running
			const alertService = createStalePRAlertService();
			const isLocked = await alertService.isJobLocked();

			return NextResponse.json({
				status: "healthy",
				job_locked: isLocked,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Stale PR alert health check failed:", error);

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
