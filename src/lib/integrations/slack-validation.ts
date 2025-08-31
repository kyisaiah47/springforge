import { SlackClient } from "./slack";

/**
 * Slack webhook URL validation result
 */
export interface WebhookValidationResult {
	valid: boolean;
	error?: string;
	details?: {
		format_valid: boolean;
		connectivity_test: boolean;
		response_time_ms?: number;
	};
}

/**
 * Slack integration settings validation
 */
export interface SlackSettingsValidation {
	webhook_url?: WebhookValidationResult;
	bot_token?: {
		valid: boolean;
		error?: string;
		scopes?: string[];
	};
}

/**
 * Validate Slack webhook URL format and connectivity
 */
export async function validateSlackWebhookUrl(
	url: string,
	options?: {
		test_connectivity?: boolean;
		timeout_ms?: number;
	}
): Promise<WebhookValidationResult> {
	const result: WebhookValidationResult = {
		valid: false,
		details: {
			format_valid: false,
			connectivity_test: false,
		},
	};

	// Validate URL format
	if (!SlackClient.validateWebhookUrl(url)) {
		result.error = "Invalid Slack webhook URL format";
		return result;
	}

	if (result.details) {
		result.details.format_valid = true;
	}

	// Test connectivity if requested
	if (options?.test_connectivity !== false) {
		try {
			const startTime = Date.now();
			const client = new SlackClient({ webhookUrl: url });

			// Create a promise that rejects after timeout
			const timeoutMs = options?.timeout_ms || 10000;
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error("Connection timeout")), timeoutMs);
			});

			// Race between test and timeout
			const success = await Promise.race([
				client.testWebhook(),
				timeoutPromise,
			]);

			if (success && result.details) {
				result.details.connectivity_test = true;
				result.details.response_time_ms = Date.now() - startTime;
				result.valid = true;
			} else {
				result.error = "Connectivity test failed: webhook returned false";
				return result;
			}
		} catch (error) {
			result.error = `Connectivity test failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`;
			return result;
		}
	} else {
		result.valid = true;
	}

	return result;
}

/**
 * Validate Slack bot token (requires actual API call)
 */
export async function validateSlackBotToken(
	token: string,
	options?: {
		timeout_ms?: number;
	}
): Promise<{
	valid: boolean;
	error?: string;
	scopes?: string[];
}> {
	if (!token || !token.startsWith("xoxb-")) {
		return {
			valid: false,
			error: "Invalid bot token format (should start with 'xoxb-')",
		};
	}

	try {
		const timeoutMs = options?.timeout_ms || 10000;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		const response = await fetch("https://slack.com/api/auth.test", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		const data = await response.json();

		if (!data.ok) {
			return {
				valid: false,
				error: `Token validation failed: ${data.error}`,
			};
		}

		// Get token scopes if available
		let scopes: string[] = [];
		if (response.headers.get("x-oauth-scopes")) {
			scopes = response.headers
				.get("x-oauth-scopes")!
				.split(",")
				.map((s) => s.trim());
		}

		return {
			valid: true,
			scopes,
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return {
				valid: false,
				error: "Token validation timeout",
			};
		}

		return {
			valid: false,
			error: `Token validation failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		};
	}
}

/**
 * Validate complete Slack integration settings
 */
export async function validateSlackSettings(
	settings: {
		webhook_url?: string;
		bot_token?: string;
	},
	options?: {
		test_connectivity?: boolean;
		timeout_ms?: number;
	}
): Promise<SlackSettingsValidation> {
	const validation: SlackSettingsValidation = {};

	// Validate webhook URL if provided
	if (settings.webhook_url) {
		validation.webhook_url = await validateSlackWebhookUrl(
			settings.webhook_url,
			options
		);
	}

	// Validate bot token if provided
	if (settings.bot_token) {
		validation.bot_token = await validateSlackBotToken(
			settings.bot_token,
			options
		);
	}

	return validation;
}

/**
 * Test Slack integration end-to-end
 */
export async function testSlackIntegration(
	settings: {
		webhook_url?: string;
		bot_token?: string;
	},
	options?: {
		channel?: string;
		timeout_ms?: number;
	}
): Promise<{
	success: boolean;
	webhook_test?: boolean;
	bot_test?: boolean;
	error?: string;
}> {
	const result = {
		success: false,
		webhook_test: false,
		bot_test: false,
	};

	try {
		const client = new SlackClient({
			webhookUrl: settings.webhook_url,
			botToken: settings.bot_token,
		});

		// Test webhook if URL is provided
		if (settings.webhook_url) {
			try {
				await client.sendWebhookMessage({
					text: "🧪 SprintForge webhook test - connection successful!",
					username: "SprintForge Test",
					icon_emoji: ":test_tube:",
				});
				result.webhook_test = true;
			} catch (error) {
				return {
					...result,
					error: `Webhook test failed: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				};
			}
		}

		// Test bot API if token and channel are provided
		if (settings.bot_token && options?.channel) {
			try {
				await client.sendBotMessage(options.channel, {
					text: "🧪 SprintForge bot test - connection successful!",
					username: "SprintForge Test",
					icon_emoji: ":test_tube:",
				});
				result.bot_test = true;
			} catch (error) {
				return {
					...result,
					error: `Bot API test failed: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				};
			}
		}

		result.success = result.webhook_test || result.bot_test;
		return result;
	} catch (error) {
		return {
			...result,
			error: `Integration test failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		};
	}
}

/**
 * Extract Slack webhook URL from various formats
 */
export function normalizeSlackWebhookUrl(input: string): string | null {
	// Remove whitespace
	const cleaned = input.trim();

	// Check if it's already a valid webhook URL
	if (SlackClient.validateWebhookUrl(cleaned)) {
		return cleaned;
	}

	// Try to extract from common formats
	const patterns = [
		// Full webhook URL in text
		/https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+/,
		// Webhook URL with extra text
		/.*?(https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+).*/,
	];

	for (const pattern of patterns) {
		const match = cleaned.match(pattern);
		if (match) {
			const url = match[1] || match[0];
			if (SlackClient.validateWebhookUrl(url)) {
				return url;
			}
		}
	}

	return null;
}

/**
 * Generate Slack webhook setup instructions
 */
export function getSlackWebhookInstructions(): {
	steps: string[];
	help_url: string;
} {
	return {
		steps: [
			"Go to your Slack workspace settings",
			"Navigate to 'Apps' and search for 'Incoming Webhooks'",
			"Click 'Add to Slack' and select the channel for SprintForge notifications",
			"Copy the webhook URL that starts with 'https://hooks.slack.com/services/'",
			"Paste the webhook URL in the SprintForge integration settings",
			"Test the connection to verify it's working",
		],
		help_url: "https://api.slack.com/messaging/webhooks",
	};
}
