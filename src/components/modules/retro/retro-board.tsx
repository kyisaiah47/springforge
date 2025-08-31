"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	RetroWithDetails,
	RetroNoteWithAuthor,
	RetroColumn,
	RETRO_COLUMNS,
	CreateRetroNoteRequest,
} from "@/lib/modules/retro/types";
import { StickyNote } from "./sticky-note";
import { NoteCreator } from "./note-creator";

interface RetroBoardProps {
	retro: RetroWithDetails;
	notes: RetroNoteWithAuthor[];
	onCreateNote?: (data: CreateRetroNoteRequest) => void;
	onUpdateNote?: (noteId: string, text: string) => void;
	onDeleteNote?: (noteId: string) => void;
	onVoteOnNote?: (noteId: string, increment: boolean) => void;
	onUpdateStatus?: (status: string) => void;
	currentUserId?: string;
	className?: string;
}

export function RetroBoard({
	retro,
	notes,
	onCreateNote,
	onUpdateNote,
	onDeleteNote,
	onVoteOnNote,
	onUpdateStatus,
	currentUserId,
	className,
}: RetroBoardProps) {
	const [notesByColumn, setNotesByColumn] = useState<
		Record<RetroColumn, RetroNoteWithAuthor[]>
	>({
		went_well: [],
		went_poorly: [],
		ideas: [],
		action_items: [],
	});

	// Group notes by column
	useEffect(() => {
		const grouped = notes.reduce((acc, note) => {
			if (!acc[note.column_key]) {
				acc[note.column_key] = [];
			}
			acc[note.column_key].push(note);
			return acc;
		}, {} as Record<RetroColumn, RetroNoteWithAuthor[]>);

		// Sort notes within each column by votes (desc) then by creation time (asc)
		Object.keys(grouped).forEach((column) => {
			grouped[column as RetroColumn].sort((a, b) => {
				if (a.votes !== b.votes) {
					return b.votes - a.votes; // Higher votes first
				}
				return (
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				); // Older first
			});
		});

		setNotesByColumn({
			went_well: grouped.went_well || [],
			went_poorly: grouped.went_poorly || [],
			ideas: grouped.ideas || [],
			action_items: grouped.action_items || [],
		});
	}, [notes]);

	const canEdit = (note: RetroNoteWithAuthor) => {
		return (
			currentUserId &&
			(note.author_member_id === currentUserId ||
				retro.created_by === currentUserId)
		);
	};

	const canDelete = (note: RetroNoteWithAuthor) => {
		return (
			currentUserId &&
			(note.author_member_id === currentUserId ||
				retro.created_by === currentUserId)
		);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "planning":
				return "bg-blue-100 text-blue-800";
			case "active":
				return "bg-green-100 text-green-800";
			case "voting":
				return "bg-purple-100 text-purple-800";
			case "completed":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const totalNotes = notes.length;
	const totalVotes = notes.reduce((sum, note) => sum + note.votes, 0);

	return (
		<div className={cn("space-y-6", className)}>
			{/* Retro Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{retro.title}</h1>
					{retro.sprint && (
						<p className="text-muted-foreground">Sprint: {retro.sprint}</p>
					)}
				</div>
				<div className="flex items-center gap-3">
					<Badge className={getStatusColor(retro.status)}>
						{retro.status.charAt(0).toUpperCase() + retro.status.slice(1)}
					</Badge>
					<div className="text-sm text-muted-foreground">
						{totalNotes} notes • {totalVotes} votes
					</div>
				</div>
			</div>

			{/* Status Controls */}
			{currentUserId === retro.created_by && (
				<div className="flex gap-2">
					<Button
						size="sm"
						variant={retro.status === "active" ? "default" : "outline"}
						onClick={() => onUpdateStatus?.("active")}
					>
						Start Retro
					</Button>
					<Button
						size="sm"
						variant={retro.status === "voting" ? "default" : "outline"}
						onClick={() => onUpdateStatus?.("voting")}
					>
						Start Voting
					</Button>
					<Button
						size="sm"
						variant={retro.status === "completed" ? "default" : "outline"}
						onClick={() => onUpdateStatus?.("completed")}
					>
						Complete Retro
					</Button>
				</div>
			)}

			{/* Retro Board Columns */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{(Object.keys(RETRO_COLUMNS) as RetroColumn[]).map((columnKey) => {
					const column = RETRO_COLUMNS[columnKey];
					const columnNotes = notesByColumn[columnKey];

					return (
						<Card
							key={columnKey}
							className={cn("h-fit", column.color)}
						>
							<CardHeader className="pb-4">
								<CardTitle className="text-lg flex items-center justify-between">
									{column.title}
									<Badge
										variant="secondary"
										className="ml-2"
									>
										{columnNotes.length}
									</Badge>
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									{column.description}
								</p>
							</CardHeader>
							<CardContent className="space-y-3">
								{/* Note Creator */}
								{retro.status === "active" && (
									<NoteCreator
										column={columnKey}
										onCreateNote={onCreateNote}
									/>
								)}

								{/* Existing Notes */}
								{columnNotes.map((note) => (
									<StickyNote
										key={note.id}
										note={note}
										onUpdate={onUpdateNote}
										onDelete={onDeleteNote}
										onVote={onVoteOnNote}
										canEdit={canEdit(note)}
										canDelete={canDelete(note)}
										canVote={
											retro.status === "voting" || retro.status === "completed"
										}
									/>
								))}

								{/* Empty State */}
								{columnNotes.length === 0 && retro.status !== "active" && (
									<div className="text-center py-8 text-muted-foreground">
										<p className="text-sm">No notes yet</p>
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
