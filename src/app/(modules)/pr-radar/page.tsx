"use client";

import { useState, useEffect } from "react";
import { Radar, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	PRScoreCard,
	ReviewerSuggestions,
	PRFilters,
	StaleAlerts,
} from "@/components/modules/pr-radar";
import { toast } from "sonner";
import type {
	GetPRInsightsRequest,
	GetPRInsightsResponse,
	StalePRAlert,
	ReviewerSuggestion,
} from "@/lib/modules/pr-radar/types";

export default function PRRadarPage() {
	const [prInsights, setPrInsights] = useState<GetPRInsightsResponse["pr_insights"]>([]);
	const [staleAlerts, setStaleAlerts] = useState<StalePRAlert[]>([]);
	const [reviewerSuggestions, setReviewerSuggestions] = useState<ReviewerSuggestion[]>([]);
	const [filters, setFilters] = useState<Partial<GetPRInsightsRequest>>({});
	const [selectedPR, setSelectedPR] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	// Load data on mount
	useEffect(() => {
		loadPRInsights();
	}, []);

	const loadPRInsights = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/prs");
			if (!response.ok) {
				throw new Error("Failed to fetch PR insights");
			}
			const data: GetPRInsightsResponse = await response.json();
			setPrInsights(data.pr_insights || []);
		} catch (error) {
			console.error("Error loading PR insights:", error);
			toast.error("Failed to load PR insights");
		} finally {
			setIsLoading(false);
			setIsInitialLoading(false);
		}
	};

	const handleRefreshData = async () => {
		await loadPRInsights();
		toast.success("PR insights refreshed");
	};

	const handleRequestReview = async (githubLogin: string) => {
		try {
			// In a real implementation, this would call the GitHub API
			console.log(`Requesting review from ${githubLogin}`);
			toast.success(`Review requested from ${githubLogin}`);
		} catch (error) {
			toast.error("Failed to request review");
		}
	};

	const handleDismissAlert = (prId: string) => {
		setStaleAlerts((alerts) =>
			alerts.filter((alert) => alert.pr_insight.id !== prId)
		);
		toast.success("Alert dismissed");
	};

	const handleSnoozeAlert = (prId: string, hours: number) => {
		console.log(`Snoozing alert for PR ${prId} for ${hours} hours`);
		handleDismissAlert(prId);
		toast.success(`Alert snoozed for ${hours} hours`);
	};

	const filteredPRs = prInsights.filter((pr) => {
		if (filters.status && pr.status !== filters.status) return false;
		if (filters.repo && !pr.repo.includes(filters.repo)) return false;
		if (
			filters.author_member_id &&
			pr.author_member_id !== filters.author_member_id
		)
			return false;
		if (filters.risk_min && pr.risk_score < filters.risk_min) return false;
		return true;
	});

	if (isInitialLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="relative">
					<div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-green-500"></div>
					<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-green-500/20 to-transparent animate-pulse"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
			
			<div className="relative z-10 p-6 space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between py-6">
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<div className="relative">
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-3 h-3 bg-green-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								PR <span className="font-medium">Radar</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Monitor pull request health with AI-powered insights. 
							Get intelligent reviews, risk analysis, and team optimization.
						</p>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={handleRefreshData}
							disabled={isLoading}
							className="rounded-xl"
						>
							<RefreshCw
								className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>
						<Button className="rounded-xl">
							<Plus className="mr-2 h-4 w-4" />
							Add Repository
						</Button>
					</div>
				</div>

				{/* Main Content */}
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-medium tracking-tight">Pull Requests</h2>
						<div className="text-sm text-muted-foreground">
							{filteredPRs.length} of {prInsights.length} PRs
						</div>
					</div>
					
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						{/* Filters Sidebar */}
						<div className="lg:col-span-1 space-y-6">
							<PRFilters
								filters={filters}
								onFiltersChange={setFilters}
								availableRepos={[...new Set(prInsights.map((pr) => pr.repo))]}
								availableAuthors={prInsights
									.filter((pr) => pr.author_member?.github_login)
									.map((pr) => ({
										member_id: pr.author_member_id || "",
										github_login: pr.author_member?.github_login || "",
									}))}
							/>
							
							{staleAlerts.length > 0 && (
								<StaleAlerts
									staleAlerts={staleAlerts}
									onDismissAlert={handleDismissAlert}
									onSnoozeAlert={handleSnoozeAlert}
								/>
							)}
						</div>

						{/* PR List */}
						<div className="lg:col-span-3">
							{filteredPRs.length === 0 ? (
								<div className="text-center py-16">
									<div className="relative mx-auto w-16 h-16 mb-6">
										<div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-xl border border-border/50 flex items-center justify-center">
											<Radar className="h-8 w-8 text-green-600" />
										</div>
									</div>
									<h3 className="text-xl font-medium mb-2">No pull requests found</h3>
									<p className="text-muted-foreground max-w-md mx-auto">
										{prInsights.length === 0
											? "No PR data available. Make sure your GitHub integration is configured and you have PRs in your repositories."
											: "No PRs match the current filters. Try adjusting your search criteria."}
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{filteredPRs.map((pr) => (
										<PRScoreCard
											key={pr.id}
											prInsight={pr}
											onViewDetails={() =>
												setSelectedPR(selectedPR === pr.id ? null : pr.id)
											}
										/>
									))}
								</div>
							)}

							{/* Reviewer Suggestions */}
							{reviewerSuggestions.length > 0 && (
								<div className="mt-8">
									<ReviewerSuggestions
										suggestions={reviewerSuggestions}
										onRequestReview={handleRequestReview}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
				
			{/* Close the main container */}
			</div>
		</div>
	);
}