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
			<div className="p-6">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<Radar className="h-8 w-8" />
						<div>
							<h1 className="text-3xl font-bold tracking-tight">PR Radar</h1>
							<p className="text-muted-foreground">
								Loading pull request insights...
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<Radar className="h-8 w-8" />
					<div>
						<h1 className="text-3xl font-bold tracking-tight">PR Radar</h1>
						<p className="text-muted-foreground">
							Monitor pull request health and get intelligent insights
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={handleRefreshData}
						disabled={isLoading}
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Repository
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Filters */}
				<div className="lg:col-span-1">
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
						<div className="mt-6">
							<StaleAlerts
								staleAlerts={staleAlerts}
								onDismissAlert={handleDismissAlert}
								onSnoozeAlert={handleSnoozeAlert}
							/>
						</div>
					)}
				</div>

				{/* Main Content */}
				<div className="lg:col-span-3">
					{filteredPRs.length === 0 ? (
						<div className="text-center py-12">
							<Radar className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-2 text-sm font-semibold">No pull requests</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								{prInsights.length === 0
									? "No PR data available. Make sure your GitHub integration is configured and you have PRs in your repositories."
									: "No PRs match the current filters."}
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
						<div className="mt-6">
							<ReviewerSuggestions
								suggestions={reviewerSuggestions}
								onRequestReview={handleRequestReview}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}