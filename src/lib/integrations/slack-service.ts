import { SlackClient, createSlackClient } from "./slack";
import {
	formatStandupMessage,
	formatTeamStandupSummary,
	formatPRAlertMessage,
	formatSimpleMessage,
	formatErrorMessage,
	type StandupData,
	type TeamStandupData,
	type PRAlertData,
} from "./slack-messages";
import type { Database } from "@/lib/types/database";

/**
 * High-level Slack service that combines client with message formatting
 */
export class SlackService {
	private client: SlackClient;

	constructor(
		integration: Database["public"]["Tables"]["integrations"]["Row"]
	) {
		this.client = createSlackClient(integration);
	}

	/**
	 * Get Slack client for direct API access
	 */
	getClient(): SlackClient {
		return this.client;
	}

	/**
	 * Send individual standup message
	 */
	async sendStandupMessage(data: StandupData, channel?: string): Promise<void> {
		const message = formatStandupMessage(data);

		if (channel) {
			await this.client.sendBotMessage(channel, message);
		} else {
			await this.client.sendWebhookMessage(message);
		}
	}

	/**
	 * Send team standup summary
	 */
	async sendTeamStandupSummary(
		data: TeamStandupData,
		channel?: string
	): Promise<void> {
		const message = formatTeamStandupSummary(data);

		if (channel) {
			await this.client.sendBotMessage(channel, message);
		} else {
			await this.client.sendWebhookMessage(message);
		}
	}

	/**
	 * Send PR alert for high-risk or stale PRs
	 */
	async sendPRAlert(data: PRAlertData, channel?: string): Promise<void> {
		const message = formatPRAlertMessage(data);

		if (channel) {
			await this.client.sendBotMessage(channel, message);
		} else {
			await this.client.sendWebhookMessage(message);
		}
	}

	/**
	 * Send simple notification message
	 */
	async sendNotification(
		text: string,
		options?: {
			channel?: string;
			emoji?: string;
			username?: string;
			color?: string;
		}
	): Promise<void> {
		const message = formatSimpleMessage(text, {
			emoji: options?.emoji,
			username: options?.username,
			color: options?.color,
		});

		if (options?.channel) {
			await this.client.sendBotMessage(options.channel, message);
		} else {
			await this.client.sendWebhookMessage(message);
		}
	}

	/**
	 * Send error notification
	 */
	async sendErrorNotification(
		error: string,
		context?: string,
		channel?: string
	): Promise<void> {
		const message = formatErrorMessage(error, context);

		if (channel) {
			await this.client.sendBotMessage(channel, message);
		} else {
			await this.client.sendWebhookMessage(message);
		}
	}

	/**
	 * Test Slack integration connectivity
	 */
	async testConnection(): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const success = await this.client.testWebhook();
			if (success) {
				return { success: true };
			} else {
				return {
					success: false,
					error: "Webhook test returned false",
				};
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Send batch of standup messages
	 */
	async sendBatchStandups(
		standups: StandupData[],
		options?: {
			channel?: string;
			delay_ms?: number;
			send_summary?: boolean;
			team_name?: string;
		}
	): Promise<{
		sent: number;
		failed: number;
		errors: string[];
	}> {
		const results = {
			sent: 0,
			failed: 0,
			errors: [] as string[],
		};

		// Send individual standups
		for (const standup of standups) {
			try {
				await this.sendStandupMessage(standup, options?.channel);
				results.sent++;

				// Add delay between messages to avoid rate limiting
				if (options?.delay_ms && options.delay_ms > 0) {
					await new Promise((resolve) => setTimeout(resolve, options.delay_ms));
				}
			} catch (error) {
				results.failed++;
				results.errors.push(
					`Failed to send standup for ${standup.member.name}: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				);
			}
		}

		// Send team summary if requested
		if (options?.send_summary && options?.team_name && standups.length > 0) {
			try {
				const summary: TeamStandupData = {
					date: standups[0].date,
					team_name: options.team_name,
					standups,
					summary: {
						total_commits: standups.reduce(
							(sum, s) => sum + (s.github_activity?.commits || 0),
							0
						),
						total_prs: standups.reduce(
							(sum, s) =>
								sum +
								(s.github_activity?.prs_opened || 0) +
								(s.github_activity?.prs_merged || 0),
							0
						),
						active_members: standups.length,
						blockers_count: standups.reduce(
							(sum, s) => sum + s.blockers.length,
							0
						),
					},
				};

				await this.sendTeamStandupSummary(summary, options?.channel);
			} catch (error) {
				results.errors.push(
					`Failed to send team summary: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				);
			}
		}

		return results;
	}

	/**
	 * Send batch of PR alerts
	 */
	async sendBatchPRAlerts(
		alerts: PRAlertData[],
		options?: {
			channel?: string;
			delay_ms?: number;
			max_alerts?: number;
		}
	): Promise<{
		sent: number;
		failed: number;
		errors: string[];
	}> {
		const results = {
			sent: 0,
			failed: 0,
			errors: [] as string[],
		};

		// Limit number of alerts to prevent spam
		const maxAlerts = options?.max_alerts || 10;
		const alertsToSend = alerts.slice(0, maxAlerts);

		for (const alert of alertsToSend) {
			try {
				await this.sendPRAlert(alert, options?.channel);
				results.sent++;

				// Add delay between messages to avoid rate limiting
				if (options?.delay_ms && options.delay_ms > 0) {
					await new Promise((resolve) => setTimeout(resolve, options.delay_ms));
				}
			} catch (error) {
				results.failed++;
				results.errors.push(
					`Failed to send PR alert for ${alert.repo}#${alert.number}: ${
						error instanceof Error ? error.message : "Unknown error"
					}`
				);
			}
		}

		return results;
	}
}

/**
 * Create Slack service from integration record
 */
export function createSlackService(
	integration: Database["public"]["Tables"]["integrations"]["Row"]
): SlackService {
	return new SlackService(integration);
}
