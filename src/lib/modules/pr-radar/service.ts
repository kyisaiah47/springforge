import { createClient } from "@/lib/supabase/server";
import { createGitHubService } from "@/lib/integrations/github-service";
import { createPRScoringService } from "./scoring";
import { createReviewerSuggestionService } from "./reviewer-suggestions";
import type {
	PRInsight,
	PRInsightInsert,
	GitHubPRData,
	CreatePRInsightRequest,
	CreatePRInsightResponse,
	GetPRInsightsRequest,
	GetPRInsightsResponse,
	ScorePRRequest,
	ScorePRResponse,
	GetReviewerSuggestionsRequest,
	GetReviewerSuggestionsResponse,
	StalePRAlert,
	GetStalePRsRequest,
	GetStalePRsResponse,
} from "./types";
import type { Database } from "@/lib/types/database";

/**
 * PR Radar service for managing PR insights, scoring, and reviewer suggestions
 */
export class PRRadarService {
	private scoringService = createPRScoringService();
	private reviewerService = createReviewerSuggestionService();

	private async getSupabase() {
		return await createClient();
	}

	/**
	 * Create or update PR insight from GitHub data
	 */
	async createPRInsight(
		orgId: string,
		request: CreatePRInsightRequest
	): Promise<CreatePRInsightResponse> {
		const supabase = await this.getSupabase();
		const { repo, number, github_data } = request;

		// Check if PR insight already exists
		const { data: existingInsight } = await supabase
			.from("pr_insights")
			.select("*")
			.eq("org_id", orgId)
			.eq("repo", repo)
			.eq("number", number)
			.single();

		// Calculate scores
		const scoreResult = this.scoringService.calculatePRScore(github_data);

		// Find author member if exists
		let authorMemberId: string | null = null;
		if (github_data.author?.login) {
			const { data: member } = await supabase
				.from("members")
				.select("id")
				.eq("org_id", orgId)
				.eq("github_login", github_data.author.login)
				.single();

			authorMemberId = member?.id || null;
		}

		// Extract touched paths from files
		const touchedPaths = github_data.files?.map((file) => file.filename) || [];

		// Prepare PR insight data
		const prInsightData: PRInsightInsert = {
			org_id: orgId,
			repo,
			number,
			author_member_id: authorMemberId,
			additions: github_data.additions,
			deletions: github_data.deletions,
			files_changed: github_data.changed_files,
			tests_changed: scoreResult.size_metrics.tests_changed,
			touched_paths: touchedPaths,
			size_score: scoreResult.size_score,
			risk_score: scoreResult.risk_score,
			suggested_reviewers: [], // Will be populated separately
			status: github_data.merged
				? "merged"
				: (github_data.state as "open" | "closed"),
			opened_at: github_data.created_at,
			updated_at: github_data.updated_at,
		};

		let prInsight: PRInsight;
		let created = false;

		if (existingInsight) {
			// Update existing insight
			const { data, error } = await supabase
				.from("pr_insights")
				.update({
					...prInsightData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingInsight.id)
				.select()
				.single();

			if (error) {
				throw new Error(`Failed to update PR insight: ${error.message}`);
			}
			prInsight = data;
		} else {
			// Create new insight
			const { data, error } = await supabase
				.from("pr_insights")
				.insert(prInsightData)
				.select()
				.single();

			if (error) {
				throw new Error(`Failed to create PR insight: ${error.message}`);
			}
			prInsight = data;
			created = true;
		}

		// Generate reviewer suggestions for open PRs
		if (
			prInsight.status === "open" &&
			touchedPaths.length > 0 &&
			github_data.author?.login
		) {
			try {
				const suggestions = await this.reviewerService.getReviewerSuggestions(
					orgId,
					{
						repo,
						number,
						touched_paths: touchedPaths,
						author_github_login: github_data.author.login,
					}
				);

				// Update PR insight with suggestions
				const suggestedReviewers = suggestions.suggestions
					.filter((s) => s.confidence_score >= suggestions.confidence_threshold)
					.map((s) => s.github_login);

				if (suggestedReviewers.length > 0) {
					await supabase
						.from("pr_insights")
						.update({ suggested_reviewers: suggestedReviewers })
						.eq("id", prInsight.id);

					prInsight.suggested_reviewers = suggestedReviewers;
				}
			} catch (error) {
				console.warn("Failed to generate reviewer suggestions:", error);
			}
		}

		return {
			pr_insight: prInsight,
			created,
		};
	}

	/**
	 * Get PR insights with filtering and pagination
	 */
	async getPRInsights(
		orgId: string,
		request: GetPRInsightsRequest = {}
	): Promise<GetPRInsightsResponse> {
		const supabase = await this.getSupabase();
		const {
			status,
			repo,
			author_member_id,
			risk_min,
			risk_max,
			limit = 20,
			cursor,
			order_by = "updated_at",
			order_dir = "desc",
		} = request;

		let query = supabase
			.from("pr_insights")
			.select(
				`
				*,
				author_member:members(github_login, avatar_url)
			`
			)
			.eq("org_id", orgId);

		// Apply filters
		if (status) {
			query = query.eq("status", status);
		}

		if (repo) {
			query = query.eq("repo", repo);
		}

		if (author_member_id) {
			query = query.eq("author_member_id", author_member_id);
		}

		if (risk_min !== undefined) {
			query = query.gte("risk_score", risk_min);
		}

		if (risk_max !== undefined) {
			query = query.lte("risk_score", risk_max);
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
			throw new Error(`Failed to fetch PR insights: ${error.message}`);
		}

		const prInsights = data || [];
		const hasMore = prInsights.length > limit;
		const results = hasMore ? prInsights.slice(0, limit) : prInsights;

		// Generate next cursor
		let nextCursor: string | undefined;
		if (hasMore && results.length > 0) {
			const lastItem = results[results.length - 1];
			const cursorValue = lastItem[order_by as keyof typeof lastItem] as string;
			nextCursor = Buffer.from(cursorValue).toString("base64");
		}

		return {
			pr_insights: results as GetPRInsightsResponse["pr_insights"],
			next_cursor: nextCursor,
			has_more: hasMore,
		};
	}

	/**
	 * Score a PR without storing the result
	 */
	async scorePR(
		orgId: string,
		request: ScorePRRequest
	): Promise<ScorePRResponse> {
		let githubData = request.github_data;

		// If no GitHub data provided, fetch it
		if (!githubData) {
			const supabase = await this.getSupabase();
			const { data: integration, error } = await supabase
				.from("integrations")
				.select("*")
				.eq("org_id", orgId)
				.eq("type", "github")
				.single();

			if (error) {
				throw new Error(`GitHub integration not found: ${error.message}`);
			}

			const githubService = createGitHubService(integration);
			githubData = await githubService.getPullRequest(
				request.repo,
				request.number
			);
		}

		const scoreResult = this.scoringService.calculatePRScore(githubData);

		// Check if PR insight exists
		const supabase = await this.getSupabase();
		const { data: prInsight } = await supabase
			.from("pr_insights")
			.select("*")
			.eq("org_id", orgId)
			.eq("repo", request.repo)
			.eq("number", request.number)
			.single();

		return {
			score_result: scoreResult,
			pr_insight: prInsight || undefined,
		};
	}

	/**
	 * Get reviewer suggestions for a PR
	 */
	async getReviewerSuggestions(
		orgId: string,
		request: GetReviewerSuggestionsRequest
	): Promise<GetReviewerSuggestionsResponse> {
		return this.reviewerService.getReviewerSuggestions(orgId, request);
	}

	/**
	 * Get stale PRs that need attention
	 */
	async getStalePRs(
		orgId: string,
		request: GetStalePRsRequest = {}
	): Promise<GetStalePRsResponse> {
		const supabase = await this.getSupabase();
		const { days_threshold = 2, repos, exclude_draft = true } = request;

		// Calculate stale date threshold
		const staleDate = new Date();
		staleDate.setDate(staleDate.getDate() - days_threshold);

		let query = supabase
			.from("pr_insights")
			.select(
				`
				*,
				author_member:members(github_login, avatar_url)
			`
			)
			.eq("org_id", orgId)
			.eq("status", "open")
			.lt("updated_at", staleDate.toISOString());

		// Apply filters
		if (repos && repos.length > 0) {
			query = query.in("repo", repos);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to fetch stale PRs: ${error.message}`);
		}

		const stalePRs: StalePRAlert[] = (data || []).map((pr) => {
			const updatedAt = new Date(pr.updated_at);
			const daysDiff = Math.floor(
				(Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
			);

			return {
				pr_insight: pr,
				days_stale: daysDiff,
				last_activity: pr.updated_at,
				alert_level: daysDiff >= 7 ? "critical" : "warning",
			};
		});

		return {
			stale_prs: stalePRs,
			total_count: stalePRs.length,
		};
	}

	/**
	 * Get PR insight by ID
	 */
	async getPRInsightById(
		orgId: string,
		prInsightId: string
	): Promise<PRInsight> {
		const supabase = await this.getSupabase();
		const { data, error } = await supabase
			.from("pr_insights")
			.select("*")
			.eq("org_id", orgId)
			.eq("id", prInsightId)
			.single();

		if (error) {
			throw new Error(`PR insight not found: ${error.message}`);
		}

		return data;
	}

	/**
	 * Update PR insight status
	 */
	async updatePRStatus(
		orgId: string,
		repo: string,
		number: number,
		status: "open" | "merged" | "closed"
	): Promise<PRInsight | null> {
		const supabase = await this.getSupabase();
		const { data, error } = await supabase
			.from("pr_insights")
			.update({
				status,
				updated_at: new Date().toISOString(),
			})
			.eq("org_id", orgId)
			.eq("repo", repo)
			.eq("number", number)
			.select()
			.single();

		if (error) {
			console.warn(`Failed to update PR status: ${error.message}`);
			return null;
		}

		return data;
	}
}

/**
 * Create PR Radar service instance
 */
export function createPRRadarService(): PRRadarService {
	return new PRRadarService();
}
