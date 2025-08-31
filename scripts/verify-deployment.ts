#!/usr/bin/env tsx

/**
 * Deployment verification script
 * Checks that all critical components are ready for deployment
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface CheckResult {
	name: string;
	status: "pass" | "fail" | "warn";
	message: string;
}

class DeploymentChecker {
	private results: CheckResult[] = [];

	private addResult(
		name: string,
		status: CheckResult["status"],
		message: string
	) {
		this.results.push({ name, status, message });
	}

	private checkFile(path: string, description: string): boolean {
		if (existsSync(path)) {
			this.addResult(description, "pass", `Found: ${path}`);
			return true;
		} else {
			this.addResult(description, "fail", `Missing: ${path}`);
			return false;
		}
	}

	private checkEnvironmentExample(): void {
		const envPath = ".env.local.example";
		if (!this.checkFile(envPath, "Environment example")) return;

		try {
			const content = readFileSync(envPath, "utf-8");
			const requiredVars = [
				"NEXT_PUBLIC_SUPABASE_URL",
				"NEXT_PUBLIC_SUPABASE_ANON_KEY",
				"SUPABASE_SERVICE_ROLE_KEY",
				"NEXTAUTH_SECRET",
			];

			const missingVars = requiredVars.filter(
				(varName) => !content.includes(varName)
			);

			if (missingVars.length === 0) {
				this.addResult(
					"Environment variables",
					"pass",
					"All required variables documented"
				);
			} else {
				this.addResult(
					"Environment variables",
					"fail",
					`Missing: ${missingVars.join(", ")}`
				);
			}
		} catch (error) {
			this.addResult(
				"Environment variables",
				"fail",
				"Could not read .env.local.example"
			);
		}
	}

	private checkPackageJson(): void {
		const packagePath = "package.json";
		if (!this.checkFile(packagePath, "Package.json")) return;

		try {
			const content = JSON.parse(readFileSync(packagePath, "utf-8"));

			// Check required scripts
			const requiredScripts = [
				"build",
				"start",
				"lint",
				"test:run",
				"db:migrate",
			];
			const missingScripts = requiredScripts.filter(
				(script) => !content.scripts?.[script]
			);

			if (missingScripts.length === 0) {
				this.addResult(
					"Package scripts",
					"pass",
					"All required scripts present"
				);
			} else {
				this.addResult(
					"Package scripts",
					"fail",
					`Missing scripts: ${missingScripts.join(", ")}`
				);
			}

			// Check dependencies
			const requiredDeps = ["next", "react", "@supabase/supabase-js"];
			const missingDeps = requiredDeps.filter(
				(dep) => !content.dependencies?.[dep] && !content.devDependencies?.[dep]
			);

			if (missingDeps.length === 0) {
				this.addResult("Dependencies", "pass", "Core dependencies present");
			} else {
				this.addResult(
					"Dependencies",
					"fail",
					`Missing: ${missingDeps.join(", ")}`
				);
			}
		} catch (error) {
			this.addResult("Package.json", "fail", "Could not parse package.json");
		}
	}

	private checkVercelConfig(): void {
		const vercelPath = "vercel.json";
		if (!this.checkFile(vercelPath, "Vercel configuration")) return;

		try {
			const content = JSON.parse(readFileSync(vercelPath, "utf-8"));

			if (content.crons && Array.isArray(content.crons)) {
				this.addResult(
					"Vercel crons",
					"pass",
					`${content.crons.length} cron jobs configured`
				);
			} else {
				this.addResult("Vercel crons", "warn", "No cron jobs configured");
			}

			if (content.env) {
				this.addResult(
					"Vercel env config",
					"pass",
					"Environment variables configured"
				);
			} else {
				this.addResult(
					"Vercel env config",
					"warn",
					"No environment variables in vercel.json"
				);
			}

			if (content.headers) {
				this.addResult(
					"Security headers",
					"pass",
					"Security headers configured"
				);
			} else {
				this.addResult(
					"Security headers",
					"warn",
					"No security headers configured"
				);
			}
		} catch (error) {
			this.addResult("Vercel config", "fail", "Could not parse vercel.json");
		}
	}

	private checkGitHubActions(): void {
		const ciPath = ".github/workflows/ci.yml";
		const deployPath = ".github/workflows/deploy.yml";

		this.checkFile(ciPath, "CI workflow");
		this.checkFile(deployPath, "Deploy workflow");
	}

	private checkMigrations(): void {
		const migrationsDir = "supabase/migrations";
		if (!existsSync(migrationsDir)) {
			this.addResult(
				"Database migrations",
				"fail",
				"Migrations directory not found"
			);
			return;
		}

		const migrationScript = "scripts/run-migrations.ts";
		if (this.checkFile(migrationScript, "Migration script")) {
			this.addResult("Database setup", "pass", "Migration system ready");
		}
	}

	private checkMonitoring(): void {
		const healthEndpoint = "src/app/api/health/route.ts";
		const logger = "src/lib/monitoring/logger.ts";
		const errorBoundary = "src/lib/monitoring/error-boundary.tsx";

		this.checkFile(healthEndpoint, "Health check endpoint");
		this.checkFile(logger, "Logging system");
		this.checkFile(errorBoundary, "Error boundary");
	}

	private checkDocumentation(): void {
		this.checkFile("README.md", "README documentation");
		this.checkFile("DEPLOYMENT.md", "Deployment guide");
	}

	public async runAllChecks(): Promise<void> {
		console.log("🚀 SprintForge Deployment Verification\n");

		this.checkEnvironmentExample();
		this.checkPackageJson();
		this.checkVercelConfig();
		this.checkGitHubActions();
		this.checkMigrations();
		this.checkMonitoring();
		this.checkDocumentation();

		// Print results
		console.log("📋 Verification Results:\n");

		const passed = this.results.filter((r) => r.status === "pass").length;
		const failed = this.results.filter((r) => r.status === "fail").length;
		const warnings = this.results.filter((r) => r.status === "warn").length;

		this.results.forEach((result) => {
			const icon =
				result.status === "pass"
					? "✅"
					: result.status === "fail"
					? "❌"
					: "⚠️";
			console.log(`${icon} ${result.name}: ${result.message}`);
		});

		console.log(
			`\n📊 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings\n`
		);

		if (failed > 0) {
			console.log(
				"❌ Deployment verification failed. Please fix the issues above."
			);
			process.exit(1);
		} else if (warnings > 0) {
			console.log(
				"⚠️  Deployment verification passed with warnings. Review warnings before deploying."
			);
		} else {
			console.log("✅ Deployment verification passed! Ready to deploy.");
		}

		console.log("\n🎯 Next steps:");
		console.log("1. Set environment variables in Vercel dashboard");
		console.log("2. Run database migrations in production");
		console.log("3. Test the deployment with /api/health endpoint");
		console.log("4. Monitor logs and error tracking");
	}
}

// Run verification if this script is executed directly
if (require.main === module) {
	const checker = new DeploymentChecker();
	checker.runAllChecks().catch((error) => {
		console.error("❌ Verification failed:", error);
		process.exit(1);
	});
}
