import type { SlackMessage, SlackBlock, SlackAttachment } from "./slack";

/**
 * Standup data structure for message formatting
 */
export interface StandupData {
	member: {
		name: string;
		avatar_url?: string;
		github_login?: string;
	};
	date: string;
	yesterday: string[];
	today: string[];
	blockers: string[];
	github_activity?: {
		commits: number;
		prs_opened: number;
		prs_merged: number;
		issues_worked: number;
	};
}

/**
 * PR alert data structure for message formatting
 */
export interface PRAlertData {
	repo: string;
	number: number;
	title: string;
	author: string;
	url: string;
	risk_score: number;
	size_score: number;
	days_open: number;
	suggested_reviewers?: string[];
	is_stale?: boolean;
}

/**
 * Team standup summary data
 */
export interface TeamStandupData {
	date: string;
	team_name: string;
	standups: StandupData[];
	summary: {
		total_commits: number;
		total_prs: number;
		active_members: number;
		blockers_count: number;
	};
}

/**
 * Format individual standup message using Block Kit
 */
export function formatStandupMessage(data: StandupData): SlackMessage {
	const blocks: SlackBlock[] = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: `📋 Daily Standup - ${data.member.name}`,
				emoji: true,
			},
		},
		{
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `*Date:* ${new Date(data.date).toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}`,
				},
			],
		},
	];

	// Yesterday section
	if (data.yesterday.length > 0) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*✅ Yesterday I completed:*\n${data.yesterday
					.map((item) => `• ${item}`)
					.join("\n")}`,
			},
		});
	}

	// Today section
	if (data.today.length > 0) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*🎯 Today I'm working on:*\n${data.today
					.map((item) => `• ${item}`)
					.join("\n")}`,
			},
		});
	}

	// Blockers section
	if (data.blockers.length > 0) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*🚧 Blockers:*\n${data.blockers
					.map((item) => `• ${item}`)
					.join("\n")}`,
			},
		});
	}

	// GitHub activity section
	if (data.github_activity) {
		const activity = data.github_activity;
		const activityText = [
			activity.commits > 0 ? `${activity.commits} commits` : null,
			activity.prs_opened > 0 ? `${activity.prs_opened} PRs opened` : null,
			activity.prs_merged > 0 ? `${activity.prs_merged} PRs merged` : null,
			activity.issues_worked > 0 ? `${activity.issues_worked} issues` : null,
		]
			.filter(Boolean)
			.join(" • ");

		if (activityText) {
			blocks.push({
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: `📊 *GitHub Activity:* ${activityText}`,
					},
				],
			});
		}
	}

	blocks.push({
		type: "divider",
	});

	return {
		blocks,
		username: "SprintForge",
		icon_emoji: ":rocket:",
	};
}

/**
 * Format team standup summary message
 */
export function formatTeamStandupSummary(data: TeamStandupData): SlackMessage {
	const blocks: SlackBlock[] = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: `🚀 ${data.team_name} Daily Standup Summary`,
				emoji: true,
			},
		},
		{
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `*Date:* ${new Date(data.date).toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}`,
				},
			],
		},
		{
			type: "section",
			fields: [
				{
					type: "mrkdwn",
					text: `*👥 Active Members*\n${data.summary.active_members}`,
				},
				{
					type: "mrkdwn",
					text: `*💻 Total Commits*\n${data.summary.total_commits}`,
				},
				{
					type: "mrkdwn",
					text: `*🔀 Total PRs*\n${data.summary.total_prs}`,
				},
				{
					type: "mrkdwn",
					text: `*🚧 Blockers*\n${data.summary.blockers_count}`,
				},
			],
		},
	];

	// Add individual standups
	data.standups.forEach((standup, index) => {
		if (index > 0) {
			blocks.push({ type: "divider" });
		}

		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*${standup.member.name}*${
					standup.member.github_login
						? ` (@${standup.member.github_login})`
						: ""
				}`,
			},
			accessory: standup.member.avatar_url
				? {
						type: "image",
						image_url: standup.member.avatar_url,
						alt_text: standup.member.name,
				  }
				: undefined,
		});

		// Add standup details in a condensed format
		const sections = [];
		if (standup.yesterday.length > 0) {
			sections.push(`*Yesterday:* ${standup.yesterday.join(", ")}`);
		}
		if (standup.today.length > 0) {
			sections.push(`*Today:* ${standup.today.join(", ")}`);
		}
		if (standup.blockers.length > 0) {
			sections.push(`*Blockers:* ${standup.blockers.join(", ")}`);
		}

		if (sections.length > 0) {
			blocks.push({
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: sections.join("\n"),
					},
				],
			});
		}
	});

	return {
		blocks,
		username: "SprintForge",
		icon_emoji: ":rocket:",
	};
}

/**
 * Format PR alert message for high-risk or stale PRs
 */
export function formatPRAlertMessage(data: PRAlertData): SlackMessage {
	const isHighRisk = data.risk_score >= 7;
	const isStale = data.is_stale || data.days_open > 2;

	const alertType = isHighRisk ? "🚨 High Risk PR" : "⏰ Stale PR Alert";
	const color = isHighRisk ? "#ff4444" : "#ffaa00";

	const attachment: SlackAttachment = {
		color,
		title: `${data.repo}#${data.number}: ${data.title}`,
		title_link: data.url,
		fields: [
			{
				title: "Author",
				value: data.author,
				short: true,
			},
			{
				title: "Days Open",
				value: data.days_open.toString(),
				short: true,
			},
			{
				title: "Risk Score",
				value: `${data.risk_score}/10`,
				short: true,
			},
			{
				title: "Size Score",
				value: `${data.size_score}/10`,
				short: true,
			},
		],
		footer: "SprintForge PR Radar",
		footer_icon: "https://github.com/favicon.ico",
		ts: Math.floor(Date.now() / 1000),
	};

	// Add suggested reviewers if available
	if (data.suggested_reviewers && data.suggested_reviewers.length > 0) {
		attachment.fields!.push({
			title: "Suggested Reviewers",
			value: data.suggested_reviewers.join(", "),
			short: false,
		});
	}

	const blocks: SlackBlock[] = [
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `${alertType}: *<${data.url}|${data.repo}#${data.number}>*`,
			},
		},
	];

	// Add action buttons
	blocks.push({
		type: "actions",
		elements: [
			{
				type: "button",
				text: {
					type: "plain_text",
					text: "View PR",
					emoji: true,
				},
				url: data.url,
				action_id: "view_pr",
			},
		],
	});

	return {
		text: `${alertType}: ${data.repo}#${data.number}`,
		blocks,
		attachments: [attachment],
		username: "SprintForge PR Radar",
		icon_emoji: ":radar:",
	};
}

/**
 * Format simple text message for basic notifications
 */
export function formatSimpleMessage(
	text: string,
	options?: {
		emoji?: string;
		username?: string;
		color?: string;
	}
): SlackMessage {
	const message: SlackMessage = {
		text,
		username: options?.username || "SprintForge",
		icon_emoji: options?.emoji || ":rocket:",
	};

	if (options?.color) {
		message.attachments = [
			{
				color: options.color,
				text,
			},
		];
	}

	return message;
}

/**
 * Format error message for webhook failures
 */
export function formatErrorMessage(
	error: string,
	context?: string
): SlackMessage {
	return {
		text: `❌ SprintForge Error${context ? ` (${context})` : ""}: ${error}`,
		attachments: [
			{
				color: "#ff0000",
				fields: [
					{
						title: "Error",
						value: error,
						short: false,
					},
					...(context
						? [
								{
									title: "Context",
									value: context,
									short: false,
								},
						  ]
						: []),
					{
						title: "Timestamp",
						value: new Date().toISOString(),
						short: true,
					},
				],
				footer: "SprintForge Error Handler",
			},
		],
		username: "SprintForge",
		icon_emoji: ":warning:",
	};
}
