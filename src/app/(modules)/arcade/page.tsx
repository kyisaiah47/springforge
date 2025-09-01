"use client";

import { Gamepad2 } from "lucide-react";
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
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
			
			<div className="relative z-10 p-6 space-y-8">
				{/* Header */}
				<div className="py-6">
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<div className="relative">
								<div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-3 h-3 bg-orange-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								Debug <span className="font-medium">Arcade</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Level up your debugging skills through gamified coding challenges. 
							Compete with teammates and unlock achievements as you master problem-solving.
						</p>
					</div>
				</div>

				{/* Main Content */}
				<div className="space-y-6">
					<div className="text-center py-16">
						<div className="relative mx-auto w-20 h-20 mb-8">
							<div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl border border-border/50 flex items-center justify-center">
								<Gamepad2 className="h-10 w-10 text-orange-600" />
							</div>
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/10 blur-xl"></div>
						</div>
						
						<div className="space-y-4 mb-8">
							<h2 className="text-3xl font-medium tracking-tight">Ready to Debug?</h2>
							<p className="text-muted-foreground max-w-md mx-auto text-lg">
								Challenge yourself with coding puzzles, fix bugs, and compete on the leaderboard to improve your skills.
							</p>
						</div>
						
						<div className="flex items-center justify-center gap-4">
							<button
								onClick={handleStartChallenge}
								className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
							>
								Start Challenge
							</button>
							<button
								onClick={handleViewLeaderboard}
								className="px-8 py-3 border border-border/50 bg-card/50 backdrop-blur-sm rounded-xl font-medium hover:bg-card/70 transition-colors"
							>
								View Leaderboard
							</button>
						</div>
						
						<div className="mt-8 text-sm text-muted-foreground">
							Load demo data from the dashboard to see sample challenges
						</div>
					</div>
				</div>
				
			{/* Close the main container */}
			</div>
		</div>
	);
}
