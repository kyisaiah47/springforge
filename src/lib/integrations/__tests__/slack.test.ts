import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlackClient, SlackAPIError, createSlackClient } from "../slack";
import type { Database } from "@/lib/types/database";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SlackClient", () => {
	let client: SlackClient;
	const mockWebhookUrl = "https://hooks.slack.com/services/T123/B456/xyz789";
	const mockBotToken = "xoxb-123-456-789";

	beforeEach(() => {
		mockFetch.mockClear();
	});

	describe("constructor", () => {
		it("should initialize with webhook URL", () => {
			client = new SlackClient({ webhookUrl: mockWebhookUrl });
			expect(client).toBeInstanceOf(SlackClient);
		});

		it("should initialize with bot token", () => {
			client = new SlackClient({ botToken: mockBotToken });
			expect(client).toBeInstanceOf(SlackClient);
		});

		it("should use custom base URL", () => {
			const customUrl = "https://custom.slack.com/api";
			client = new SlackClient({
				webhookUrl: mockWebhookUrl,
				baseUrl: customUrl,
			});
			expect(client).toBeDefined();
		});
	});

	describe("sendWebhookMessage", () => {
		beforeEach(() => {
			client = new SlackClient({ webhookUrl: mockWebhookUrl });
		});

		it("should send message via webhook successfully", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			const message = {
				text: "Test message",
				username: "TestBot",
			};

			await client.sendWebhookMessage(message);

			expect(mockFetch).toHaveBeenCalledWith(mockWebhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});
		});

		it("should throw error when webhook URL not configured", async () => {
			const clientWithoutWebhook = new SlackClient({});

			await expect(
				clientWithoutWebhook.sendWebhookMessage({ text: "test" })
			).rejects.toThrow(SlackAPIError);
			await expect(
				clientWithoutWebhook.sendWebhookMessage({ text: "test" })
			).rejects.toThrow("Webhook URL not configured");
		});

		it("should throw SlackAPIError on HTTP error", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				text: () => Promise.resolve("invalid_payload"),
			});

			await expect(client.sendWebhookMessage({ text: "test" })).rejects.toThrow(
				SlackAPIError
			);
			await expect(client.sendWebhookMessage({ text: "test" })).rejects.toThrow(
				"Webhook request failed: invalid_payload"
			);
		});

		it("should throw error when response is not 'ok'", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve("invalid_token"),
			});

			await expect(client.sendWebhookMessage({ text: "test" })).rejects.toThrow(
				SlackAPIError
			);
			await expect(client.sendWebhookMessage({ text: "test" })).rejects.toThrow(
				"Webhook returned: invalid_token"
			);
		});

		it("should handle network errors", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			await expect(client.sendWebhookMessage({ text: "test" })).rejects.toThrow(
				SlackAPIError
			);
			await expect(client.sendWebhookMessage({ text: "test" })).rejects.toThrow(
				"Failed to send webhook message: Network error"
			);
		});
	});

	describe("sendBotMessage", () => {
		beforeEach(() => {
			client = new SlackClient({ botToken: mockBotToken });
		});

		it("should send message via Bot API successfully", async () => {
			const mockResponse = {
				ok: true,
				channel: "C123456",
				ts: "1234567890.123456",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const message = {
				text: "Test message",
				username: "TestBot",
			};

			const result = await client.sendBotMessage("C123456", message);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://slack.com/api/chat.postMessage",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${mockBotToken}`,
					},
					body: JSON.stringify({
						channel: "C123456",
						...message,
					}),
				}
			);
			expect(result).toEqual(mockResponse);
		});

		it("should throw error when bot token not configured", async () => {
			const clientWithoutToken = new SlackClient({});

			await expect(
				clientWithoutToken.sendBotMessage("C123456", { text: "test" })
			).rejects.toThrow(SlackAPIError);
			await expect(
				clientWithoutToken.sendBotMessage("C123456", { text: "test" })
			).rejects.toThrow("Bot token not configured");
		});

		it("should throw SlackAPIError on HTTP error", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				json: () => Promise.resolve({ error: "invalid_auth" }),
			});

			await expect(
				client.sendBotMessage("C123456", { text: "test" })
			).rejects.toThrow(SlackAPIError);
			await expect(
				client.sendBotMessage("C123456", { text: "test" })
			).rejects.toThrow("Bot API request failed: invalid_auth");
		});

		it("should throw error when Slack API returns error", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ ok: false, error: "channel_not_found" }),
			});

			await expect(
				client.sendBotMessage("C123456", { text: "test" })
			).rejects.toThrow(SlackAPIError);
			await expect(
				client.sendBotMessage("C123456", { text: "test" })
			).rejects.toThrow("Slack API error: channel_not_found");
		});
	});

	describe("testWebhook", () => {
		beforeEach(() => {
			client = new SlackClient({ webhookUrl: mockWebhookUrl });
		});

		it("should return true for successful webhook test", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			const result = await client.testWebhook();
			expect(result).toBe(true);
		});

		it("should return false for failed webhook test", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: () => Promise.resolve("invalid_payload"),
			});

			const result = await client.testWebhook();
			expect(result).toBe(false);
		});
	});

	describe("validateWebhookUrl", () => {
		it("should validate correct Slack webhook URLs", () => {
			const validUrls = [
				"https://hooks.slack.com/services/T123/B456/xyz789",
				"https://hooks.slack.com/services/T12345678/B87654321/abcdefghijklmnop",
			];

			validUrls.forEach((url) => {
				expect(SlackClient.validateWebhookUrl(url)).toBe(true);
			});
		});

		it("should reject invalid webhook URLs", () => {
			const invalidUrls = [
				"http://hooks.slack.com/services/T123/B456/xyz789", // HTTP instead of HTTPS
				"https://example.com/webhook", // Wrong domain
				"https://hooks.slack.com/webhook", // Wrong path
				"not-a-url", // Not a URL
				"", // Empty string
			];

			invalidUrls.forEach((url) => {
				expect(SlackClient.validateWebhookUrl(url)).toBe(false);
			});
		});
	});
});

describe("createSlackClient", () => {
	it("should create client from Slack integration with webhook URL", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "slack",
			access_token: null,
			settings: {
				webhook_url: "https://hooks.slack.com/services/T123/B456/xyz789",
			},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		const client = createSlackClient(integration);
		expect(client).toBeInstanceOf(SlackClient);
	});

	it("should create client from Slack integration with bot token", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "slack",
			access_token: "xoxb-123-456-789",
			settings: {},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		const client = createSlackClient(integration);
		expect(client).toBeInstanceOf(SlackClient);
	});

	it("should throw error for non-Slack integration", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "github",
			access_token: "token",
			settings: {},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		expect(() => createSlackClient(integration)).toThrow(
			"Integration is not a Slack integration"
		);
	});

	it("should throw error for missing webhook URL and bot token", () => {
		const integration: Database["public"]["Tables"]["integrations"]["Row"] = {
			id: "test-id",
			org_id: "org-id",
			type: "slack",
			access_token: null,
			settings: {},
			created_at: "2024-01-01T00:00:00Z",
			deleted_at: null,
		};

		expect(() => createSlackClient(integration)).toThrow(
			"Slack integration missing webhook URL or bot token"
		);
	});
});

describe("SlackAPIError", () => {
	it("should create error with message and status", () => {
		const error = new SlackAPIError("Test error", 400, {
			error: "invalid_payload",
		});

		expect(error.message).toBe("Test error");
		expect(error.status).toBe(400);
		expect(error.response).toEqual({ error: "invalid_payload" });
		expect(error.name).toBe("SlackAPIError");
	});

	it("should create error with just message", () => {
		const error = new SlackAPIError("Simple error");

		expect(error.message).toBe("Simple error");
		expect(error.status).toBeUndefined();
		expect(error.response).toBeUndefined();
	});
});
