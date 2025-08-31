import { describe, it, expect } from "vitest";
import {
	formatStandupMessage,
	formatTeamStandupSummary,
	formatPRAlertMessage,
	formatSimpleMessage,
	formatErrorMessage,
	type StandupData,
	type TeamStandupData,
	type PRAlertData,
} from "../slack-messages";

describe("Slack Message Formatting", () => {
	describe("formatStandupMessage", () => {
		it("should format complete standup message with all sections", () => {
			const standupData: StandupData = {
				member: {
					name: "John Doe",
					avatar_url: "https://github.com/johndoe.png",
					github_login: "johndoe",
				},
				date: "2024-01-15",
				yesterday: ["Fixed bug in user authentication", "Reviewed PR #123"],
				today: ["Implement new feature", "Write unit tests"],
				blockers: ["Waiting for API documentation"],
				github_activity: {
					commits: 5,
					prs_opened: 2,
					prs_merged: 1,
					issues_worked: 3,
				},
			};

			const message = formatStandupMessage(standupData);

			expect(message.blocks).toBeDefined();
			expect(message.blocks!.length).toBeGreaterThan(0);
			expect(message.username).toBe("SprintForge");
			expect(message.icon_emoji).toBe(":rocket:");

			// Check header block
			const headerBlock = message.blocks!.find(
				(block) => block.type === "header"
			);
			expect(headerBlock).toBeDefined();
			expect(headerBlock!.text.text).toContain("John Doe");

			// Check yesterday section
			const yesterdayText = JSON.stringify(message.blocks);
			expect(yesterdayText).toContain("Yesterday I completed");
			expect(yesterdayText).toContain("Fixed bug in user authentication");
			expect(yesterdayText).toContain("Reviewed PR #123");

			// Check today section
			expect(yesterdayText).toContain("Today I'm working on");
			expect(yesterdayText).toContain("Implement new feature");
			expect(yesterdayText).toContain("Write unit tests");

			// Check blockers section
			expect(yesterdayText).toContain("Blockers");
			expect(yesterdayText).toContain("Waiting for API documentation");

			// Check GitHub activity
			expect(yesterdayText).toContain("GitHub Activity");
			expect(yesterdayText).toContain("5 commits");
			expect(yesterdayText).toContain("2 PRs opened");
		});

		it("should format standup message with minimal data", () => {
			const standupData: StandupData = {
				member: {
					name: "Jane Smith",
				},
				date: "2024-01-15",
				yesterday: [],
				today: ["Work on project"],
				blockers: [],
			};

			const message = formatStandupMessage(standupData);

			expect(message.blocks).toBeDefined();
			expect(message.blocks!.length).toBeGreaterThan(0);

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("Jane Smith");
			expect(messageText).toContain("Work on project");
			expect(messageText).not.toContain("Yesterday I completed");
			expect(messageText).not.toContain("Blockers");
		});

		it("should handle empty arrays gracefully", () => {
			const standupData: StandupData = {
				member: {
					name: "Empty User",
				},
				date: "2024-01-15",
				yesterday: [],
				today: [],
				blockers: [],
			};

			const message = formatStandupMessage(standupData);

			expect(message.blocks).toBeDefined();
			expect(message.blocks!.length).toBeGreaterThan(0);

			// Should still have header and context blocks
			const headerBlock = message.blocks!.find(
				(block) => block.type === "header"
			);
			expect(headerBlock).toBeDefined();
		});
	});

	describe("formatTeamStandupSummary", () => {
		it("should format team summary with multiple standups", () => {
			const teamData: TeamStandupData = {
				date: "2024-01-15",
				team_name: "Engineering Team",
				standups: [
					{
						member: {
							name: "Alice",
							github_login: "alice",
						},
						date: "2024-01-15",
						yesterday: ["Fixed bugs"],
						today: ["New feature"],
						blockers: [],
					},
					{
						member: {
							name: "Bob",
							github_login: "bob",
						},
						date: "2024-01-15",
						yesterday: ["Code review"],
						today: ["Testing"],
						blockers: ["API issue"],
					},
				],
				summary: {
					total_commits: 10,
					total_prs: 5,
					active_members: 2,
					blockers_count: 1,
				},
			};

			const message = formatTeamStandupSummary(teamData);

			expect(message.blocks).toBeDefined();
			expect(message.username).toBe("SprintForge");

			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("Engineering Team");
			expect(messageText).toContain("Active Members");
			expect(messageText).toContain("2");
			expect(messageText).toContain("Total Commits");
			expect(messageText).toContain("10");
			expect(messageText).toContain("Alice");
			expect(messageText).toContain("Bob");
			expect(messageText).toContain("Fixed bugs");
			expect(messageText).toContain("API issue");
		});

		it("should handle team with no standups", () => {
			const teamData: TeamStandupData = {
				date: "2024-01-15",
				team_name: "Empty Team",
				standups: [],
				summary: {
					total_commits: 0,
					total_prs: 0,
					active_members: 0,
					blockers_count: 0,
				},
			};

			const message = formatTeamStandupSummary(teamData);

			expect(message.blocks).toBeDefined();
			const messageText = JSON.stringify(message.blocks);
			expect(messageText).toContain("Empty Team");
			expect(messageText).toContain("0");
		});
	});

	describe("formatPRAlertMessage", () => {
		it("should format high-risk PR alert", () => {
			const prData: PRAlertData = {
				repo: "company/awesome-project",
				number: 123,
				title: "Major refactoring of authentication system",
				author: "developer",
				url: "https://github.com/company/awesome-project/pull/123",
				risk_score: 8.5,
				size_score: 7.2,
				days_open: 1,
				suggested_reviewers: ["senior-dev", "security-expert"],
			};

			const message = formatPRAlertMessage(prData);

			expect(message.blocks).toBeDefined();
			expect(message.attachments).toBeDefined();
			expect(message.username).toBe("SprintForge PR Radar");
			expect(message.icon_emoji).toBe(":radar:");

			const messageText = JSON.stringify(message);
			expect(messageText).toContain("High Risk PR");
			expect(messageText).toContain("company/awesome-project#123");
			expect(messageText).toContain("Major refactoring");
			expect(messageText).toContain("8.5/10");
			expect(messageText).toContain("senior-dev");
			expect(messageText).toContain("security-expert");

			// Check attachment color for high risk
			expect(message.attachments![0].color).toBe("#ff4444");
		});

		it("should format stale PR alert", () => {
			const prData: PRAlertData = {
				repo: "company/project",
				number: 456,
				title: "Small bug fix",
				author: "junior-dev",
				url: "https://github.com/company/project/pull/456",
				risk_score: 3.0,
				size_score: 2.0,
				days_open: 5,
				is_stale: true,
			};

			const message = formatPRAlertMessage(prData);

			const messageText = JSON.stringify(message);
			expect(messageText).toContain("Stale PR Alert");
			expect(messageText).toContain("5");

			// Check attachment color for stale PR
			expect(message.attachments![0].color).toBe("#ffaa00");
		});

		it("should include action buttons", () => {
			const prData: PRAlertData = {
				repo: "test/repo",
				number: 1,
				title: "Test PR",
				author: "test-user",
				url: "https://github.com/test/repo/pull/1",
				risk_score: 5.0,
				size_score: 4.0,
				days_open: 2,
			};

			const message = formatPRAlertMessage(prData);

			const actionsBlock = message.blocks!.find(
				(block) => block.type === "actions"
			);
			expect(actionsBlock).toBeDefined();
			expect(actionsBlock!.elements[0].text.text).toBe("View PR");
			expect(actionsBlock!.elements[0].url).toBe(prData.url);
		});
	});

	describe("formatSimpleMessage", () => {
		it("should format basic text message", () => {
			const message = formatSimpleMessage("Hello, world!");

			expect(message.text).toBe("Hello, world!");
			expect(message.username).toBe("SprintForge");
			expect(message.icon_emoji).toBe(":rocket:");
		});

		it("should format message with custom options", () => {
			const message = formatSimpleMessage("Custom message", {
				emoji: ":wave:",
				username: "CustomBot",
				color: "#00ff00",
			});

			expect(message.text).toBe("Custom message");
			expect(message.username).toBe("CustomBot");
			expect(message.icon_emoji).toBe(":wave:");
			expect(message.attachments).toBeDefined();
			expect(message.attachments![0].color).toBe("#00ff00");
		});
	});

	describe("formatErrorMessage", () => {
		it("should format error message without context", () => {
			const message = formatErrorMessage("Something went wrong");

			expect(message.text).toContain("SprintForge Error");
			expect(message.text).toContain("Something went wrong");
			expect(message.username).toBe("SprintForge");
			expect(message.icon_emoji).toBe(":warning:");
			expect(message.attachments).toBeDefined();
			expect(message.attachments![0].color).toBe("#ff0000");
		});

		it("should format error message with context", () => {
			const message = formatErrorMessage(
				"API call failed",
				"GitHub integration"
			);

			expect(message.text).toContain("SprintForge Error (GitHub integration)");
			expect(message.text).toContain("API call failed");

			const attachment = message.attachments![0];
			expect(attachment.fields).toBeDefined();
			expect(attachment.fields!.length).toBe(3); // Error, Context, Timestamp

			const contextField = attachment.fields!.find(
				(field) => field.title === "Context"
			);
			expect(contextField).toBeDefined();
			expect(contextField!.value).toBe("GitHub integration");
		});

		it("should include timestamp in error message", () => {
			const message = formatErrorMessage("Test error");

			const attachment = message.attachments![0];
			const timestampField = attachment.fields!.find(
				(field) => field.title === "Timestamp"
			);
			expect(timestampField).toBeDefined();
			expect(timestampField!.value).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
			);
		});
	});
});
