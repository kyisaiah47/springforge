import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlackService, createSlackService } from "../slack-service";
import type { Database } from "@/lib/types/database";
import type {
	StandupData,
	TeamStandupData,
	PRAlertData,
} from "../slack-messages";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SlackService", () => {
	let service: SlackService;
	const mockIntegration: Database["public"]["Tables"]["integrations"]["Row"] = {
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

	beforeEach(() => {
		service = new SlackService(mockIntegration);
		mockFetch.mockClear();
	});

	describe("constructor", () => {
		it("should initialize with integration", () => {
			expect(service).toBeInstanceOf(SlackService);
		});

		it("should provide access to underlying client", () => {
			const client = service.getClient();
			expect(client).toBeDefined();
		});
	});

	describe("sendStandupMessage", () => {
		const standupData: StandupData = {
			member: {
				name: "John Doe",
				github_login: "johndoe",
			},
			date: "2024-01-15",
			yesterday: ["Fixed bugs"],
			today: ["New feature"],
			blockers: [],
		};

		it("should send standup message via webhook", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			await service.sendStandupMessage(standupData);

			expect(mockFetch).toHaveBeenCalledWith(
				mockIntegration.settings.webhook_url,
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: expect.stringContaining("John Doe"),
				})
			);
		});

		it("should send standup message via bot API when channel provided", async () => {
			const botIntegration = {
				...mockIntegration,
				access_token: "xoxb-123-456-789",
			};
			const botService = new SlackService(botIntegration);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ok: true }),
			});

			await botService.sendStandupMessage(standupData, "C123456");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://slack.com/api/chat.postMessage",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer xoxb-123-456-789",
					}),
				})
			);
		});
	});

	describe("sendTeamStandupSummary", () => {
		const teamData: TeamStandupData = {
			date: "2024-01-15",
			team_name: "Engineering Team",
			standups: [
				{
					member: { name: "Alice" },
					date: "2024-01-15",
					yesterday: ["Work"],
					today: ["More work"],
					blockers: [],
				},
			],
			summary: {
				total_commits: 5,
				total_prs: 2,
				active_members: 1,
				blockers_count: 0,
			},
		};

		it("should send team summary message", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			await service.sendTeamStandupSummary(teamData);

			expect(mockFetch).toHaveBeenCalledWith(
				mockIntegration.settings.webhook_url,
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("Engineering Team"),
				})
			);
		});
	});

	describe("sendPRAlert", () => {
		const prData: PRAlertData = {
			repo: "company/project",
			number: 123,
			title: "High risk PR",
			author: "developer",
			url: "https://github.com/company/project/pull/123",
			risk_score: 8.5,
			size_score: 7.0,
			days_open: 3,
		};

		it("should send PR alert message", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			await service.sendPRAlert(prData);

			expect(mockFetch).toHaveBeenCalledWith(
				mockIntegration.settings.webhook_url,
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("High risk PR"),
				})
			);
		});
	});

	describe("sendNotification", () => {
		it("should send simple notification", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			await service.sendNotification("Test notification");

			expect(mockFetch).toHaveBeenCalledWith(
				mockIntegration.settings.webhook_url,
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("Test notification"),
				})
			);
		});

		it("should send notification with custom options", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			await service.sendNotification("Custom notification", {
				emoji: ":wave:",
				username: "CustomBot",
				color: "#00ff00",
			});

			const callArgs = mockFetch.mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body.text).toBe("Custom notification");
			expect(body.username).toBe("CustomBot");
			expect(body.icon_emoji).toBe(":wave:");
			expect(body.attachments[0].color).toBe("#00ff00");
		});
	});

	describe("sendErrorNotification", () => {
		it("should send error notification", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			await service.sendErrorNotification("Something went wrong", "API call");

			expect(mockFetch).toHaveBeenCalledWith(
				mockIntegration.settings.webhook_url,
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("Something went wrong"),
				})
			);
		});
	});

	describe("testConnection", () => {
		it("should return success for working webhook", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			const result = await service.testConnection();

			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should return failure for broken webhook", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: () => Promise.resolve("invalid_payload"),
			});

			const result = await service.testConnection();

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe("sendBatchStandups", () => {
		const standups: StandupData[] = [
			{
				member: { name: "Alice" },
				date: "2024-01-15",
				yesterday: ["Work A"],
				today: ["More work A"],
				blockers: [],
				github_activity: {
					commits: 3,
					prs_opened: 1,
					prs_merged: 0,
					issues_worked: 2,
				},
			},
			{
				member: { name: "Bob" },
				date: "2024-01-15",
				yesterday: ["Work B"],
				today: ["More work B"],
				blockers: ["Issue X"],
				github_activity: {
					commits: 2,
					prs_opened: 0,
					prs_merged: 1,
					issues_worked: 1,
				},
			},
		];

		it("should send batch of standups successfully", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				});

			const result = await service.sendBatchStandups(standups);

			expect(result.sent).toBe(2);
			expect(result.failed).toBe(0);
			expect(result.errors).toHaveLength(0);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("should send team summary when requested", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				});

			const result = await service.sendBatchStandups(standups, {
				send_summary: true,
				team_name: "Test Team",
			});

			expect(result.sent).toBe(2);
			expect(mockFetch).toHaveBeenCalledTimes(3); // 2 standups + 1 summary
		});

		it("should handle partial failures", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 400,
					text: () => Promise.resolve("invalid_payload"),
				});

			const result = await service.sendBatchStandups(standups);

			expect(result.sent).toBe(1);
			expect(result.failed).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain("Bob");
		});

		it("should add delay between messages when specified", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				});

			const startTime = Date.now();
			await service.sendBatchStandups(standups, { delay_ms: 100 });
			const endTime = Date.now();

			expect(endTime - startTime).toBeGreaterThanOrEqual(100);
		});
	});

	describe("sendBatchPRAlerts", () => {
		const alerts: PRAlertData[] = [
			{
				repo: "test/repo1",
				number: 1,
				title: "PR 1",
				author: "dev1",
				url: "https://github.com/test/repo1/pull/1",
				risk_score: 8.0,
				size_score: 6.0,
				days_open: 3,
			},
			{
				repo: "test/repo2",
				number: 2,
				title: "PR 2",
				author: "dev2",
				url: "https://github.com/test/repo2/pull/2",
				risk_score: 7.5,
				size_score: 5.0,
				days_open: 5,
			},
		];

		it("should send batch of PR alerts successfully", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				});

			const result = await service.sendBatchPRAlerts(alerts);

			expect(result.sent).toBe(2);
			expect(result.failed).toBe(0);
			expect(result.errors).toHaveLength(0);
		});

		it("should limit number of alerts when max_alerts specified", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve("ok"),
			});

			const result = await service.sendBatchPRAlerts(alerts, {
				max_alerts: 1,
			});

			expect(result.sent).toBe(1);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("should handle PR alert failures", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve("ok"),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 400,
					text: () => Promise.resolve("invalid_payload"),
				});

			const result = await service.sendBatchPRAlerts(alerts);

			expect(result.sent).toBe(1);
			expect(result.failed).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain("test/repo2#2");
		});
	});
});

describe("createSlackService", () => {
	it("should create service from integration record", () => {
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

		const service = createSlackService(integration);
		expect(service).toBeInstanceOf(SlackService);
	});
});
