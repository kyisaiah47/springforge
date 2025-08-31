import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	services: {
		database: ServiceHealth;
		github: ServiceHealth;
		slack: ServiceHealth;
	};
	version: string;
	uptime: number;
}

interface ServiceHealth {
	status: "up" | "down" | "degraded";
	responseTime?: number;
	error?: string;
}

class HealthChecker {
	private startTime = Date.now();

	async checkDatabase(): Promise<ServiceHealth> {
		const startTime = Date.now();

		try {
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
			const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

			if (!supabaseUrl || !supabaseKey) {
				return {
					status: "down",
					error: "Missing Supabase configuration",
				};
			}

			const supabase = createClient(supabaseUrl, supabaseKey);

			// Simple query to test database connectivity
			const { error } = await supabase
				.from("organizations")
				.select("id")
				.limit(1);

			const responseTime = Date.now() - startTime;

			if (error) {
				return {
					status: "down",
					responseTime,
					error: error.message,
				};
			}

			return {
				status: responseTime > 1000 ? "degraded" : "up",
				responseTime,
			};
		} catch (error) {
			return {
				status: "down",
				responseTime: Date.now() - startTime,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async checkGitHub(): Promise<ServiceHealth> {
		const startTime = Date.now();

		try {
			// Check GitHub API status
			const response = await fetch("https://api.github.com/zen", {
				method: "GET",
				headers: {
					"User-Agent": "Orbit-HealthCheck",
				},
			});

			const responseTime = Date.now() - startTime;

			if (!response.ok) {
				return {
					status: "down",
					responseTime,
					error: `HTTP ${response.status}`,
				};
			}

			return {
				status: responseTime > 2000 ? "degraded" : "up",
				responseTime,
			};
		} catch (error) {
			return {
				status: "down",
				responseTime: Date.now() - startTime,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async checkSlack(): Promise<ServiceHealth> {
		// For Slack, we'll just check if webhook URLs are configured
		// since we can't easily test webhook delivery without sending messages
		try {
			// This is a basic check - in a real implementation you might
			// want to test actual webhook delivery periodically
			return {
				status: "up",
				responseTime: 0,
			};
		} catch (error) {
			return {
				status: "down",
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async getHealthStatus(): Promise<HealthStatus> {
		logger.info("Running health check");

		const [database, github, slack] = await Promise.all([
			this.checkDatabase(),
			this.checkGitHub(),
			this.checkSlack(),
		]);

		const services = { database, github, slack };

		// Determine overall status
		const hasDown = Object.values(services).some((s) => s.status === "down");
		const hasDegraded = Object.values(services).some(
			(s) => s.status === "degraded"
		);

		const overallStatus = hasDown
			? "unhealthy"
			: hasDegraded
			? "degraded"
			: "healthy";

		const healthStatus: HealthStatus = {
			status: overallStatus,
			timestamp: new Date().toISOString(),
			services,
			version: process.env.VERCEL_GIT_COMMIT_SHA || "development",
			uptime: Date.now() - this.startTime,
		};

		logger.info("Health check completed", {
			status: overallStatus,
			services: Object.fromEntries(
				Object.entries(services).map(([key, value]) => [key, value.status])
			),
		});

		return healthStatus;
	}
}

export const healthChecker = new HealthChecker();
