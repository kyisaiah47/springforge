"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Clock,
	AlertTriangle,
	GitPullRequest,
	ExternalLink,
	Bell,
	BellOff,
	RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StalePRAlert } from "@/lib/modules/pr-radar/types";

interface StaleAlertsProps {
	staleAlerts: StalePRAlert[];
	isLoading?: boolean;
	onRefresh?: () => void;
	onDismissAlert?: (prId: string) => void;
	onSnoozeAlert?: (prId: string, hours: number) => void;
	className?: string;
}

function getAlertSeverity(
	daysStale: number,
	alertLevel: "warning" | "critical"
) {
	if (alertLevel === "critical" || daysStale >= 7) {
		return {
			level: "critical",
			color: "text-red-600",
			bgColor:
				"bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800",
			icon: AlertTriangle,
		};
	}
	return {
		level: "warning",
		color: "text-yellow-600",
		bgColor:
			"bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800",
		icon: Clock,
	};
}

export function StaleAlerts({
	staleAlerts,
	isLoading = false,
	onRefresh,
	onDismissAlert,
	onSnoozeAlert,
	className,
}: StaleAlertsProps) {
	const criticalAlerts = staleAlerts.filter(
		(alert) => alert.alert_level === "critical" || alert.days_stale >= 7
	);
	const warningAlerts = staleAlerts.filter(
		(alert) => alert.alert_level === "warning" && alert.days_stale < 7
	);

	if (staleAlerts.length === 0 && !isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Clock className="size-5" />
							Stale PR Alerts
						</CardTitle>
						{onRefresh && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onRefresh}
							>
								<RefreshCw className="size-3" />
								Refresh
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-center py-6 text-muted-foreground">
						<Clock className="size-8 mx-auto mb-2 opacity-50" />
						<p>No stale pull requests</p>
						<p className="text-sm">All PRs are being actively reviewed</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Clock className="size-5" />
						Stale PR Alerts
						{staleAlerts.length > 0 && (
							<span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs rounded-full">
								{staleAlerts.length}
							</span>
						)}
					</CardTitle>
					{onRefresh && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onRefresh}
							disabled={isLoading}
						>
							<RefreshCw
								className={cn("size-3", isLoading && "animate-spin")}
							/>
							Refresh
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Critical Alerts */}
				{criticalAlerts.length > 0 && (
					<div>
						<h4 className="font-semibold text-sm text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
							<AlertTriangle className="size-3" />
							Critical ({criticalAlerts.length})
						</h4>
						<div className="space-y-3">
							{criticalAlerts.map((alert) => (
								<StaleAlertCard
									key={alert.pr_insight.id}
									alert={alert}
									onDismiss={onDismissAlert}
									onSnooze={onSnoozeAlert}
								/>
							))}
						</div>
					</div>
				)}

				{/* Warning Alerts */}
				{warningAlerts.length > 0 && (
					<div>
						{criticalAlerts.length > 0 && <div className="border-t pt-4" />}
						<h4 className="font-semibold text-sm text-yellow-600 uppercase tracking-wide mb-3 flex items-center gap-2">
							<Clock className="size-3" />
							Warning ({warningAlerts.length})
						</h4>
						<div className="space-y-3">
							{warningAlerts.map((alert) => (
								<StaleAlertCard
									key={alert.pr_insight.id}
									alert={alert}
									onDismiss={onDismissAlert}
									onSnooze={onSnoozeAlert}
								/>
							))}
						</div>
					</div>
				)}

				{/* Summary */}
				<div className="pt-4 border-t">
					<p className="text-xs text-muted-foreground">
						PRs are considered stale after 2+ days without activity. Critical
						alerts are generated after 7+ days.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

interface StaleAlertCardProps {
	alert: StalePRAlert;
	onDismiss?: (prId: string) => void;
	onSnooze?: (prId: string, hours: number) => void;
}

function StaleAlertCard({ alert, onDismiss, onSnooze }: StaleAlertCardProps) {
	const { pr_insight, days_stale, last_activity, alert_level } = alert;
	const severity = getAlertSeverity(days_stale, alert_level);
	const Icon = severity.icon;
	const lastActivityDate = new Date(last_activity);
	const githubUrl = `https://github.com/${pr_insight.repo}/pull/${pr_insight.number}`;

	return (
		<div
			className={cn(
				"flex items-start gap-3 p-3 rounded-lg border",
				severity.bgColor
			)}
		>
			<Icon className={cn("size-5 mt-0.5 shrink-0", severity.color)} />
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2 mb-2">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<GitPullRequest className="size-4 text-blue-500" />
							<span className="font-medium text-sm">
								{pr_insight.repo} #{pr_insight.number}
							</span>
							<div
								className={cn(
									"px-2 py-0.5 rounded text-xs font-medium",
									severity.color,
									severity.level === "critical"
										? "bg-red-100 dark:bg-red-900/20"
										: "bg-yellow-100 dark:bg-yellow-900/20"
								)}
							>
								{days_stale} day{days_stale !== 1 ? "s" : ""} stale
							</div>
						</div>
						{pr_insight.author_member_id && (
							<div className="flex items-center gap-1.5 mb-2">
								<Avatar className="size-4">
									<AvatarImage
										src={`https://github.com/user-${pr_insight.author_member_id}.png`}
										alt={`User ${pr_insight.author_member_id}`}
									/>
									<AvatarFallback>U</AvatarFallback>
								</Avatar>
								<span className="text-sm text-muted-foreground">
									by user-{pr_insight.author_member_id}
								</span>
							</div>
						)}
						<div className="text-xs text-muted-foreground">
							Last activity:{" "}
							{formatDistanceToNow(lastActivityDate, { addSuffix: true })}
						</div>
					</div>
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

				{/* PR Stats */}
				<div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
					<div className="flex items-center gap-1">
						<span className="text-green-600">+{pr_insight.additions}</span>
						<span className="text-red-600">-{pr_insight.deletions}</span>
					</div>
					<div>{pr_insight.files_changed} files</div>
					<div>Risk: {pr_insight.risk_score.toFixed(1)}/10</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{onSnooze && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onSnooze(pr_insight.id, 4)}
								className="text-xs"
							>
								<BellOff className="size-3" />
								Snooze 4h
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onSnooze(pr_insight.id, 24)}
								className="text-xs"
							>
								<BellOff className="size-3" />
								Snooze 1d
							</Button>
						</>
					)}
					{onDismiss && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDismiss(pr_insight.id)}
							className="text-xs"
						>
							<Bell className="size-3" />
							Dismiss
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
