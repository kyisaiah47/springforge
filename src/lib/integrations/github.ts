import { Database } from "@/lib/types/database";

// GitHub API types
export interface GitHubUser {
	id: number;
	login: string;
	avatar_url: string;
	email?: string;
}

export interface GitHubCommit {
	sha: string;
	commit: {
		message: string;
		author: {
			name: string;
			email: string;
			date: string;
		};
	};
	author: GitHubUser | null;
	html_url: string;
}

export interface GitHubPullRequest {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: "open" | "closed";
	merged: boolean;
	user: GitHubUser;
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	additions: number;
	deletions: number;
	changed_files: number;
	commits: number;
	html_url: string;
	head: {
		ref: string;
		sha: string;
	};
	base: {
		ref: string;
		sha: string;
		repo: {
			name: string;
			full_name: string;
		};
	};
}

export interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: "open" | "closed";
	user: GitHubUser;
	assignees: GitHubUser[];
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	html_url: string;
	labels: Array<{
		name: string;
		color: string;
	}>;
}

export interface GitHubFile {
	filename: string;
	status: "added" | "removed" | "modified" | "renamed";
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
}

// GitHub API client configuration
export interface GitHubClientConfig {
	accessToken: string;
	baseUrl?: string;
}

// GitHub API error types
export class GitHubAPIError extends Error {
	constructor(message: string, public status: number, public response?: any) {
		super(message);
		this.name = "GitHubAPIError";
	}
}

/**
 * GitHub API client with OAuth token management
 */
export class GitHubClient {
	private accessToken: string;
	private baseUrl: string;

	constructor(config: GitHubClientConfig) {
		this.accessToken = config.accessToken;
		this.baseUrl = config.baseUrl || "https://api.github.com";
	}

	/**
	 * Make authenticated request to GitHub API
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "SprintForge/1.0",
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new GitHubAPIError(
				errorData.message || `GitHub API error: ${response.status}`,
				response.status,
				errorData
			);
		}

		return response.json();
	}

	/**
	 * Get authenticated user information
	 */
	async getUser(): Promise<GitHubUser> {
		return this.request<GitHubUser>("/user");
	}

	/**
	 * Get user commits for a specific repository within a date range
	 */
	async getUserCommits(
		owner: string,
		repo: string,
		username: string,
		since?: string,
		until?: string
	): Promise<GitHubCommit[]> {
		const params = new URLSearchParams({
			author: username,
			...(since && { since }),
			...(until && { until }),
			per_page: "100",
		});

		return this.request<GitHubCommit[]>(
			`/repos/${owner}/${repo}/commits?${params}`
		);
	}

	/**
	 * Get all commits for a user across their accessible repositories
	 */
	async getAllUserCommits(
		username: string,
		since?: string,
		until?: string
	): Promise<Array<GitHubCommit & { repo: string }>> {
		// Get user's repositories
		const repos = await this.getUserRepositories(username);
		const allCommits: Array<GitHubCommit & { repo: string }> = [];

		// Fetch commits from each repository
		for (const repo of repos) {
			try {
				const commits = await this.getUserCommits(
					repo.owner.login,
					repo.name,
					username,
					since,
					until
				);

				allCommits.push(
					...commits.map((commit) => ({
						...commit,
						repo: `${repo.owner.login}/${repo.name}`,
					}))
				);
			} catch (error) {
				// Skip repositories where we don't have access
				if (error instanceof GitHubAPIError && error.status === 403) {
					continue;
				}
				throw error;
			}
		}

		return allCommits;
	}

	/**
	 * Get user's repositories
	 */
	async getUserRepositories(username?: string): Promise<
		Array<{
			id: number;
			name: string;
			full_name: string;
			owner: GitHubUser;
			private: boolean;
		}>
	> {
		const endpoint = username ? `/users/${username}/repos` : "/user/repos";
		const params = new URLSearchParams({
			per_page: "100",
			sort: "updated",
		});

		return this.request<
			Array<{
				id: number;
				name: string;
				full_name: string;
				owner: GitHubUser;
				private: boolean;
			}>
		>(`${endpoint}?${params}`);
	}

	/**
	 * Get pull requests for a repository
	 */
	async getPullRequests(
		owner: string,
		repo: string,
		state: "open" | "closed" | "all" = "all",
		since?: string
	): Promise<GitHubPullRequest[]> {
		const params = new URLSearchParams({
			state,
			per_page: "100",
			sort: "updated",
			direction: "desc",
		});

		const prs = await this.request<GitHubPullRequest[]>(
			`/repos/${owner}/${repo}/pulls?${params}`
		);

		// Filter by date if since is provided
		if (since) {
			const sinceDate = new Date(since);
			return prs.filter((pr) => new Date(pr.updated_at) >= sinceDate);
		}

		return prs;
	}

	/**
	 * Get detailed pull request information including file changes
	 */
	async getPullRequestDetails(
		owner: string,
		repo: string,
		prNumber: number
	): Promise<GitHubPullRequest & { files: GitHubFile[] }> {
		const [pr, files] = await Promise.all([
			this.request<GitHubPullRequest>(
				`/repos/${owner}/${repo}/pulls/${prNumber}`
			),
			this.request<GitHubFile[]>(
				`/repos/${owner}/${repo}/pulls/${prNumber}/files`
			),
		]);

		return { ...pr, files };
	}

	/**
	 * Get issues for a repository
	 */
	async getIssues(
		owner: string,
		repo: string,
		state: "open" | "closed" | "all" = "all",
		assignee?: string,
		since?: string
	): Promise<GitHubIssue[]> {
		const params = new URLSearchParams({
			state,
			per_page: "100",
			sort: "updated",
			direction: "desc",
			...(assignee && { assignee }),
		});

		const issues = await this.request<GitHubIssue[]>(
			`/repos/${owner}/${repo}/issues?${params}`
		);

		// Filter out pull requests (GitHub API includes PRs in issues endpoint)
		const filteredIssues = issues.filter((issue) => !("pull_request" in issue));

		// Filter by date if since is provided
		if (since) {
			const sinceDate = new Date(since);
			return filteredIssues.filter(
				(issue) => new Date(issue.updated_at) >= sinceDate
			);
		}

		return filteredIssues;
	}

	/**
	 * Get user's assigned issues across repositories
	 */
	async getUserIssues(
		username: string,
		since?: string
	): Promise<Array<GitHubIssue & { repo: string }>> {
		const repos = await this.getUserRepositories(username);
		const allIssues: Array<GitHubIssue & { repo: string }> = [];

		for (const repo of repos) {
			try {
				const issues = await this.getIssues(
					repo.owner.login,
					repo.name,
					"all",
					username,
					since
				);

				allIssues.push(
					...issues.map((issue) => ({
						...issue,
						repo: `${repo.owner.login}/${repo.name}`,
					}))
				);
			} catch (error) {
				// Skip repositories where we don't have access
				if (error instanceof GitHubAPIError && error.status === 403) {
					continue;
				}
				throw error;
			}
		}

		return allIssues;
	}

	/**
	 * Get a single pull request (alias for getPullRequestDetails)
	 */
	async getPullRequest(
		repo: string,
		number: number
	): Promise<GitHubPullRequest & { files: GitHubFile[] }> {
		const [owner, repoName] = repo.split("/");
		return this.getPullRequestDetails(owner, repoName, number);
	}

	/**
	 * Get commits for a specific file
	 */
	async getFileCommits(
		repo: string,
		filePath: string,
		limit: number = 50
	): Promise<GitHubCommit[]> {
		const [owner, repoName] = repo.split("/");
		const params = new URLSearchParams({
			path: filePath,
			per_page: Math.min(limit, 100).toString(),
		});

		return this.request<GitHubCommit[]>(
			`/repos/${owner}/${repoName}/commits?${params}`
		);
	}
}

/**
 * Create GitHub client from integration record
 */
export function createGitHubClient(
	integration: Database["public"]["Tables"]["integrations"]["Row"]
): GitHubClient {
	if (integration.type !== "github") {
		throw new Error("Integration is not a GitHub integration");
	}

	if (!integration.access_token) {
		throw new Error("GitHub integration missing access token");
	}

	return new GitHubClient({
		accessToken: integration.access_token,
	});
}
