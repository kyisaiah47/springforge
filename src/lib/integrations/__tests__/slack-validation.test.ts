import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	validateSlackWebhookUrl,
	validateSlackBotToken,
	validateSlackSettings,
	testSlackIntegration,
	normalizeSlackWebhookUrl,
	getSlackWebhookInstructions,
} from "../slack-validation";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Slack Validation", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	describe("validateSlackWebhookUrl", () => {
		const validWebhookUrl = "https://hooks.slack.com/services/T123/B456/xyz789";

		it("should validate correct webhook URL format", async () => {
			const result = await validateSlackWebhookUrl(validWebhookUrl, {
				test_connectivity: false,
			});

			expect(result.valid).toBe(true);
			expect(result.details?.format_valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should reject invalid webhook URL format", async () => {
			const invalidUrl = "https://example.com/webhook";
			const result = await validateSlackWebhookUrl(invalidUrl);

			expect(result.valid).toBe(false);
			expect(result.details?.format_valid).toBe(false);
			expect(result.error).toBe("Invalid Slack webhook URL format");
		});

		it("should test connectivity when enabled", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			const result = await validateSlackWebhookUrl(validWebhookUrl, {
				test_connectivity: true,
			});

			expect(result.valid).toBe(true);
			expect(result.details?.format_valid).toBe(true);
			expect(result.details?.connectivity_test).toBe(true);
			expect(result.details?.response_time_ms).toBeGreaterThanOrEqual(0);
		});

		it("should handle connectivity test failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: () => Promise.resolve("invalid_payload"),
			});

			const result = await validateSlackWebhookUrl(validWebhookUrl, {
				test_connectivity: true,
			});

			expect(result.valid).toBe(false);
			expect(result.details?.format_valid).toBe(true);
			expect(result.details?.connectivity_test).toBe(false);
			expect(result.error).toContain("Connectivity test failed");
		});

		it("should handle connectivity timeout", async () => {
			mockFetch.mockImplementationOnce(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve({ ok: true, text: () => "ok" }), 2000)
					)
			);

			const result = await validateSlackWebhookUrl(validWebhookUrl, {
				test_connectivity: true,
				timeout_ms: 100,
			});

			expect(result.valid).toBe(false);
			expect(result.error).toContain("Connection timeout");
		});
	});

	describe("validateSlackBotToken", () => {
		const validBotToken = "xoxb-123-456-789";

		it("should validate correct bot token format and API response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: true, user: "test-bot" }),
				headers: new Map([["x-oauth-scopes", "chat:write,channels:read"]]),
			});

			const result = await validateSlackBotToken(validBotToken);

			expect(result.valid).toBe(true);
			expect(result.scopes).toEqual(["chat:write", "channels:read"]);
			expect(result.error).toBeUndefined();

			expect(mockFetch).toHaveBeenCalledWith(
				"https://slack.com/api/auth.test",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: `Bearer ${validBotToken}`,
					}),
				})
			);
		});

		it("should reject invalid bot token format", async () => {
			const invalidToken = "invalid-token";
			const result = await validateSlackBotToken(invalidToken);

			expect(result.valid).toBe(false);
			expect(result.error).toBe(
				"Invalid bot token format (should start with 'xoxb-')"
			);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should handle API error response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: false, error: "invalid_auth" }),
				headers: new Map(),
			});

			const result = await validateSlackBotToken(validBotToken);

			expect(result.valid).toBe(false);
			expect(result.error).toBe("Token validation failed: invalid_auth");
		});

		it("should handle network timeout", async () => {
			// Mock AbortController to simulate timeout
			const mockAbort = vi.fn();
			const mockController = { abort: mockAbort, signal: { aborted: false } };
			vi.stubGlobal(
				"AbortController",
				vi.fn(() => mockController)
			);

			mockFetch.mockImplementationOnce(() => {
				// Simulate AbortError
				const error = new Error("The operation was aborted");
				error.name = "AbortError";
				return Promise.reject(error);
			});

			const result = await validateSlackBotToken(validBotToken, {
				timeout_ms: 100,
			});

			expect(result.valid).toBe(false);
			expect(result.error).toBe("Token validation timeout");
		});

		it("should handle network errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const result = await validateSlackBotToken(validBotToken);

			expect(result.valid).toBe(false);
			expect(result.error).toContain("Network error");
		});
	});

	describe("validateSlackSettings", () => {
		it("should validate settings with webhook URL", async () => {
			const settings = {
				webhook_url: "https://hooks.slack.com/services/T123/B456/xyz789",
			};

			const result = await validateSlackSettings(settings, {
				test_connectivity: false,
			});

			expect(result.webhook_url).toBeDefined();
			expect(result.webhook_url!.valid).toBe(true);
			expect(result.bot_token).toBeUndefined();
		});

		it("should validate settings with bot token", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: true }),
				headers: new Map(),
			});

			const settings = {
				bot_token: "xoxb-123-456-789",
			};

			const result = await validateSlackSettings(settings);

			expect(result.bot_token).toBeDefined();
			expect(result.bot_token!.valid).toBe(true);
			expect(result.webhook_url).toBeUndefined();
		});

		it("should validate settings with both webhook URL and bot token", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: true }),
				headers: new Map(),
			});

			const settings = {
				webhook_url: "https://hooks.slack.com/services/T123/B456/xyz789",
				bot_token: "xoxb-123-456-789",
			};

			const result = await validateSlackSettings(settings, {
				test_connectivity: false,
			});

			expect(result.webhook_url).toBeDefined();
			expect(result.webhook_url!.valid).toBe(true);
			expect(result.bot_token).toBeDefined();
			expect(result.bot_token!.valid).toBe(true);
		});
	});

	describe("testSlackIntegration", () => {
		it("should test webhook integration successfully", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			const settings = {
				webhook_url: "https://hooks.slack.com/services/T123/B456/xyz789",
			};

			const result = await testSlackIntegration(settings);

			expect(result.webhook_test).toBe(true);
			expect(result.bot_test).toBe(false);
			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should test bot integration successfully", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: true }),
			});

			const settings = {
				bot_token: "xoxb-123-456-789",
			};

			const result = await testSlackIntegration(settings, {
				channel: "C123456",
			});

			expect(result.success).toBe(true);
			expect(result.webhook_test).toBe(false);
			expect(result.bot_test).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should handle webhook test failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: () => Promise.resolve("invalid_payload"),
			});

			const settings = {
				webhook_url: "https://hooks.slack.com/services/T123/B456/xyz789",
			};

			const result = await testSlackIntegration(settings);

			expect(result.success).toBe(false);
			expect(result.webhook_test).toBe(false);
			expect(result.error).toContain("Webhook test failed");
		});

		it("should handle bot test failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: false, error: "channel_not_found" }),
			});

			const settings = {
				bot_token: "xoxb-123-456-789",
			};

			const result = await testSlackIntegration(settings, {
				channel: "C123456",
			});

			expect(result.success).toBe(false);
			expect(result.bot_test).toBe(false);
			expect(result.error).toContain("Bot API test failed");
		});
	});

	describe("normalizeSlackWebhookUrl", () => {
		it("should return valid webhook URL as-is", () => {
			const validUrl = "https://hooks.slack.com/services/T123/B456/xyz789";
			const result = normalizeSlackWebhookUrl(validUrl);
			expect(result).toBe(validUrl);
		});

		it("should extract webhook URL from text", () => {
			const textWithUrl =
				"Your webhook URL is: https://hooks.slack.com/services/T123/B456/xyz789 - use this for integration";
			const result = normalizeSlackWebhookUrl(textWithUrl);
			expect(result).toBe("https://hooks.slack.com/services/T123/B456/xyz789");
		});

		it("should handle whitespace", () => {
			const urlWithWhitespace =
				"  https://hooks.slack.com/services/T123/B456/xyz789  ";
			const result = normalizeSlackWebhookUrl(urlWithWhitespace);
			expect(result).toBe("https://hooks.slack.com/services/T123/B456/xyz789");
		});

		it("should return null for invalid input", () => {
			const invalidInputs = [
				"https://example.com/webhook",
				"not a url at all",
				"",
				"https://hooks.slack.com/invalid",
			];

			invalidInputs.forEach((input) => {
				const result = normalizeSlackWebhookUrl(input);
				expect(result).toBeNull();
			});
		});
	});

	describe("getSlackWebhookInstructions", () => {
		it("should return setup instructions", () => {
			const instructions = getSlackWebhookInstructions();

			expect(instructions.steps).toBeDefined();
			expect(instructions.steps.length).toBeGreaterThan(0);
			expect(instructions.help_url).toBe(
				"https://api.slack.com/messaging/webhooks"
			);

			// Check that instructions contain key steps
			const stepsText = instructions.steps.join(" ");
			expect(stepsText).toContain("Slack workspace");
			expect(stepsText).toContain("Incoming Webhooks");
			expect(stepsText).toContain("webhook URL");
			expect(stepsText).toContain("Orbit");
		});
	});
});
