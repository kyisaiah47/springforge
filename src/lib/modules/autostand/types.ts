import type { Database } from "@/lib/types/database";

// Database types
export type Standup = Database["public"]["Tables"]["standups"]["Row"];
export type StandupInsert = Database["public"]["Tables"]["standups"]["Insert"];
export type StandupUpdate = Database["public"]["Tables"]["standups"]["Update"];

// GitHub activity data structures
export interface GitHubCommit {
	sha: string;
	message: string;
	url: string;
	repository: string;
	timestamp: string;
}

export interface GitHubPullRequest {
	number: number;
	title: string;
	url: string;
	repository: string;
	state: "open" | "closed" | "merged";
	created_at: string;
	merged_at?: string;
}

export interface GitHubIssue {
	number: number;
	title: string;
	url: string;
	repository: string;
	state: "open" | "closed";
	created_at: string;
	closed_at?: string;
}

export interface GitHubActivity {
	commits: GitHubCommit[];
	pullRequests: GitHubPullRequest[];
	issues: GitHubIssue[];
}

// Standup generation result
export interface StandupData {
	yesterday: string[];
	today: string[];
	blockers: string[];
	raw_github_data: GitHubActivity;
}

// API request/response types
export interface GenerateStandupRequest {
	member_id: string;
	date?: string; // ISO date string, defaults to today
}

export interface GenerateStandupResponse {
	standup: Standup;
	generated: boolean; // true if new, false if existing
}

export interface GetStandupsRequest {
	member_id?: string;
	date_from?: string;
	date_to?: string;
	limit?: number;
	cursor?: string;
	order_by?: "date" | "created_at";
	order_dir?: "asc" | "desc";
}

export interface GetStandupsResponse {
	standups: Array<
		Standup & { member: { github_login: string; avatar_url: string | null } }
	>;
	next_cursor?: string;
	has_more: boolean;
}

// Cron job types
export interface JobExecutionResult {
	success: boolean;
	processed_orgs: number;
	processed_members: number;
	generated_standups: number;
	sent_messages: number;
	errors: string[];
	execution_time_ms: number;
}

export interface JobLock {
	id: string;
	job_name: string;
	locked_at: string;
	locked_by: string;
	expires_at: string;
	metadata: Record<string, any>;
	created_at: string;
}
