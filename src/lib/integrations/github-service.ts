import { GitHubClient, createGitHubClient } from "./github";
import { calculatePRScore, suggestReviewers, type PRScore } from "./pr-scoring";
import type { Database } from "@/lib/types/database";

/**
 * High-level GitHub service that combines API client with scoring algorithms
 */
export class GitHubService {
	private client: GitHubClient;

	constructor(
		integration: Database["public"]["Tables"]["integrations"]["Row"]
	) {
		this.client = createGitHubClient(integration);
	}

	/**
	 * Get GitHub client for direct API access
	 */
	getClient(): GitHubClient {
		return this.client;
	}

	/**
	 * Get comprehensive PR analysis including score and recommendations
	 */
	async analyzePullRequest(
		owner: string,
		repo: string,
		prNumber: number,
		teamMembers?: Array<{ github_login: string; expertise?: string[] }>
	): Promise<{
		pr: Awaited<ReturnType<GitHubClient["getPullRequestDetails"]>>;
		score: PRScore;
		suggestedReviewers: string[];
	}> {
		// Get PR details with file changes
		const pr = await this.client.getPullRequestDetails(owner, repo, prNumber);

		// Calculate PR score
		const score = calculatePRScore(pr, pr.files);

		// Suggest reviewers if team members provided
		const suggestedReviewers = teamMembers
			? suggestReviewers(pr.files, teamMembers)
			: [];

		return {
			pr,
			score,
			suggestedReviewers,
		};
	}

	/**
	 * Get pull request details (alias for client method)
	 */
	async getPullRequest(
		repo: string,
		number: number
	): Promise<Awaited<ReturnType<GitHubClient["getPullRequestDetails"]>>> {
		const [owner, repoName] = repo.split("/");
		return this.client.getPullRequestDetails(owner, repoName, number);
	}

	/**
	 * Get file commits (alias for client method)
	 */
	async getFileCommits(
		repo: string,
		filePath: string,
		limit?: number
	): Promise<Awaited<ReturnType<GitHubClient["getFileCommits"]>>> {
		return this.client.getFileCommits(repo, filePath, limit);
	}

	/**
	 * Get user activity for standup generation
	 */
	async getUserActivity(
		username: string,
		since: string,
		until?: string
	): Promise<{
		commits: Array<Awaited<ReturnType<GitHubClient["getAllUserCommits"]>>[0]>;
		pullRequests: Array<{
			repo: string;
			pr: Awaited<ReturnType<GitHubClient["getPullRequests"]>>[0];
		}>;
		issues: Array<Awaited<ReturnType<GitHubClient["getUserIssues"]>>[0]>;
	}> {
		const [commits, issues] = await Promise.all([
			this.client.getAllUserCommits(username, since, until),
			this.client.getUserIssues(username, since),
		]);

		// Get PRs from user's repositories
		const repos = await this.client.getUserRepositories(username);
		const pullRequests: Array<{
			repo: string;
			pr: Awaited<ReturnType<GitHubClient["getPullRequests"]>>[0];
		}> = [];

		for (const repo of repos) {
			try {
				const prs = await this.client.getPullRequests(
					repo.owner.login,
					repo.name,
					"all",
					since
				);

				// Filter PRs by the user
				const userPRs = prs.filter((pr) => pr.user.login === username);
				pullRequests.push(
					...userPRs.map((pr) => ({
						repo: repo.full_name,
						pr,
					}))
				);
			} catch (error) {
				// Skip repositories where we don't have access
				continue;
			}
		}

		return {
			commits,
			pullRequests,
			issues,
		};
	}

	/**
	 * Get team PR insights for dashboard
	 */
	async getTeamPRInsights(
		repositories: Array<{ owner: string; name: string }>,
		teamMembers: string[]
	): Promise<
		Array<{
			repo: string;
			pr: Awaited<ReturnType<GitHubClient["getPullRequestDetails"]>>;
			score: PRScore;
			isTeamMember: boolean;
		}>
	> {
		const insights: Array<{
			repo: string;
			pr: Awaited<ReturnType<GitHubClient["getPullRequestDetails"]>>;
			score: PRScore;
			isTeamMember: boolean;
		}> = [];

		for (const repo of repositories) {
			try {
				const prs = await this.client.getPullRequests(
					repo.owner,
					repo.name,
					"open"
				);

				for (const pr of prs) {
					const prDetails = await this.client.getPullRequestDetails(
						repo.owner,
						repo.name,
						pr.number
					);

					const score = calculatePRScore(prDetails, prDetails.files);
					const isTeamMember = teamMembers.includes(pr.user.login);

					insights.push({
						repo: `${repo.owner}/${repo.name}`,
						pr: prDetails,
						score,
						isTeamMember,
					});
				}
			} catch (error) {
				// Skip repositories where we don't have access
				continue;
			}
		}

		// Sort by risk score (highest first)
		return insights.sort((a, b) => b.score.riskScore - a.score.riskScore);
	}
}

/**
 * Create GitHub service from integration record
 */
export function createGitHubService(
	integration: Database["public"]["Tables"]["integrations"]["Row"]
): GitHubService {
	return new GitHubService(integration);
}
