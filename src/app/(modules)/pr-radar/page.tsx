"use client";

import { useState } from "react";
import { Radar, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	PRScoreCard,
	ReviewerSuggestions,
	PRFilters,
	StaleAlerts,
} from "@/components/modules/pr-radar";
import type {
	GetPRInsightsRequest,
	GetPRInsightsResponse,
	StalePRAlert,
	ReviewerSuggestion,
} from "@/lib/modules/pr-radar/types";

// Mock data for demonstration
const mockPRInsights: GetPRInsightsResponse["pr_insights"] = [
	{
		id: "1",
		org_id: "org-1",
		repo: "sprintforge/frontend",
		number: 123,
		author_member_id: "member-1",
		additions: 245,
		deletions: 67,
		files_changed: 8,
		tests_changed: 3,
		touched_paths: ["src/components/", "src/lib/"],
		size_score: 6.2,
		risk_score: 4.8,
		suggested_reviewers: ["alice", "bob"],
		status: "open",
		opened_at: "2024-01-15T10:30:00Z",
		updated_at: "2024-01-16T14:20:00Z",
		author_member: {
			github_login: "john-dev",
			avatar_url: "https://github.com/john-dev.png",
		},
	},
	{
		id: "2",
		org_id: "org-1",
		repo: "sprintforge/backend",
		number: 456,
		author_member_id: "member-2",
		additions: 89,
		deletions: 23,
		files_changed: 4,
		tests_changed: 2,
		touched_paths: ["src/api/", "src/lib/"],
		size_score: 3.1,
		risk_score: 8.7,
		suggested_reviewers: ["charlie", "diana"],
		status: "open",
		opened_at: "2024-01-14T09:15:00Z",
		updated_at: "2024-01-14T16:45:00Z",
		author_member: {
			github_login: "sarah-eng",
			avatar_url: "https://github.com/sarah-eng.png",
		},
	},
];

const mockStaleAlerts: StalePRAlert[] = [
	{
		pr_insight: mockPRInsights[1],
		days_stale: 3,
		last_activity: "2024-01-14T16:45:00Z",
		alert_level: "warning",
	},
];

const mockReviewerSuggestions: ReviewerSuggestion[] = [
	{
		github_login: "alice",
		member_id: "member-3",
		confidence_score: 0.85,
		reasoning: [
			"Primary contributor to components directory",
			"Recently reviewed similar UI changes",
		],
		expertise_areas: ["React", "TypeScript", "UI Components"],
	},
	{
		github_login: "bob",
		member_id: "member-4",
		confidence_score: 0.72,
		reasoning: [
			"Has experience with authentication flows",
			"Familiar with the codebase structure",
		],
		expertise_areas: ["Authentication", "Backend", "Security"],
	},
];

const mockAvailableRepos = ["sprintforge/frontend", "sprintforge/backend"];
const mockAvailableAuthors = [
	{ github_login: "john-dev", member_id: "member-1" },
	{ github_login: "sarah-eng", member_id: "member-2" },
];

export default function PRRadarPage() {
	const [prInsights] = useState(mockPRInsights);
	const [staleAlerts, setStaleAlerts] = useState(mockStaleAlerts);
	const [reviewerSuggestions] = useState(mockReviewerSuggestions);
	const [filters, setFilters] = useState<Partial<GetPRInsightsRequest>>({});
	const [selectedPR, setSelectedPR] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleRefreshData = async () => {
		setIsLoading(true);
		// Simulate API call
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
	};

	const handleRequestReview = (githubLogin: string) => {
		console.log(`Requesting review from ${githubLogin}`);
		// In a real implementation, this would call the GitHub API
	};

	const handleDismissAlert = (prId: string) => {
		setStaleAlerts((alerts) =>
			alerts.filter((alert) => alert.pr_insight.id !== prId)
		);
	};

	const handleSnoozeAlert = (prId: string, hours: number) => {
		console.log(`Snoozing alert for PR ${prId} for ${hours} hours`);
		// In a real implementation, this would update the alert schedule
		handleDismissAlert(prId);
	};

	const filteredPRs = prInsights.filter((pr) => {
		if (filters.status && pr.status !== filters.status) return false;
		if (filters.repo && pr.repo !== filters.repo) return false;
		if (
			filters.author_member_id &&
			pr.author_member_id !== filters.author_member_id
		)
			return false;
		if (filters.risk_min && pr.risk_score < filters.risk_min) return false;
		return true;
	});

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
						<Radar className="size-8 text-blue-500" />
						PR Radar
					</h1>
					<p className="text-muted-foreground">
						Pull request insights, scoring, and reviewer suggestions
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={handleRefreshData}
						disabled={isLoading}
					>
						<RefreshCw
							className={`size-4 ${isLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</div>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-card rounded-lg border p-4">
					<div className="text-2xl font-bold text-blue-600">
						{prInsights.length}
					</div>
					<div className="text-sm text-muted-foreground">Total PRs</div>
				</div>
				<div className="bg-card rounded-lg border p-4">
					<div className="text-2xl font-bold text-green-600">
						{prInsights.filter((pr) => pr.status === "open").length}
					</div>
					<div className="text-sm text-muted-foreground">Open PRs</div>
				</div>
				<div className="bg-card rounded-lg border p-4">
					<div className="text-2xl font-bold text-red-600">
						{prInsights.filter((pr) => pr.risk_score >= 7).length}
					</div>
					<div className="text-sm text-muted-foreground">High Risk</div>
				</div>
				<div className="bg-card rounded-lg border p-4">
					<div className="text-2xl font-bold text-yellow-600">
						{staleAlerts.length}
					</div>
					<div className="text-sm text-muted-foreground">Stale PRs</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - PR List and Filters */}
				<div className="lg:col-span-2 space-y-6">
					{/* Filters */}
					<PRFilters
						filters={filters}
						onFiltersChange={setFilters}
						availableRepos={mockAvailableRepos}
						availableAuthors={mockAvailableAuthors}
					/>

					{/* PR List */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold">
								Pull Requests ({filteredPRs.length})
							</h2>
						</div>
						{filteredPRs.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<Radar className="size-12 mx-auto mb-4 opacity-50" />
								<p>No pull requests match your filters</p>
								<p className="text-sm">Try adjusting your search criteria</p>
							</div>
						) : (
							<div className="space-y-4">
								{filteredPRs.map((pr) => (
									<PRScoreCard
										key={pr.id}
										prInsight={pr}
										onViewDetails={() => setSelectedPR(pr.id)}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Column - Alerts and Suggestions */}
				<div className="space-y-6">
					{/* Stale Alerts */}
					<StaleAlerts
						staleAlerts={staleAlerts}
						isLoading={isLoading}
						onRefresh={handleRefreshData}
						onDismissAlert={handleDismissAlert}
						onSnoozeAlert={handleSnoozeAlert}
					/>

					{/* Reviewer Suggestions */}
					{selectedPR && (
						<ReviewerSuggestions
							suggestions={reviewerSuggestions}
							onRequestReview={handleRequestReview}
						/>
					)}

					{/* Quick Actions */}
					<div className="bg-card rounded-lg border p-4">
						<h3 className="font-semibold mb-3">Quick Actions</h3>
						<div className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
							>
								<Plus className="size-3" />
								Create PR Template
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="w-full justify-start"
							>
								<RefreshCw className="size-3" />
								Sync GitHub Data
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
