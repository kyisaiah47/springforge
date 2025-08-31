import { createClient } from "@/lib/supabase/server";
import { createPRRadarService } from "./service";
import { createSlackService } from "@/lib/integrations/slack-service";
import type { PRAlertData } from "@/lib/integrations/slack-messages";
import type { StalePRAlert } from "./types";
import type { Database } from "@/lib/types/database";

/**
 * Result of stale PR alert execution
 */
export interface StalePRAlertResult {
	success: boolean;
	processed_orgs: number;
	detected_stale_prs: number;
	sent_alerts: number;
	execution_time_ms: number;
	errors: string[];
}

/**
 * Service for detecting and alerting on stale PRs
 */
export class StalePRAlertService {
	private async getSupabase() {
		return await createClient();
	}

	/**
	 * Execute stale PR detection and alerting for all organizations
	 */
	async executeStaleAlertJob(): Promise<StalePRAlertResult> {
		const startTime = Date.now();
		const result: StalePRAlertResult = {
			success: true,
			processed_orgs: 0,
			detected_stale_prs: 0,
			sent_alerts: 0,
			execution_time_ms: 0,
			errors: [],
		};

		try {
			// Check if job is already running
			const isLocked = await this.isJobLocked();
			if (isLocked) {
				throw new Error("Stale PR alert job is already running");
			}

			// Acquire job lock
			await this.acquireJobLock();

			try {
				const supabase = await this.getSupabase();

				// Get all organizations with Slack integrations
				const { data: organizations, error: orgError } = await supabase
					.from("organizations")
					.select(
						`
						id,
						name,
						settings,
						integrations!inner(
							id,
							type,
							access_token,
							settings
						)
					`
					)
					.eq("integrations.type", "slack")
					.is("deleted_at", null);

				if (orgError) {
					throw new Error(`Failed to fetch organizations: ${orgError.message}`);
				}

				if (!organizations || organizations.length === 0) {
					console.log("No organizations with Slack integrations found");
					return result;
				}

				// Process each organization
				for (const org of organizations) {
					try {
						await this.processOrganizationStaleAlerts(org, result);
						result.processed_orgs++;
					} catch (error) {
						const errorMsg = `Failed to process org ${org.name}: ${
							error instanceof Error ? error.message : "Unknown error"
						}`;
						result.errors.push(errorMsg);
						console.error(errorMsg);
						result.success = false;
					}
				}
			} finally {
				// Always release the job lock
				await this.releaseJobLock();
			}
		} catch (error) {
			const errorMsg = `Stale PR alert job failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;
			result.errors.push(errorMsg);
			result.success = false;
			console.error(errorMsg);
		}

		result.execution_time_ms = Date.now() - startTime;
		return result;
	}

	/**
	 * Process stale PR alerts for a single organization
	 */
	private async processOrganizationStaleAlerts(
		org: {
			id: string;
			name: string;
			integrations: Array<{
				id: string;
				type: string;
				access_token?: string;
				settings: Record<string, unknown>;
			}>;
		},
		result: StalePRAlertResult
	): Promise<void> {
		console.log(`Processing stale PR alerts for organization: ${org.name}`);

		const prRadarService = createPRRadarService();

		// Get stale PRs for this organization
		const stalePRs = await prRadarService.getStalePRs(org.id, {
			days_threshold: 2, // PRs older than 2 days
			exclude_draft: true,
		});

		if (stalePRs.stale_prs.length === 0) {
			console.log(`No stale PRs found for organization: ${org.name}`);
			return;
		}

		result.detected_stale_prs += stalePRs.stale_prs.length;

		// Find Slack integration for this org
		const slackIntegration = org.integrations.find(
			(integration) => integration.type === "slack"
		);

		if (!slackIntegration) {
			console.warn(`No Slack integration found for organization: ${org.name}`);
			return;
		}

		// Create Slack service
		const slackService = createSlackService({
			...slackIntegration,
			org_id: org.id,
			type: slackIntegration.type as "slack",
			access_token: slackIntegration.access_token || null,
			settings: slackIntegration.settings as any,
			created_at: new Date().toISOString(),
			deleted_at: null,
		});

		// Group stale PRs by severity
		const criticalPRs = stalePRs.stale_prs.filter(
			(pr) => pr.alert_level === "critical"
		);
		const warningPRs = stalePRs.stale_prs.filter(
			(pr) => pr.alert_level === "warning"
		);

		// Send alerts for critical PRs (individual alerts)
		for (const stalePR of criticalPRs) {
			try {
				const alertData = this.formatPRAlertData(stalePR);
				await slackService.sendPRAlert(alertData);
				result.sent_alerts++;

				// Add small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (error) {
				const errorMsg = `Failed to send critical PR alert for ${
					stalePR.pr_insight.repo
				}#${stalePR.pr_insight.number}: ${
					error instanceof Error ? error.message : "Unknown error"
				}`;
				result.errors.push(errorMsg);
				console.error(errorMsg);
			}
		}

		// Send summary alert for warning PRs if there are any
		if (warningPRs.length > 0) {
			try {
				await this.sendStalePRSummary(slackService, warningPRs, org.name);
				result.sent_alerts++;
			} catch (error) {
				const errorMsg = `Failed to send stale PR summary for ${org.name}: ${
					error instanceof Error ? error.message : "Unknown error"
				}`;
				result.errors.push(errorMsg);
				console.error(errorMsg);
			}
		}

		console.log(
			`Processed ${stalePRs.stale_prs.length} stale PRs for ${org.name}: ${criticalPRs.length} critical, ${warningPRs.length} warnings`
		);
	}

	/**
	 * Format stale PR data for Slack alert
	 */
	private formatPRAlertData(stalePR: StalePRAlert): PRAlertData {
		const pr = stalePR.pr_insight;

		return {
			repo: pr.repo,
			number: pr.number,
			title: `Stale PR - ${stalePR.days_stale} days old`,
			author: "Unknown", // We don't have author info in the basic PRInsight
			url: `https://github.com/${pr.repo}/pull/${pr.number}`,
			risk_score: pr.risk_score,
			size_score: pr.size_score,
			days_open: stalePR.days_stale,
			suggested_reviewers: pr.suggested_reviewers,
			is_stale: true,
		};
	}

	/**
	 * Send summary alert for multiple stale PRs
	 */
	private async sendStalePRSummary(
		slackService: {
			getClient: () => {
				sendWebhookMessage: (message: any) => Promise<void>;
			};
		},
		stalePRs: StalePRAlert[],
		orgName: string
	): Promise<void> {
		const prList = stalePRs
			.slice(0, 10) // Limit to 10 PRs to avoid message length issues
			.map((stalePR) => {
				const pr = stalePR.pr_insight;
				return `• <https://github.com/${pr.repo}/pull/${pr.number}|${pr.repo}#${pr.number}> - ${stalePR.days_stale} days old`;
			})
			.join("\n");

		const moreCount = stalePRs.length > 10 ? stalePRs.length - 10 : 0;
		const moreText = moreCount > 0 ? `\n... and ${moreCount} more` : "";

		const message = {
			text: `⏰ Stale PR Summary for ${orgName}`,
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: `⏰ Stale PR Summary - ${orgName}`,
						emoji: true,
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `Found ${stalePRs.length} stale PRs that need attention:`,
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: prList + moreText,
					},
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: "💡 *Tip:* PRs are considered stale after 2 days without activity. Critical alerts are sent for PRs older than 7 days.",
						},
					],
				},
			],
			username: "Orbit PR Radar",
			icon_emoji: ":hourglass_flowing_sand:",
		};

		await slackService.getClient().sendWebhookMessage(message);
	}

	/**
	 * Check if stale PR alert job is currently locked/running
	 */
	async isJobLocked(): Promise<boolean> {
		const supabase = await this.getSupabase();
		const { data, error } = await supabase
			.from("job_locks")
			.select("*")
			.eq("job_name", "stale_pr_alerts")
			.eq("is_locked", true)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 is "not found" error, which is expected when no lock exists
			throw new Error(`Failed to check job lock: ${error.message}`);
		}

		if (!data) {
			return false;
		}

		// Check if lock is expired (older than 1 hour)
		const lockTime = new Date(data.locked_at);
		const now = new Date();
		const hourInMs = 60 * 60 * 1000;

		if (now.getTime() - lockTime.getTime() > hourInMs) {
			// Lock is expired, release it
			await this.releaseJobLock();
			return false;
		}

		return true;
	}

	/**
	 * Acquire job lock to prevent concurrent execution
	 */
	private async acquireJobLock(): Promise<void> {
		const supabase = await this.getSupabase();
		const { error } = await supabase.from("job_locks").upsert(
			{
				job_name: "stale_pr_alerts",
				is_locked: true,
				locked_at: new Date().toISOString(),
			},
			{
				onConflict: "job_name",
			}
		);

		if (error) {
			throw new Error(`Failed to acquire job lock: ${error.message}`);
		}
	}

	/**
	 * Release job lock
	 */
	private async releaseJobLock(): Promise<void> {
		const supabase = await this.getSupabase();
		const { error } = await supabase
			.from("job_locks")
			.update({
				is_locked: false,
				locked_at: new Date().toISOString(),
			})
			.eq("job_name", "stale_pr_alerts");

		if (error) {
			console.error(`Failed to release job lock: ${error.message}`);
		}
	}
}

/**
 * Create stale PR alert service instance
 */
export function createStalePRAlertService(): StalePRAlertService {
	return new StalePRAlertService();
}
