"use client";

import { formatDistanceToNow } from "date-fns";
import {
	GitCommit,
	GitPullRequest,
	GitMerge,
	Bug,
	ExternalLink,
	Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GitHubActivity } from "@/lib/modules/autostand/types";

interface ActivityTimelineProps {
	activity: GitHubActivity;
	className?: string;
}

interface TimelineItem {
	id: string;
	type: "commit" | "pr_opened" | "pr_merged" | "issue_closed";
	title: string;
	subtitle?: string;
	url: string;
	timestamp: string;
	repository: string;
}

export function ActivityTimeline({
	activity,
	className,
}: ActivityTimelineProps) {
	// Convert GitHub activity to timeline items
	const timelineItems: TimelineItem[] = [
		// Commits
		...activity.commits.map((commit) => ({
			id: `commit-${commit.sha}`,
			type: "commit" as const,
			title: commit.message,
			url: commit.url,
			timestamp: commit.timestamp,
			repository: commit.repository,
		})),
		// Pull requests
		...activity.pullRequests.map((pr) => ({
			id: `pr-${pr.number}`,
			type:
				pr.state === "merged" ? ("pr_merged" as const) : ("pr_opened" as const),
			title: pr.title,
			subtitle: `#${pr.number}`,
			url: pr.url,
			timestamp:
				pr.state === "merged" ? pr.merged_at || pr.created_at : pr.created_at,
			repository: pr.repository,
		})),
		// Issues
		...activity.issues
			.filter((issue) => issue.state === "closed")
			.map((issue) => ({
				id: `issue-${issue.number}`,
				type: "issue_closed" as const,
				title: issue.title,
				subtitle: `#${issue.number}`,
				url: issue.url,
				timestamp: issue.closed_at || issue.created_at,
				repository: issue.repository,
			})),
	];

	// Sort by timestamp (most recent first)
	timelineItems.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	);

	const getIcon = (type: TimelineItem["type"]) => {
		switch (type) {
			case "commit":
				return <GitCommit className="size-4 text-green-500" />;
			case "pr_opened":
				return <GitPullRequest className="size-4 text-blue-500" />;
			case "pr_merged":
				return <GitMerge className="size-4 text-purple-500" />;
			case "issue_closed":
				return <Bug className="size-4 text-red-500" />;
		}
	};

	const getTypeLabel = (type: TimelineItem["type"]) => {
		switch (type) {
			case "commit":
				return "Committed";
			case "pr_opened":
				return "Opened PR";
			case "pr_merged":
				return "Merged PR";
			case "issue_closed":
				return "Closed Issue";
		}
	};

	if (timelineItems.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="size-5" />
						Activity Timeline
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<Clock className="size-8 mx-auto mb-2 opacity-50" />
						<p>No GitHub activity found</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="size-5" />
					Activity Timeline
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{timelineItems.map((item, index) => (
						<div
							key={item.id}
							className="flex gap-3"
						>
							{/* Timeline line */}
							<div className="flex flex-col items-center">
								<div className="flex items-center justify-center size-8 rounded-full border bg-background">
									{getIcon(item.type)}
								</div>
								{index < timelineItems.length - 1 && (
									<div className="w-px h-6 bg-border mt-2" />
								)}
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0 pb-4">
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
											<span>{getTypeLabel(item.type)}</span>
											{item.subtitle && (
												<>
													<span>•</span>
													<span className="font-mono">{item.subtitle}</span>
												</>
											)}
											<span>•</span>
											<span>{item.repository}</span>
										</div>
										<p className="text-sm font-medium leading-relaxed">
											{item.title}
										</p>
										<div className="flex items-center gap-2 mt-2">
											<span className="text-xs text-muted-foreground">
												{formatDistanceToNow(new Date(item.timestamp), {
													addSuffix: true,
												})}
											</span>
											<a
												href={item.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
											>
												<ExternalLink className="size-3" />
												View
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
