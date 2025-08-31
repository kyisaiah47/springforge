import { NextRequest } from "next/server";
import { withMiddleware, createSuccessResponse } from "@/lib/shared/middleware";
import { performanceMonitor } from "@/lib/monitoring/performance";

export const GET = withMiddleware(
	async (context) => {
		const stats = performanceMonitor.getPerformanceStats();
		const slowOperations = performanceMonitor.getSlowOperations(20);
		const slowQueries = performanceMonitor.getSlowQueries(20);

		return createSuccessResponse({
			stats,
			slow_operations: slowOperations,
			slow_queries: slowQueries,
			timestamp: new Date().toISOString(),
		});
	},
	{
		requireAuth: true,
		requireRole: "admin",
		rateLimit: "strict",
		allowedMethods: ["GET"],
		logRequests: true,
	}
);
