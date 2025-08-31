import type { Database } from "@/lib/types/database";

// Database types
export type PRInsight = Database["public"]["Tables"]["pr_insights"]["Row"];
export type PRInsightInsert =
	Database["public"]["Tables"]["pr_insights"]["Insert"];
export type PRInsightUpdate =
	Database["public"]["Tables"]["pr_insights"]["Update"];

// GitHub PR data structures
export interface GitHubPRData {
	number: number;
	title: string;
	body: string;
	state: "open" | "closed";
	merged: boolean;
	additions: number;
	deletions: number;
	changed_files: number;
	commits: number;
	author: {
		login: string;
		id: number;
	};
	base: {
		ref: string;
		repo: {
			name: string;
			full_name: string;
		};
	};
	head: {
		ref: string;
	};
	created_at: string;
	updated_at: string;
	merged_at?: string | null;
	files?: GitHubPRFile[];
}

export interface GitHubPRFile {
	filename: string;
	status: "added" | "removed" | "modified" | "renamed";
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
}

// PR scoring data structures
export interface PRSizeMetrics {
	additions: number;
	deletions: number;
	files_changed: number;
	tests_changed: number;
	total_changes: number;
}

export interface PRRiskFactors {
	size_factor: number;
	complexity_factor: number;
	test_coverage_factor: number;
	file_type_factor: number;
	author_experience_factor: number;
}

export interface PRScoreResult {
	size_score: number;
	risk_score: number;
	risk_factors: PRRiskFactors;
	size_metrics: PRSizeMetrics;
}

// Reviewer suggestion data structures
export interface CodeOwnershipData {
	file_path: string;
	primary_contributors: string[];
	recent_contributors: string[];
	expertise_score: number;
}

export interface ReviewerSuggestion {
	github_login: string;
	member_id?: string;
	confidence_score: number;
	reasoning: string[];
	expertise_areas: string[];
}

// API request/response types
export interface CreatePRInsightRequest {
	repo: string;
	number: number;
	github_data: GitHubPRData;
}

export interface CreatePRInsightResponse {
	pr_insight: PRInsight;
	created: boolean;
}

export interface GetPRInsightsRequest {
	status?: "open" | "merged" | "closed";
	repo?: string;
	author_member_id?: string;
	risk_min?: number;
	risk_max?: number;
	limit?: number;
	cursor?: string;
	order_by?: "opened_at" | "updated_at" | "risk_score" | "size_score";
	order_dir?: "asc" | "desc";
}

export interface GetPRInsightsResponse {
	pr_insights: Array<
		PRInsight & {
			author_member: {
				github_login: string;
				avatar_url: string | null;
			} | null;
		}
	>;
	next_cursor?: string;
	has_more: boolean;
}

export interface ScorePRRequest {
	repo: string;
	number: number;
	github_data?: GitHubPRData;
}

export interface ScorePRResponse {
	score_result: PRScoreResult;
	pr_insight?: PRInsight;
}

export interface GetReviewerSuggestionsRequest {
	repo: string;
	number: number;
	touched_paths: string[];
	author_github_login: string;
}

export interface GetReviewerSuggestionsResponse {
	suggestions: ReviewerSuggestion[];
	confidence_threshold: number;
}

// Stale PR detection
export interface StalePRAlert {
	pr_insight: PRInsight;
	days_stale: number;
	last_activity: string;
	alert_level: "warning" | "critical";
}

export interface GetStalePRsRequest {
	days_threshold?: number;
	repos?: string[];
	exclude_draft?: boolean;
}

export interface GetStalePRsResponse {
	stale_prs: StalePRAlert[];
	total_count: number;
}
