import { APIErrors } from "@/lib/shared/api-error";
import type { Database } from "@/lib/types/database";

/**
 * Slack API client configuration
 */
export interface SlackClientConfig {
	webhookUrl?: string;
	botToken?: string;
	baseUrl?: string;
}

/**
 * Slack Block Kit message types
 */
export interface SlackBlock {
	type: string;
	[key: string]: any;
}

export interface SlackMessage {
	text?: string;
	blocks?: SlackBlock[];
	attachments?: SlackAttachment[];
	channel?: string;
	username?: string;
	icon_emoji?: string;
	icon_url?: string;
}

export interface SlackAttachment {
	color?: string;
	pretext?: string;
	author_name?: string;
	author_link?: string;
	author_icon?: string;
	title?: string;
	title_link?: string;
	text?: string;
	fields?: Array<{
		title: string;
		value: string;
		short?: boolean;
	}>;
	image_url?: string;
	thumb_url?: string;
	footer?: string;
	footer_icon?: string;
	ts?: number;
}

/**
 * Slack API error class
 */
export class SlackAPIError extends Error {
	constructor(message: string, public status?: number, public response?: any) {
		super(message);
		this.name = "SlackAPIError";
	}
}

/**
 * Slack API client for webhook and Bot API interactions
 */
export class SlackClient {
	private readonly config: SlackClientConfig;
	private readonly baseUrl: string;

	constructor(config: SlackClientConfig) {
		this.config = config;
		this.baseUrl = config.baseUrl || "https://slack.com/api";
	}

	/**
	 * Send message via webhook URL
	 */
	async sendWebhookMessage(message: SlackMessage): Promise<void> {
		if (!this.config.webhookUrl) {
			throw new SlackAPIError("Webhook URL not configured");
		}

		try {
			const response = await fetch(this.config.webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new SlackAPIError(
					`Webhook request failed: ${errorText}`,
					response.status,
					errorText
				);
			}

			// Slack webhooks return "ok" for success
			const responseText = await response.text();
			if (responseText !== "ok") {
				throw new SlackAPIError(`Webhook returned: ${responseText}`);
			}
		} catch (error) {
			if (error instanceof SlackAPIError) {
				throw error;
			}
			throw new SlackAPIError(
				`Failed to send webhook message: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	/**
	 * Send message via Bot API (requires bot token)
	 */
	async sendBotMessage(
		channel: string,
		message: Omit<SlackMessage, "channel">
	): Promise<any> {
		if (!this.config.botToken) {
			throw new SlackAPIError("Bot token not configured");
		}

		const payload = {
			channel,
			...message,
		};

		try {
			const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.botToken}`,
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new SlackAPIError(
					`Bot API request failed: ${data.error || "Unknown error"}`,
					response.status,
					data
				);
			}

			if (!data.ok) {
				throw new SlackAPIError(`Slack API error: ${data.error}`, 200, data);
			}

			return data;
		} catch (error) {
			if (error instanceof SlackAPIError) {
				throw error;
			}
			throw new SlackAPIError(
				`Failed to send bot message: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	/**
	 * Test webhook URL connectivity
	 */
	async testWebhook(): Promise<boolean> {
		try {
			await this.sendWebhookMessage({
				text: "SprintForge webhook test - connection successful! 🚀",
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Validate webhook URL format
	 */
	static validateWebhookUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			return (
				parsed.protocol === "https:" &&
				parsed.hostname === "hooks.slack.com" &&
				parsed.pathname.startsWith("/services/")
			);
		} catch {
			return false;
		}
	}
}

/**
 * Create Slack client from integration record
 */
export function createSlackClient(
	integration: Database["public"]["Tables"]["integrations"]["Row"]
): SlackClient {
	if (integration.type !== "slack") {
		throw new Error("Integration is not a Slack integration");
	}

	const config: SlackClientConfig = {
		webhookUrl: (integration.settings as Record<string, unknown>)
			?.webhook_url as string,
		botToken: integration.access_token || undefined,
	};

	if (!config.webhookUrl && !config.botToken) {
		throw new Error("Slack integration missing webhook URL or bot token");
	}

	return new SlackClient(config);
}
