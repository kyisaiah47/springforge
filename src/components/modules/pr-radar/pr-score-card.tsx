"use client";

import { formatDistanceToNow } from "date-fns";
import {
	GitPullRequest,
	AlertTriangle,
	FileText,
	Plus,
	Minus,
	Clock,
	User,
	ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PRInsight } from "@/lib/modules/pr-radar/types";

interface PRScoreCardProps {
	prInsight: PRInsight & {
		author_member: {
			github_login: string;
			avatar_url: string | null;
		} | null;
	};
	onViewDetails?: () => void;
}

function getRiskLevel(score: number): {
	level: "low" | "medium" | "high";
	color: string;
	bgColor: string;
} {
	if (score <= 3) {
		return {
			level: "low",
			color: "text-green-600",
			bgColor: "bg-green-100 dark:bg-green-900/20",
		};
	}
	if (score <= 7) {
		return {
			level: "medium",
			color: "text-yellow-600",
			bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
		};
	}
	return {
		level: "high",
		color: "text-red-600",
		bgColor: "bg-red-100 dark:bg-red-900/20",
	};
}

function getSizeLevel(score: number): {
	level: "small" | "medium" | "large";
	color: string;
} {
	if (score <= 3) {
		return { level: "small", color: "text-green-600" };
	}
	if (score <= 7) {
		return { level: "medium", color: "text-yellow-600" };
	}
	return { level: "large", color: "text-red-600" };
}

export function PRScoreCard({ prInsight, onViewDetails }: PRScoreCardProps) {
	const risk = getRiskLevel(prInsight.risk_score);
	const size = getSizeLevel(prInsight.size_score);
	const openedAt = new Date(prInsight.opened_at);
	const updatedAt = new Date(prInsight.updated_at);

	const githubUrl = `https://github.com/${prInsight.repo}/pull/${prInsight.number}`;

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3 flex-1">
						<div className="flex items-center gap-2">
							<GitPullRequest className="size-5 text-blue-500" />
							<span className="font-mono text-sm text-muted-foreground">
								#{prInsight.number}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<CardTitle className="text-lg leading-tight">
								{prInsight.repo}
							</CardTitle>
							<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
								{prInsight.author_member && (
									<div className="flex items-center gap-1.5">
										<Avatar className="size-4">
											<AvatarImage
												src={prInsight.author_member.avatar_url || undefined}
												alt={prInsight.author_member.github_login}
											/>
											<AvatarFallback>
												<User className="size-2" />
											</AvatarFallback>
										</Avatar>
										<span>{prInsight.author_member.github_login}</span>
									</div>
								)}
								<div className="flex items-center gap-1">
									<Clock className="size-3" />
									<span>
										Opened {formatDistanceToNow(openedAt, { addSuffix: true })}
									</span>
								</div>
								{updatedAt.getTime() !== openedAt.getTime() && (
									<span>
										Updated{" "}
										{formatDistanceToNow(updatedAt, { addSuffix: true })}
									</span>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							asChild
						>
							<a
								href={githubUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="size-3" />
								View PR
							</a>
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Risk and Size Scores */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<AlertTriangle className="size-4" />
							<span className="text-sm font-medium">Risk Score</span>
						</div>
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"px-3 py-1.5 rounded-full text-sm font-semibold",
									risk.color,
									risk.bgColor
								)}
							>
								{prInsight.risk_score.toFixed(1)}/10
							</div>
							<span
								className={cn("text-sm font-medium capitalize", risk.color)}
							>
								{risk.level} Risk
							</span>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<FileText className="size-4" />
							<span className="text-sm font-medium">Size Score</span>
						</div>
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-800",
									size.color
								)}
							>
								{prInsight.size_score.toFixed(1)}/10
							</div>
							<span
								className={cn("text-sm font-medium capitalize", size.color)}
							>
								{size.level}
							</span>
						</div>
					</div>
				</div>

				{/* Change Statistics */}
				<div className="grid grid-cols-3 gap-4 pt-2 border-t">
					<div className="text-center">
						<div className="flex items-center justify-center gap-1 text-green-600">
							<Plus className="size-3" />
							<span className="text-sm font-semibold">
								{prInsight.additions.toLocaleString()}
							</span>
						</div>
						<div className="text-xs text-muted-foreground">Additions</div>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-1 text-red-600">
							<Minus className="size-3" />
							<span className="text-sm font-semibold">
								{prInsight.deletions.toLocaleString()}
							</span>
						</div>
						<div className="text-xs text-muted-foreground">Deletions</div>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-1">
							<FileText className="size-3" />
							<span className="text-sm font-semibold">
								{prInsight.files_changed}
							</span>
						</div>
						<div className="text-xs text-muted-foreground">Files</div>
					</div>
				</div>

				{/* Status Badge */}
				<div className="flex items-center justify-between pt-2 border-t">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"px-2 py-1 rounded text-xs font-medium",
								prInsight.status === "open" &&
									"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
								prInsight.status === "merged" &&
									"bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
								prInsight.status === "closed" &&
									"bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
							)}
						>
							{prInsight.status.toUpperCase()}
						</div>
						{prInsight.tests_changed > 0 && (
							<div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
								{prInsight.tests_changed} test
								{prInsight.tests_changed !== 1 ? "s" : ""} changed
							</div>
						)}
					</div>
					{onViewDetails && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onViewDetails}
						>
							View Details
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
