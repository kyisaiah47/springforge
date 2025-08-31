import { createClient } from "@/lib/supabase/server";
import { createGitHubService } from "@/lib/integrations/github-service";
import type {
	Standup,
	StandupInsert,
	GitHubActivity,
	StandupData,
	GenerateStandupRequest,
	GenerateStandupResponse,
	GetStandupsRequest,
	GetStandupsResponse,
} from "./types";
import type { Database } from "@/lib/types/database";

/**
 * AutoStand service for managing standup generation and retrieval
 */
export class AutoStandService {
	private async getSupabase() {
		return await createClient();
	}

	/**
	 * Generate standup from GitHub activity
	 */
	async generateStandup(
		orgId: string,
		request: GenerateStandupRequest
	): Promise<GenerateStandupResponse> {
		const supabase = await this.getSupabase();
		const date = request.date || new Date().toISOString().split("T")[0];

		// Check if standup already exists for this date
		const { data: existingStandup } = await supabase
			.from("standups")
			.select("*")
			.eq("org_id", orgId)
			.eq("member_id", request.member_id)
			.eq("date", date)
			.single();

		if (existingStandup) {
			return {
				standup: existingStandup,
				generated: false,
			};
		}

		// Get member and GitHub integration
		const [memberResult, integrationResult] = await Promise.all([
			supabase
				.from("members")
				.select("*")
				.eq("id", request.member_id)
				.eq("org_id", orgId)
				.single(),
			supabase
				.from("integrations")
				.select("*")
				.eq("org_id", orgId)
				.eq("type", "github")
				.single(),
		]);

		if (memberResult.error) {
			throw new Error(`Member not found: ${memberResult.error.message}`);
		}

		if (integrationResult.error) {
			throw new Error(
				`GitHub integration not found: ${integrationResult.error.message}`
			);
		}

		const member = memberResult.data;
		const integration = integrationResult.data;

		if (!member.github_login) {
			throw new Error("Member does not have a GitHub login configured");
		}

		// Generate standup data from GitHub activity
		const standupData = await this.generateStandupFromGitHub(
			member.github_login,
			integration,
			date
		);

		// Insert standup into database
		const { data: standup, error } = await supabase
			.from("standups")
			.insert({
				org_id: orgId,
				member_id: request.member_id,
				date,
				yesterday: standupData.yesterday,
				today: standupData.today,
				blockers: standupData.blockers,
				raw_github_data: standupData.raw_github_data,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create standup: ${error.message}`);
		}

		return {
			standup,
			generated: true,
		};
	}

	/**
	 * Get standups with filtering and pagination
	 */
	async getStandups(
		orgId: string,
		request: GetStandupsRequest = {}
	): Promise<GetStandupsResponse> {
		const supabase = await this.getSupabase();
		const {
			member_id,
			date_from,
			date_to,
			limit = 20,
			cursor,
			order_by = "date",
			order_dir = "desc",
		} = request;

		let query = supabase
			.from("standups")
			.select(
				`
				*,
				member:members!inner(github_login, avatar_url)
			`
			)
			.eq("org_id", orgId);

		// Apply filters
		if (member_id) {
			query = query.eq("member_id", member_id);
		}

		if (date_from) {
			query = query.gte("date", date_from);
		}

		if (date_to) {
			query = query.lte("date", date_to);
		}

		// Apply cursor-based pagination
		if (cursor) {
			const cursorValue = Buffer.from(cursor, "base64").toString();
			if (order_dir === "desc") {
				query = query.lt(order_by, cursorValue);
			} else {
				query = query.gt(order_by, cursorValue);
			}
		}

		// Apply ordering and limit
		query = query.order(order_by, { ascending: order_dir === "asc" });
		query = query.limit(limit + 1); // Fetch one extra to check if there are more

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to fetch standups: ${error.message}`);
		}

		const standups = data || [];
		const hasMore = standups.length > limit;
		const results = hasMore ? standups.slice(0, limit) : standups;

		// Generate next cursor
		let nextCursor: string | undefined;
		if (hasMore && results.length > 0) {
			const lastItem = results[results.length - 1];
			const cursorValue = lastItem[order_by as keyof typeof lastItem] as string;
			nextCursor = Buffer.from(cursorValue).toString("base64");
		}

		return {
			standups: results as GetStandupsResponse["standups"],
			next_cursor: nextCursor,
			has_more: hasMore,
		};
	}

	/**
	 * Get standup by ID
	 */
	async getStandupById(orgId: string, standupId: string): Promise<Standup> {
		const supabase = await this.getSupabase();
		const { data, error } = await supabase
			.from("standups")
			.select("*")
			.eq("org_id", orgId)
			.eq("id", standupId)
			.single();

		if (error) {
			throw new Error(`Standup not found: ${error.message}`);
		}

		return data;
	}

	/**
	 * Generate standup data from GitHub activity
	 */
	private async generateStandupFromGitHub(
		githubLogin: string,
		integration: Database["public"]["Tables"]["integrations"]["Row"],
		date: string
	): Promise<StandupData> {
		const githubService = createGitHubService(integration);

		// Calculate date range (yesterday's activity)
		const targetDate = new Date(date);
		const yesterday = new Date(targetDate);
		yesterday.setDate(yesterday.getDate() - 1);

		const since = yesterday.toISOString();
		const until = targetDate.toISOString();

		try {
			// Fetch GitHub activity
			const activity = await githubService.getUserActivity(
				githubLogin,
				since,
				until
			);

			// Transform GitHub data to our format
			const githubActivity: GitHubActivity = {
				commits: activity.commits.map((commit) => ({
					sha: commit.sha,
					message: commit.commit.message,
					url: commit.html_url,
					repository: "unknown", // Repository info not available in this context
					timestamp: commit.commit.author?.date || since,
				})),
				pullRequests: activity.pullRequests.map(({ repo, pr }) => ({
					number: pr.number,
					title: pr.title,
					url: pr.html_url,
					repository: repo,
					state: pr.merged ? "merged" : (pr.state as "open" | "closed"),
					created_at: pr.created_at,
					merged_at: pr.merged_at || undefined,
				})),
				issues: activity.issues.map((issue) => ({
					number: issue.number,
					title: issue.title,
					url: issue.html_url,
					repository: "unknown", // Repository info not available in this context
					state: issue.state as "open" | "closed",
					created_at: issue.created_at,
					closed_at: issue.closed_at || undefined,
				})),
			};

			// Generate standup content
			const yesterday = this.generateYesterdayItems(githubActivity);
			const today = this.generateTodayItems(githubActivity);
			const blockers: string[] = []; // No automatic blocker detection for now

			return {
				yesterday,
				today,
				blockers,
				raw_github_data: githubActivity,
			};
		} catch (error) {
			console.error("Failed to fetch GitHub activity:", error);

			// Return empty standup if GitHub fetch fails
			return {
				yesterday: ["Unable to fetch GitHub activity"],
				today: ["Continue working on current tasks"],
				blockers: [],
				raw_github_data: {
					commits: [],
					pullRequests: [],
					issues: [],
				},
			};
		}
	}

	/**
	 * Generate "yesterday" items from GitHub activity
	 */
	private generateYesterdayItems(activity: GitHubActivity): string[] {
		const items: string[] = [];

		// Add commits
		if (activity.commits.length > 0) {
			const commitsByRepo = activity.commits.reduce((acc, commit) => {
				if (!acc[commit.repository]) {
					acc[commit.repository] = [];
				}
				acc[commit.repository].push(commit);
				return acc;
			}, {} as Record<string, typeof activity.commits>);

			Object.entries(commitsByRepo).forEach(([repo, commits]) => {
				if (commits.length === 1) {
					items.push(`Committed "${commits[0].message}" to ${repo}`);
				} else {
					items.push(`Made ${commits.length} commits to ${repo}`);
				}
			});
		}

		// Add merged PRs
		const mergedPRs = activity.pullRequests.filter(
			(pr) => pr.state === "merged"
		);
		mergedPRs.forEach((pr) => {
			items.push(`Merged PR #${pr.number}: ${pr.title} in ${pr.repository}`);
		});

		// Add opened PRs
		const openedPRs = activity.pullRequests.filter((pr) => pr.state === "open");
		openedPRs.forEach((pr) => {
			items.push(`Opened PR #${pr.number}: ${pr.title} in ${pr.repository}`);
		});

		// Add closed issues
		const closedIssues = activity.issues.filter(
			(issue) => issue.state === "closed"
		);
		closedIssues.forEach((issue) => {
			items.push(
				`Closed issue #${issue.number}: ${issue.title} in ${issue.repository}`
			);
		});

		return items.length > 0 ? items : ["No GitHub activity recorded"];
	}

	/**
	 * Generate "today" items based on current work
	 */
	private generateTodayItems(activity: GitHubActivity): string[] {
		const items: string[] = [];

		// Add open PRs as today's work
		const openPRs = activity.pullRequests.filter((pr) => pr.state === "open");
		openPRs.forEach((pr) => {
			items.push(
				`Continue work on PR #${pr.number}: ${pr.title} in ${pr.repository}`
			);
		});

		// Add open issues as today's work
		const openIssues = activity.issues.filter(
			(issue) => issue.state === "open"
		);
		openIssues.forEach((issue) => {
			items.push(
				`Work on issue #${issue.number}: ${issue.title} in ${issue.repository}`
			);
		});

		return items.length > 0 ? items : ["Continue current development tasks"];
	}
}

/**
 * Create AutoStand service instance
 */
export function createAutoStandService(): AutoStandService {
	return new AutoStandService();
}
