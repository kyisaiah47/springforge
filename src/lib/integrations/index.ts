// GitHub Integration
export {
	GitHubClient,
	GitHubAPIError,
	createGitHubClient,
	type GitHubUser,
	type GitHubCommit,
	type GitHubPullRequest,
	type GitHubIssue,
	type GitHubFile,
	type GitHubClientConfig,
} from "./github";

// GitHub Service
export { GitHubService, createGitHubService } from "./github-service";

// Slack Integration
export {
	SlackClient,
	SlackAPIError,
	createSlackClient,
	type SlackClientConfig,
	type SlackMessage,
	type SlackBlock,
	type SlackAttachment,
} from "./slack";

// Slack Service
export { SlackService, createSlackService } from "./slack-service";

// Slack Message Formatting
export {
	formatStandupMessage,
	formatTeamStandupSummary,
	formatPRAlertMessage,
	formatSimpleMessage,
	formatErrorMessage,
	type StandupData,
	type TeamStandupData,
	type PRAlertData,
} from "./slack-messages";

// Slack Validation
export {
	validateSlackWebhookUrl,
	validateSlackBotToken,
	validateSlackSettings,
	testSlackIntegration,
	normalizeSlackWebhookUrl,
	getSlackWebhookInstructions,
	type WebhookValidationResult,
	type SlackSettingsValidation,
} from "./slack-validation";

// PR Scoring
export {
	calculateSizeScore,
	calculateTestCoverageRisk,
	calculateCriticalPathRisk,
	calculateComplexityRisk,
	calculateRiskScore,
	calculatePRScore,
	generateRecommendations,
	suggestReviewers,
	DEFAULT_SCORING_CONFIG,
	type PRScoringConfig,
	type PRScore,
} from "./pr-scoring";
