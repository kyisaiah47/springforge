export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			organizations: {
				Row: {
					id: string;
					name: string;
					settings: Json;
					created_at: string;
					deleted_at: string | null;
				};
				Insert: {
					id?: string;
					name: string;
					settings?: Json;
					created_at?: string;
					deleted_at?: string | null;
				};
				Update: {
					id?: string;
					name?: string;
					settings?: Json;
					created_at?: string;
					deleted_at?: string | null;
				};
				Relationships: [];
			};
			members: {
				Row: {
					id: string;
					org_id: string;
					email: string;
					github_login: string | null;
					github_id: string | null;
					avatar_url: string | null;
					slack_user_id: string | null;
					role: "admin" | "member";
					created_at: string;
					deleted_at: string | null;
				};
				Insert: {
					id?: string;
					org_id: string;
					email: string;
					github_login?: string | null;
					github_id?: string | null;
					avatar_url?: string | null;
					slack_user_id?: string | null;
					role?: "admin" | "member";
					created_at?: string;
					deleted_at?: string | null;
				};
				Update: {
					id?: string;
					org_id?: string;
					email?: string;
					github_login?: string | null;
					github_id?: string | null;
					avatar_url?: string | null;
					slack_user_id?: string | null;
					role?: "admin" | "member";
					created_at?: string;
					deleted_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "members_org_id_fkey";
						columns: ["org_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					}
				];
			};
			integrations: {
				Row: {
					id: string;
					org_id: string;
					type: "github" | "slack";
					access_token: string | null;
					settings: Json;
					created_at: string;
					deleted_at: string | null;
				};
				Insert: {
					id?: string;
					org_id: string;
					type: "github" | "slack";
					access_token?: string | null;
					settings?: Json;
					created_at?: string;
					deleted_at?: string | null;
				};
				Update: {
					id?: string;
					org_id?: string;
					type?: "github" | "slack";
					access_token?: string | null;
					settings?: Json;
					created_at?: string;
					deleted_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "integrations_org_id_fkey";
						columns: ["org_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					}
				];
			};
			standups: {
				Row: {
					id: string;
					org_id: string;
					member_id: string;
					date: string;
					yesterday: string[];
					today: string[];
					blockers: string[];
					raw_github_data: Json | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					org_id: string;
					member_id: string;
					date: string;
					yesterday?: string[];
					today?: string[];
					blockers?: string[];
					raw_github_data?: Json | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					org_id?: string;
					member_id?: string;
					date?: string;
					yesterday?: string[];
					today?: string[];
					blockers?: string[];
					raw_github_data?: Json | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "standups_org_id_fkey";
						columns: ["org_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "standups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					}
				];
			};
			pr_insights: {
				Row: {
					id: string;
					org_id: string;
					repo: string;
					number: number;
					author_member_id: string | null;
					additions: number;
					deletions: number;
					files_changed: number;
					tests_changed: number;
					touched_paths: string[];
					size_score: number;
					risk_score: number;
					suggested_reviewers: string[];
					status: "open" | "merged" | "closed";
					opened_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					org_id: string;
					repo: string;
					number: number;
					author_member_id?: string | null;
					additions?: number;
					deletions?: number;
					files_changed?: number;
					tests_changed?: number;
					touched_paths?: string[];
					size_score?: number;
					risk_score?: number;
					suggested_reviewers?: string[];
					status?: "open" | "merged" | "closed";
					opened_at: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					org_id?: string;
					repo?: string;
					number?: number;
					author_member_id?: string | null;
					additions?: number;
					deletions?: number;
					files_changed?: number;
					tests_changed?: number;
					touched_paths?: string[];
					size_score?: number;
					risk_score?: number;
					suggested_reviewers?: string[];
					status?: "open" | "merged" | "closed";
					opened_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "pr_insights_org_id_fkey";
						columns: ["org_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "pr_insights_author_member_id_fkey";
						columns: ["author_member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					}
				];
			};
			retros: {
				Row: {
					id: string;
					org_id: string;
					title: string;
					sprint: string | null;
					status: "planning" | "active" | "voting" | "completed" | "archived";
					created_by: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					org_id: string;
					title: string;
					sprint?: string | null;
					status?: "planning" | "active" | "voting" | "completed" | "archived";
					created_by: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					org_id?: string;
					title?: string;
					sprint?: string | null;
					status?: "planning" | "active" | "voting" | "completed" | "archived";
					created_by?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "retros_org_id_fkey";
						columns: ["org_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "retros_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					}
				];
			};
			retro_notes: {
				Row: {
					id: string;
					retro_id: string;
					author_member_id: string | null;
					column_key: "went_well" | "went_poorly" | "ideas" | "action_items";
					text: string;
					color: string;
					votes: number;
					is_anonymous: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					retro_id: string;
					author_member_id?: string | null;
					column_key: "went_well" | "went_poorly" | "ideas" | "action_items";
					text: string;
					color?: string;
					votes?: number;
					is_anonymous?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					retro_id?: string;
					author_member_id?: string | null;
					column_key?: "went_well" | "went_poorly" | "ideas" | "action_items";
					text?: string;
					color?: string;
					votes?: number;
					is_anonymous?: boolean;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "retro_notes_retro_id_fkey";
						columns: ["retro_id"];
						isOneToOne: false;
						referencedRelation: "retros";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "retro_notes_author_member_id_fkey";
						columns: ["author_member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					}
				];
			};
			arcade_levels: {
				Row: {
					id: string;
					slug: string;
					title: string;
					description: string;
					language: "typescript" | "python";
					difficulty: "easy" | "medium" | "hard";
					starter_code: string;
					test_cases: string;
					solution: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					slug: string;
					title: string;
					description: string;
					language: "typescript" | "python";
					difficulty: "easy" | "medium" | "hard";
					starter_code: string;
					test_cases: string;
					solution: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					slug?: string;
					title?: string;
					description?: string;
					language?: "typescript" | "python";
					difficulty?: "easy" | "medium" | "hard";
					starter_code?: string;
					test_cases?: string;
					solution?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			arcade_runs: {
				Row: {
					id: string;
					level_id: string;
					member_id: string;
					submitted_code: string;
					passed: boolean;
					duration_ms: number;
					points_awarded: number;
					test_output: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					level_id: string;
					member_id: string;
					submitted_code: string;
					passed?: boolean;
					duration_ms?: number;
					points_awarded?: number;
					test_output?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					level_id?: string;
					member_id?: string;
					submitted_code?: string;
					passed?: boolean;
					duration_ms?: number;
					points_awarded?: number;
					test_output?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "arcade_runs_level_id_fkey";
						columns: ["level_id"];
						isOneToOne: false;
						referencedRelation: "arcade_levels";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "arcade_runs_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			member_role: "admin" | "member";
			integration_type: "github" | "slack";
			pr_status: "open" | "merged" | "closed";
			retro_status: "planning" | "active" | "voting" | "completed" | "archived";
			retro_column: "went_well" | "went_poorly" | "ideas" | "action_items";
			programming_language: "typescript" | "python";
			difficulty_level: "easy" | "medium" | "hard";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
