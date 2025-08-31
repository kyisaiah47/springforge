"use client";

import { Users, Star, Brain, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewerSuggestion } from "@/lib/modules/pr-radar/types";

interface ReviewerSuggestionsProps {
	suggestions: ReviewerSuggestion[];
	confidenceThreshold?: number;
	onRequestReview?: (githubLogin: string) => void;
	className?: string;
}

function getConfidenceLevel(score: number): {
	level: "low" | "medium" | "high";
	color: string;
	bgColor: string;
} {
	if (score < 0.3) {
		return {
			level: "low",
			color: "text-red-600",
			bgColor: "bg-red-100 dark:bg-red-900/20",
		};
	}
	if (score < 0.7) {
		return {
			level: "medium",
			color: "text-yellow-600",
			bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
		};
	}
	return {
		level: "high",
		color: "text-green-600",
		bgColor: "bg-green-100 dark:bg-green-900/20",
	};
}

export function ReviewerSuggestions({
	suggestions,
	confidenceThreshold = 0.5,
	onRequestReview,
	className,
}: ReviewerSuggestionsProps) {
	const highConfidenceSuggestions = suggestions.filter(
		(s) => s.confidence_score >= confidenceThreshold
	);
	const otherSuggestions = suggestions.filter(
		(s) => s.confidence_score < confidenceThreshold
	);

	if (suggestions.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="size-5" />
						Reviewer Suggestions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-6 text-muted-foreground">
						<Brain className="size-8 mx-auto mb-2 opacity-50" />
						<p>No reviewer suggestions available</p>
						<p className="text-sm">
							Suggestions are based on code ownership and expertise
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="size-5" />
					Reviewer Suggestions
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* High Confidence Suggestions */}
				{highConfidenceSuggestions.length > 0 && (
					<div>
						<h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
							<CheckCircle className="size-3" />
							Recommended Reviewers
						</h4>
						<div className="space-y-3">
							{highConfidenceSuggestions.map((suggestion) => (
								<ReviewerCard
									key={suggestion.github_login}
									suggestion={suggestion}
									onRequestReview={onRequestReview}
									isRecommended
								/>
							))}
						</div>
					</div>
				)}

				{/* Other Suggestions */}
				{otherSuggestions.length > 0 && (
					<div>
						{highConfidenceSuggestions.length > 0 && (
							<div className="border-t pt-4">
								<h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
									Other Suggestions
								</h4>
							</div>
						)}
						<div className="space-y-3">
							{otherSuggestions.map((suggestion) => (
								<ReviewerCard
									key={suggestion.github_login}
									suggestion={suggestion}
									onRequestReview={onRequestReview}
									isRecommended={false}
								/>
							))}
						</div>
					</div>
				)}

				{/* Confidence Threshold Info */}
				<div className="pt-4 border-t">
					<p className="text-xs text-muted-foreground">
						Suggestions with confidence ≥{" "}
						{Math.round(confidenceThreshold * 100)}% are recommended based on
						code ownership and recent activity.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

interface ReviewerCardProps {
	suggestion: ReviewerSuggestion;
	onRequestReview?: (githubLogin: string) => void;
	isRecommended: boolean;
}

function ReviewerCard({
	suggestion,
	onRequestReview,
	isRecommended,
}: ReviewerCardProps) {
	const confidence = getConfidenceLevel(suggestion.confidence_score);

	return (
		<div
			className={cn(
				"flex items-start gap-3 p-3 rounded-lg border",
				isRecommended
					? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
					: "bg-background"
			)}
		>
			<Avatar className="size-8 mt-0.5">
				<AvatarImage
					src={`https://github.com/${suggestion.github_login}.png`}
					alt={suggestion.github_login}
				/>
				<AvatarFallback>
					{suggestion.github_login.slice(0, 2).toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<span className="font-medium">{suggestion.github_login}</span>
					<div
						className={cn(
							"px-2 py-0.5 rounded text-xs font-medium",
							confidence.color,
							confidence.bgColor
						)}
					>
						{Math.round(suggestion.confidence_score * 100)}% match
					</div>
					{isRecommended && (
						<Star className="size-3 text-yellow-500 fill-current" />
					)}
				</div>

				{/* Expertise Areas */}
				{suggestion.expertise_areas.length > 0 && (
					<div className="mb-2">
						<div className="flex flex-wrap gap-1">
							{suggestion.expertise_areas.slice(0, 3).map((area) => (
								<span
									key={area}
									className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded"
								>
									{area}
								</span>
							))}
							{suggestion.expertise_areas.length > 3 && (
								<span className="text-xs text-muted-foreground">
									+{suggestion.expertise_areas.length - 3} more
								</span>
							)}
						</div>
					</div>
				)}

				{/* Reasoning */}
				<div className="space-y-1">
					{suggestion.reasoning.slice(0, 2).map((reason, index) => (
						<div
							key={index}
							className="text-xs text-muted-foreground flex items-start gap-1"
						>
							<span className="text-blue-500 mt-0.5">•</span>
							<span>{reason}</span>
						</div>
					))}
					{suggestion.reasoning.length > 2 && (
						<div className="text-xs text-muted-foreground">
							+{suggestion.reasoning.length - 2} more reasons
						</div>
					)}
				</div>
			</div>

			{onRequestReview && (
				<Button
					variant="outline"
					size="sm"
					onClick={() => onRequestReview(suggestion.github_login)}
					className="shrink-0"
				>
					Request Review
				</Button>
			)}
		</div>
	);
}
