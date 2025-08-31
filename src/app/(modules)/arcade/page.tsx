"use client";

import { Gamepad2, Trophy } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

export default function ArcadePage() {
	const handleStartChallenge = () => {
		toast.info(
			"Coding challenges coming soon! Load demo data to see sample challenges."
		);
	};

	const handleViewLeaderboard = () => {
		toast.info(
			"Leaderboard available with demo data! Check the dashboard to load sample data."
		);
	};

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight mb-2">Debug Arcade</h1>
				<p className="text-muted-foreground">
					Sharpen your debugging skills with interactive coding challenges
				</p>
			</div>

			<EmptyState
				icon={<Gamepad2 className="size-8 text-orange-600" />}
				title="Ready to Debug?"
				description="Challenge yourself with coding puzzles, fix bugs, and compete on the leaderboard to improve your skills."
				action={{
					label: "Start Challenge",
					onClick: handleStartChallenge,
				}}
				secondaryAction={{
					label: "View Leaderboard",
					onClick: handleViewLeaderboard,
					variant: "outline",
				}}
			/>
		</div>
	);
}
