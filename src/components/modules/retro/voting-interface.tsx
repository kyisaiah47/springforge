"use client";

import { Plus, Minus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VotingInterfaceProps {
	votes: number;
	onVote?: (increment: boolean) => void;
	disabled?: boolean;
	className?: string;
}

export function VotingInterface({
	votes,
	onVote,
	disabled = false,
	className,
}: VotingInterfaceProps) {
	return (
		<div className={cn("flex items-center justify-between", className)}>
			{/* Vote Count Display */}
			<div className="flex items-center gap-1 text-sm">
				<Heart className="size-4 text-red-500" />
				<span className="font-medium">{votes}</span>
				<span className="text-muted-foreground">
					{votes === 1 ? "vote" : "votes"}
				</span>
			</div>

			{/* Vote Buttons */}
			<div className="flex items-center gap-1">
				<Button
					size="sm"
					variant="outline"
					onClick={() => onVote?.(false)}
					disabled={disabled || votes === 0}
					className="h-6 w-6 p-0"
					title="Remove vote"
				>
					<Minus className="size-3" />
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => onVote?.(true)}
					disabled={disabled}
					className="h-6 w-6 p-0"
					title="Add vote"
				>
					<Plus className="size-3" />
				</Button>
			</div>
		</div>
	);
}
