import { createClient } from "@/lib/supabase/server";
import { createAutoStandService } from "./service";
import { createSlackService } from "@/lib/integrations/slack-service";
import type { StandupData } from "@/lib/integrations/slack-messages";
import type { Database } from "@/lib/types/database";
import type { JobExecutionResult } from "./types";

/**
 * Cron service for automated standup generation
 */
export class AutoStandCronService {
	private readonly JOB_NAME = "daily_standup_generation";
	private readonly LOCK_DURATION_MINUTES = 60;
	private readonly MAX_RETRIES = 3;
	private readonly RETRY_DELAY_MS = 5000;

	private async getSupabase() {
		return await createClient();
	}

	/**
	 * Execute daily standup generation job
	 */
	async executeDailyStandupJob(): Promise<JobExecutionResult> {
		const startTime = Date.now();
		const lockId = `cron-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		const result: JobExecutionResult = {
			success: false,
			processed_orgs: 0,
			processed_members: 0,
			generated_standups: 0,
			sent_messages: 0,
			errors: [],
			execution_time_ms: 0,
		};

		try {
			// Acquire job lock
			const lockAcquired = await this.acquireJobLock(lockId);
			if (!lockAcquired) {
				result.errors.push("Job is already running or locked");
				return result;
			}

			try {
				// Execute the job
				await this.executeJob(result);
				result.success = result.errors.length === 0;
			} finally {
				// Always release the lock
				await this.releaseJobLock(lockId);
			}
		} catch (error) {
			result.errors.push(
				`Job execution failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			result.execution_time_ms = Date.now() - startTime;
		}

		return result;
	}

	/**
	 * Execute the main job logic
	 */
	private async executeJob(result: JobExecutionResult): Promise<void> {
		const supabase = await this.getSupabase();

		// Get all active organizations with Slack integrations
		const { data: organizations, error: orgsError } = await supabase
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
			.is("deleted_at", null)
			.is("integrations.deleted_at", null);

		if (orgsError) {
			result.errors.push(`Failed to fetch organizations: ${orgsError.message}`);
			return;
		}

		if (!organizations || organizations.length === 0) {
			result.errors.push("No organizations with Slack integrations found");
			return;
		}

		result.processed_orgs = organizations.length;

		// Process each organization
		for (const org of organizations) {
			try {
				await this.processOrganization(org as any, result);
			} catch (error) {
				result.errors.push(
					`Failed to process organization ${org.name}: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				);
			}
		}
	}

	/**
	 * Process standup generation for a single organization
	 */
	private async processOrganization(
		org: Database["public"]["Tables"]["organizations"]["Row"] & {
			integrations: Database["public"]["Tables"]["integrations"]["Row"][];
		},
		result: JobExecutionResult
	): Promise<void> {
		const supabase = await this.getSupabase();

		// Get all active members with GitHub logins
		const { data: members, error: membersError } = await supabase
			.from("members")
			.select("*")
			.eq("org_id", org.id)
			.is("deleted_at", null)
			.not("github_login", "is", null);

		if (membersError) {
			result.errors.push(
				`Failed to fetch members for ${org.name}: ${membersError.message}`
			);
			return;
		}

		if (!members || members.length === 0) {
			result.errors.push(`No members with GitHub logins found for ${org.name}`);
			return;
		}

		result.processed_members += members.length;

		// Get GitHub integration
		const githubIntegration = await this.getGitHubIntegration(org.id);
		if (!githubIntegration) {
			result.errors.push(`No GitHub integration found for ${org.name}`);
			return;
		}

		// Get Slack integration
		const slackIntegration = org.integrations.find((i) => i.type === "slack");
		if (!slackIntegration) {
			result.errors.push(`No Slack integration found for ${org.name}`);
			return;
		}

		// Generate standups for all members
		const autoStandService = createAutoStandService();
		const standupData: StandupData[] = [];
		const today = new Date().toISOString().split("T")[0];

		for (const member of members) {
			try {
				const standupResult = await this.generateStandupWithRetry(
					autoStandService,
					org.id,
					member.id,
					today
				);

				if (standupResult.generated) {
					result.generated_standups++;

					// Convert to Slack message format
					const slackData: StandupData = {
						member: {
							name: member.github_login || member.email.split("@")[0],
							avatar_url: member.avatar_url || undefined,
							github_login: member.github_login || undefined,
						},
						date: today,
						yesterday: standupResult.standup.yesterday,
						today: standupResult.standup.today,
						blockers: standupResult.standup.blockers,
						github_activity: this.extractGitHubActivity(
							standupResult.standup.raw_github_data
						),
					};

					standupData.push(slackData);
				}
			} catch (error) {
				result.errors.push(
					`Failed to generate standup for ${
						member.github_login || member.email
					}: ${error instanceof Error ? error.message : "Unknown error"}`
				);
			}
		}

		// Send standups to Slack if any were generated
		if (standupData.length > 0) {
			try {
				const slackResult = await this.sendStandupsToSlack(
					slackIntegration,
					standupData,
					org.name
				);
				result.sent_messages += slackResult.sent;
				result.errors.push(...slackResult.errors);
			} catch (error) {
				result.errors.push(
					`Failed to send standups to Slack for ${org.name}: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				);
			}
		}
	}

	/**
	 * Generate standup with retry logic
	 */
	private async generateStandupWithRetry(
		service: ReturnType<typeof createAutoStandService>,
		orgId: string,
		memberId: string,
		date: string,
		attempt = 1
	): Promise<any> {
		try {
			return await service.generateStandup(orgId, {
				member_id: memberId,
				date,
			});
		} catch (error) {
			if (attempt < this.MAX_RETRIES) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.RETRY_DELAY_MS * attempt)
				);
				return this.generateStandupWithRetry(
					service,
					orgId,
					memberId,
					date,
					attempt + 1
				);
			}
			throw error;
		}
	}

	/**
	 * Send standups to Slack with batch processing
	 */
	private async sendStandupsToSlack(
		slackIntegration: Database["public"]["Tables"]["integrations"]["Row"],
		standupData: StandupData[],
		teamName: string
	): Promise<{ sent: number; errors: string[] }> {
		const slackService = createSlackService(slackIntegration);

		return await slackService.sendBatchStandups(standupData, {
			delay_ms: 1000, // 1 second delay between messages
			send_summary: true,
			team_name: teamName,
		});
	}

	/**
	 * Extract GitHub activity metrics from raw data
	 */
	private extractGitHubActivity(rawData: any): StandupData["github_activity"] {
		if (!rawData || typeof rawData !== "object") {
			return undefined;
		}

		const commits = Array.isArray(rawData.commits) ? rawData.commits.length : 0;
		const pullRequests = Array.isArray(rawData.pullRequests)
			? rawData.pullRequests
			: [];
		const issues = Array.isArray(rawData.issues) ? rawData.issues.length : 0;

		const prsOpened = pullRequests.filter(
			(pr: any) => pr.state === "open"
		).length;
		const prsMerged = pullRequests.filter(
			(pr: any) => pr.state === "merged"
		).length;

		return {
			commits,
			prs_opened: prsOpened,
			prs_merged: prsMerged,
			issues_worked: issues,
		};
	}

	/**
	 * Get GitHub integration for organization
	 */
	private async getGitHubIntegration(
		orgId: string
	): Promise<Database["public"]["Tables"]["integrations"]["Row"] | null> {
		const supabase = await this.getSupabase();

		const { data, error } = await supabase
			.from("integrations")
			.select("*")
			.eq("org_id", orgId)
			.eq("type", "github")
			.is("deleted_at", null)
			.single();

		if (error || !data) {
			return null;
		}

		return data;
	}

	/**
	 * Acquire job lock to prevent duplicate executions
	 */
	private async acquireJobLock(lockId: string): Promise<boolean> {
		const supabase = await this.getSupabase();

		const { data, error } = await supabase.rpc("acquire_job_lock", {
			p_job_name: this.JOB_NAME,
			p_locked_by: lockId,
			p_duration_minutes: this.LOCK_DURATION_MINUTES,
		});

		if (error) {
			console.error("Failed to acquire job lock:", error);
			return false;
		}

		return data === true;
	}

	/**
	 * Release job lock
	 */
	private async releaseJobLock(lockId: string): Promise<boolean> {
		const supabase = await this.getSupabase();

		const { data, error } = await supabase.rpc("release_job_lock", {
			p_job_name: this.JOB_NAME,
			p_locked_by: lockId,
		});

		if (error) {
			console.error("Failed to release job lock:", error);
			return false;
		}

		return data === true;
	}

	/**
	 * Check if job is currently locked
	 */
	async isJobLocked(): Promise<boolean> {
		const supabase = await this.getSupabase();

		const { data, error } = await supabase.rpc("is_job_locked", {
			p_job_name: this.JOB_NAME,
		});

		if (error) {
			console.error("Failed to check job lock:", error);
			return true; // Assume locked on error for safety
		}

		return data === true;
	}
}

/**
 * Create AutoStand cron service instance
 */
export function createAutoStandCronService(): AutoStandCronService {
	return new AutoStandCronService();
}
