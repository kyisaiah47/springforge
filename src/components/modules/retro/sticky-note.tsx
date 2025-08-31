"use client";

import { useState } from "react";
import { Trash2, Edit3, User, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RetroNoteWithAuthor } from "@/lib/modules/retro/types";
import { VotingInterface } from "./voting-interface";

interface StickyNoteProps {
	note: RetroNoteWithAuthor;
	onUpdate?: (noteId: string, text: string) => void;
	onDelete?: (noteId: string) => void;
	onVote?: (noteId: string, increment: boolean) => void;
	canEdit?: boolean;
	canDelete?: boolean;
	canVote?: boolean;
	className?: string;
}

export function StickyNote({
	note,
	onUpdate,
	onDelete,
	onVote,
	canEdit = true,
	canDelete = true,
	canVote = true,
	className,
}: StickyNoteProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(note.text);

	const handleSave = () => {
		if (editText.trim() && editText !== note.text) {
			onUpdate?.(note.id, editText.trim());
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditText(note.text);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	return (
		<div
			className={cn(
				"group relative rounded-lg border-2 p-3 shadow-sm transition-all hover:shadow-md",
				"min-h-[120px] flex flex-col",
				className
			)}
			style={{
				backgroundColor: note.color + "20",
				borderColor: note.color + "60",
			}}
		>
			{/* Note Content */}
			<div className="flex-1 mb-3">
				{isEditing ? (
					<div className="space-y-2">
						<Input
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Enter note text..."
							className="text-sm resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
							autoFocus
						/>
						<div className="flex gap-1">
							<Button
								size="sm"
								onClick={handleSave}
								disabled={!editText.trim()}
							>
								Save
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleCancel}
							>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
						{note.text}
					</p>
				)}
			</div>

			{/* Note Footer */}
			<div className="flex items-center justify-between">
				{/* Author Info */}
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					{note.is_anonymous ? (
						<>
							<UserX className="size-3" />
							<span>Anonymous</span>
						</>
					) : note.author ? (
						<>
							<User className="size-3" />
							<span>{note.author.github_login || note.author.email}</span>
						</>
					) : (
						<>
							<User className="size-3" />
							<span>Unknown</span>
						</>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					{canEdit && !isEditing && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsEditing(true)}
							className="h-6 w-6 p-0"
						>
							<Edit3 className="size-3" />
						</Button>
					)}
					{canDelete && !isEditing && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDelete?.(note.id)}
							className="h-6 w-6 p-0 text-destructive hover:text-destructive"
						>
							<Trash2 className="size-3" />
						</Button>
					)}
				</div>
			</div>

			{/* Voting Interface */}
			{canVote && !isEditing && (
				<div className="mt-2 pt-2 border-t border-current/20">
					<VotingInterface
						votes={note.votes}
						onVote={(increment) => onVote?.(note.id, increment)}
					/>
				</div>
			)}
		</div>
	);
}
