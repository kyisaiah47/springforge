import { NextResponse } from "next/server";
import { healthChecker } from "@/lib/monitoring/health-check";
import { logger } from "@/lib/monitoring/logger";

export async function GET() {
	try {
		const healthStatus = await healthChecker.getHealthStatus();

		// Return appropriate HTTP status based on health
		const httpStatus =
			healthStatus.status === "healthy"
				? 200
				: healthStatus.status === "degraded"
				? 200
				: 503;

		return NextResponse.json(healthStatus, { status: httpStatus });
	} catch (error) {
		logger.error("Health check endpoint failed", error as Error);

		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: "Health check failed",
			},
			{ status: 503 }
		);
	}
}
