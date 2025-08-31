import { Database } from "@/lib/types/database";

// Database types
export type Retro = Database["public"]["Tables"]["retros"]["Row"];
export type RetroInsert = Database["public"]["Tables"]["retros"]["Insert"];
export type RetroUpdate = Database["public"]["Tables"]["retros"]["Update"];

export type RetroNote = Database["public"]["Tables"]["retro_notes"]["Row"];
export type RetroNoteInsert =
	Database["public"]["Tables"]["retro_notes"]["Insert"];
export type RetroNoteUpdate =
	Database["public"]["Tables"]["retro_notes"]["Update"];

// Enums
export type RetroStatus = Database["public"]["Enums"]["retro_status"];
export type RetroColumn = Database["public"]["Enums"]["retro_column"];

// Extended types with relationships
export interface RetroWithDetails extends Retro {
	created_by_member?: {
		id: string;
		email: string;
		github_login: string | null;
		avatar_url: string | null;
	};
	notes?: RetroNoteWithAuthor[];
	note_count?: number;
}

export interface RetroNoteWithAuthor extends RetroNote {
	author?: {
		id: string;
		email: string;
		github_login: string | null;
		avatar_url: string | null;
	};
}

// API request/response types
export interface CreateRetroRequest {
	title: string;
	sprint?: string;
}

export interface CreateRetroNoteRequest {
	column_key: RetroColumn;
	text: string;
	color?: string;
	is_anonymous?: boolean;
}

export interface UpdateRetroNoteRequest {
	text?: string;
	color?: string;
}

export interface VoteOnNoteRequest {
	increment: boolean; // true to add vote, false to remove vote
}

// Real-time event types
export interface RetroRealtimeEvent {
	type:
		| "retro_note_added"
		| "retro_note_updated"
		| "retro_note_deleted"
		| "retro_vote_cast"
		| "retro_status_changed";
	payload: {
		retro_id: string;
		note?: RetroNoteWithAuthor;
		note_id?: string;
		votes?: number;
		status?: RetroStatus;
	};
}

// Column configuration
export const RETRO_COLUMNS: Record<
	RetroColumn,
	{ title: string; description: string; color: string }
> = {
	went_well: {
		title: "What went well?",
		description: "Things that worked well during the sprint",
		color: "bg-green-50 border-green-200",
	},
	went_poorly: {
		title: "What could improve?",
		description: "Things that didn't go as planned",
		color: "bg-red-50 border-red-200",
	},
	ideas: {
		title: "Ideas & Suggestions",
		description: "New ideas and suggestions for improvement",
		color: "bg-blue-50 border-blue-200",
	},
	action_items: {
		title: "Action Items",
		description: "Concrete actions to take in the next sprint",
		color: "bg-yellow-50 border-yellow-200",
	},
};

// Note colors
export const NOTE_COLORS = [
	"#fbbf24", // yellow
	"#60a5fa", // blue
	"#34d399", // green
	"#f87171", // red
	"#a78bfa", // purple
	"#fb7185", // pink
	"#fbbf24", // orange
	"#6ee7b7", // emerald
];
