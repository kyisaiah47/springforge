"use client";

import { useState } from "react";
import { Plus, UserX, User, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	RetroColumn,
	NOTE_COLORS,
	CreateRetroNoteRequest,
} from "@/lib/modules/retro/types";

interface NoteCreatorProps {
	column: RetroColumn;
	onCreateNote?: (data: CreateRetroNoteRequest) => void;
	disabled?: boolean;
	className?: string;
}

export function NoteCreator({
	column,
	onCreateNote,
	disabled = false,
	className,
}: NoteCreatorProps) {
	const [isCreating, setIsCreating] = useState(false);
	const [text, setText] = useState("");
	const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
	const [isAnonymous, setIsAnonymous] = useState(false);

	const handleCreate = () => {
		if (!text.trim()) return;

		onCreateNote?.({
			column_key: column,
			text: text.trim(),
			color: selectedColor,
			is_anonymous: isAnonymous,
		});

		// Reset form
		setText("");
		setSelectedColor(NOTE_COLORS[0]);
		setIsAnonymous(false);
		setIsCreating(false);
	};

	const handleCancel = () => {
		setText("");
		setSelectedColor(NOTE_COLORS[0]);
		setIsAnonymous(false);
		setIsCreating(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleCreate();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	if (!isCreating) {
		return (
			<Button
				variant="outline"
				onClick={() => setIsCreating(true)}
				disabled={disabled}
				className={cn(
					"w-full h-24 border-2 border-dashed hover:border-solid transition-all",
					"flex flex-col items-center justify-center gap-2",
					className
				)}
			>
				<Plus className="size-5" />
				<span className="text-sm">Add Note</span>
			</Button>
		);
	}

	return (
		<Card
			className={cn("border-2", className)}
			style={{
				backgroundColor: selectedColor + "20",
				borderColor: selectedColor + "60",
			}}
		>
			<CardContent className="p-3 space-y-3">
				{/* Text Input */}
				<Input
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Enter your note..."
					className="border-0 bg-transparent p-0 focus-visible:ring-0"
					autoFocus
				/>

				{/* Color Picker */}
				<div className="flex items-center gap-1">
					<Palette className="size-4 text-muted-foreground" />
					<div className="flex gap-1">
						{NOTE_COLORS.map((color) => (
							<button
								key={color}
								onClick={() => setSelectedColor(color)}
								className={cn(
									"size-6 rounded-full border-2 transition-all",
									selectedColor === color
										? "border-foreground scale-110"
										: "border-transparent hover:scale-105"
								)}
								style={{ backgroundColor: color }}
								title={`Select ${color} color`}
							/>
						))}
					</div>
				</div>

				{/* Anonymous Toggle */}
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant={isAnonymous ? "default" : "outline"}
						onClick={() => setIsAnonymous(!isAnonymous)}
						className="h-7 px-2"
					>
						{isAnonymous ? (
							<UserX className="size-3" />
						) : (
							<User className="size-3" />
						)}
						<span className="text-xs">
							{isAnonymous ? "Anonymous" : "Named"}
						</span>
					</Button>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2">
					<Button
						size="sm"
						onClick={handleCreate}
						disabled={!text.trim()}
						className="flex-1"
					>
						Add Note
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={handleCancel}
					>
						Cancel
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
