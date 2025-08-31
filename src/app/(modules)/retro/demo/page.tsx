"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetroBoard } from "@/components/modules/retro";
import { toast } from "sonner";
import {
	RetroWithDetails,
	RetroNoteWithAuthor,
	CreateRetroNoteRequest,
} from "@/lib/modules/retro/types";
import Link from "next/link";

// Demo data
const demoRetro: RetroWithDetails = {
	id: "demo-retro-1",
	org_id: "demo-org",
	title: "Sprint 23 Retrospective",
	sprint: "Sprint 23",
	status: "active",
	created_by: "demo-user-1",
	created_at: new Date().toISOString(),
	created_by_member: {
		id: "demo-user-1",
		email: "alice@example.com",
		github_login: "alice-dev",
		avatar_url: "https://github.com/alice-dev.png",
	},
};

const initialNotes: RetroNoteWithAuthor[] = [
	{
		id: "note-1",
		retro_id: "demo-retro-1",
		author_member_id: "demo-user-1",
		column_key: "went_well",
		text: "Great collaboration on the new feature implementation. The team worked really well together and we delivered ahead of schedule.",
		color: "#34d399",
		votes: 5,
		is_anonymous: false,
		created_at: new Date(Date.now() - 3600000).toISOString(),
		author: {
			id: "demo-user-1",
			email: "alice@example.com",
			github_login: "alice-dev",
			avatar_url: "https://github.com/alice-dev.png",
		},
	},
	{
		id: "note-2",
		retro_id: "demo-retro-1",
		author_member_id: "demo-user-2",
		column_key: "went_well",
		text: "Code reviews were thorough and helpful",
		color: "#60a5fa",
		votes: 3,
		is_anonymous: false,
		created_at: new Date(Date.now() - 3000000).toISOString(),
		author: {
			id: "demo-user-2",
			email: "bob@example.com",
			github_login: "bob-dev",
			avatar_url: "https://github.com/bob-dev.png",
		},
	},
	{
		id: "note-3",
		retro_id: "demo-retro-1",
		author_member_id: null,
		column_key: "went_poorly",
		text: "Too many meetings interrupted deep work time",
		color: "#f87171",
		votes: 7,
		is_anonymous: true,
		created_at: new Date(Date.now() - 2400000).toISOString(),
		author: undefined,
	},
	{
		id: "note-4",
		retro_id: "demo-retro-1",
		author_member_id: "demo-user-3",
		column_key: "ideas",
		text: "Consider implementing pair programming sessions for complex features",
		color: "#a78bfa",
		votes: 2,
		is_anonymous: false,
		created_at: new Date(Date.now() - 1800000).toISOString(),
		author: {
			id: "demo-user-3",
			email: "charlie@example.com",
			github_login: "charlie-dev",
			avatar_url: "https://github.com/charlie-dev.png",
		},
	},
	{
		id: "note-5",
		retro_id: "demo-retro-1",
		author_member_id: "demo-user-1",
		column_key: "action_items",
		text: "Schedule dedicated focus time blocks in team calendar",
		color: "#fbbf24",
		votes: 4,
		is_anonymous: false,
		created_at: new Date(Date.now() - 1200000).toISOString(),
		author: {
			id: "demo-user-1",
			email: "alice@example.com",
			github_login: "alice-dev",
			avatar_url: "https://github.com/alice-dev.png",
		},
	},
];

export default function RetroDemoPage() {
	const [retro, setRetro] = useState(demoRetro);
	const [notes, setNotes] = useState(initialNotes);
	const currentUserId = "demo-user-1"; // Simulate current user

	const handleCreateNote = (data: CreateRetroNoteRequest) => {
		const newNote: RetroNoteWithAuthor = {
			id: `note-${Date.now()}`,
			retro_id: retro.id,
			author_member_id: data.is_anonymous ? null : currentUserId,
			column_key: data.column_key,
			text: data.text,
			color: data.color || "#fbbf24",
			votes: 0,
			is_anonymous: data.is_anonymous || false,
			created_at: new Date().toISOString(),
			author: data.is_anonymous
				? undefined
				: {
						id: currentUserId,
						email: "alice@example.com",
						github_login: "alice-dev",
						avatar_url: "https://github.com/alice-dev.png",
				  },
		};

		setNotes((prev) => [...prev, newNote]);
		toast.success("Note added successfully!");
	};

	const handleUpdateNote = (noteId: string, text: string) => {
		setNotes((prev) =>
			prev.map((note) => (note.id === noteId ? { ...note, text } : note))
		);
		toast.success("Note updated successfully!");
	};

	const handleDeleteNote = (noteId: string) => {
		setNotes((prev) => prev.filter((note) => note.id !== noteId));
		toast.success("Note deleted successfully!");
	};

	const handleVoteOnNote = (noteId: string, increment: boolean) => {
		setNotes((prev) =>
			prev.map((note) =>
				note.id === noteId
					? { ...note, votes: Math.max(0, note.votes + (increment ? 1 : -1)) }
					: note
			)
		);
		toast.success(increment ? "Vote added!" : "Vote removed!");
	};

	const handleUpdateStatus = (status: string) => {
		setRetro((prev) => ({
			...prev,
			status: status as
				| "planning"
				| "active"
				| "voting"
				| "completed"
				| "archived",
		}));
		toast.success(`Retro status updated to ${status}`);
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="sm"
					asChild
				>
					<Link href="/retro">
						<ArrowLeft className="size-4" />
						Back to Retros
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Demo Retrospective</h1>
					<p className="text-muted-foreground">
						Interactive demo of the RetroBoard component
					</p>
				</div>
			</div>

			{/* Demo Instructions */}
			<div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
				<h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Demo Instructions</h3>
				<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
					<li>
						• Add new notes by clicking &quot;Add Note&quot; in any column
					</li>
					<li>• Edit existing notes by clicking the edit icon</li>
					<li>• Vote on notes using the +/- buttons</li>
					<li>• Change retro status using the buttons above the board</li>
					<li>• Try anonymous posting when creating notes</li>
				</ul>
			</div>

			{/* Retro Board */}
			<RetroBoard
				retro={retro}
				notes={notes}
				onCreateNote={handleCreateNote}
				onUpdateNote={handleUpdateNote}
				onDeleteNote={handleDeleteNote}
				onVoteOnNote={handleVoteOnNote}
				onUpdateStatus={handleUpdateStatus}
				currentUserId={currentUserId}
			/>
		</div>
	);
}
