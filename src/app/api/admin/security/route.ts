import { NextRequest } from "next/server";
import { withMiddleware, createSuccessResponse } from "@/lib/shared/middleware";
import { securityAuditor } from "@/lib/monitoring/security-audit";

export const GET = withMiddleware(
	async (context) => {
		// Get security metrics and report
		const metrics = securityAuditor.getMetrics();
		const report = securityAuditor.generateSecurityReport();

		return createSuccessResponse({
			metrics,
			report,
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
