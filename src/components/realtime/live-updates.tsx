"use client";

import React, { useState, useEffect } from "react";
import { useRealtime, RealtimeEvent } from "@/lib/realtime/realtime-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Wifi,
	WifiOff,
	RefreshCw,
	Activity,
	Users,
	MessageSquare,
	GitPullRequest,
	Calendar,
	Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveUpdatesProps {
	className?: string;
	showConnectionStatus?: boolean;
	showEventHistory?: boolean;
	maxEvents?: number;
}

interface EventDisplay {
	id: string;
	event: RealtimeEvent;
	displayText: string;
	icon: React.ReactNode;
	color: string;
}

export function LiveUpdates({
	className,
	showConnectionStatus = true,
	showEventHistory = true,
	maxEvents = 10,
}: LiveUpdatesProps) {
	const {
		connectionStatus,
		isConnected,
		reconnect,
		addEventListener,
		activeSubscriptions,
	} = useRealtime();

	const [recentEvents, setRecentEvents] = useState<EventDisplay[]>([]);

	// Listen to real-time events
	useEffect(() => {
		const removeListener = addEventListener((event: RealtimeEvent) => {
			const eventDisplay = formatEventForDisplay(event);

			setRecentEvents((prev) => {
				const updated = [eventDisplay, ...prev];
				return updated.slice(0, maxEvents);
			});
		});

		return removeListener;
	}, [addEventListener, maxEvents]);

	const formatEventForDisplay = (event: RealtimeEvent): EventDisplay => {
		const id = `${event.type}_${event.timestamp}_${Math.random()}`;

		switch (event.type) {
			case "retro_note_added":
				return {
					id,
					event,
					displayText: `New retro note added`,
					icon: <MessageSquare className="h-4 w-4" />,
					color: "text-blue-600",
				};

			case "retro_note_updated":
				return {
					id,
					event,
					displayText: `Retro note updated`,
					icon: <MessageSquare className="h-4 w-4" />,
					color: "text-yellow-600",
				};

			case "retro_vote_cast":
				return {
					id,
					event,
					displayText: `Vote cast on retro note`,
					icon: <Users className="h-4 w-4" />,
					color: "text-green-600",
				};

			case "pr_updated":
				return {
					id,
					event,
					displayText: `Pull request updated`,
					icon: <GitPullRequest className="h-4 w-4" />,
					color: "text-purple-600",
				};

			case "standup_posted":
				return {
					id,
					event,
					displayText: `Daily standup posted`,
					icon: <Calendar className="h-4 w-4" />,
					color: "text-orange-600",
				};

			case "arcade_run_completed":
				return {
					id,
					event,
					displayText: `Coding challenge completed`,
					icon: <Trophy className="h-4 w-4" />,
					color: "text-emerald-600",
				};

			default:
				return {
					id,
					event,
					displayText: `Unknown event: ${event.type}`,
					icon: <Activity className="h-4 w-4" />,
					color: "text-gray-600",
				};
		}
	};

	const getConnectionStatusColor = () => {
		switch (connectionStatus) {
			case "connected":
				return "bg-green-500";
			case "connecting":
				return "bg-yellow-500";
			case "disconnected":
				return "bg-red-500";
			case "error":
				return "bg-red-600";
			default:
				return "bg-gray-500";
		}
	};

	const getConnectionStatusText = () => {
		switch (connectionStatus) {
			case "connected":
				return "Connected";
			case "connecting":
				return "Connecting...";
			case "disconnected":
				return "Disconnected";
			case "error":
				return "Connection Error";
			default:
				return "Unknown";
		}
	};

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between text-sm font-medium">
					<div className="flex items-center gap-2">
						<Activity className="h-4 w-4" />
						Live Updates
					</div>

					{showConnectionStatus && (
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-1">
								{isConnected ? (
									<Wifi className="h-3 w-3 text-green-600" />
								) : (
									<WifiOff className="h-3 w-3 text-red-600" />
								)}
								<span className="text-xs text-muted-foreground">
									{getConnectionStatusText()}
								</span>
							</div>

							<div
								className={cn(
									"h-2 w-2 rounded-full",
									getConnectionStatusColor()
								)}
							/>

							{!isConnected && (
								<Button
									variant="ghost"
									size="sm"
									onClick={reconnect}
									className="h-6 px-2"
								>
									<RefreshCw className="h-3 w-3" />
								</Button>
							)}
						</div>
					)}
				</CardTitle>

				{activeSubscriptions > 0 && (
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className="text-xs"
						>
							{activeSubscriptions} active subscription
							{activeSubscriptions !== 1 ? "s" : ""}
						</Badge>
					</div>
				)}
			</CardHeader>

			{showEventHistory && (
				<CardContent className="pt-0">
					{recentEvents.length === 0 ? (
						<div className="text-center py-4 text-sm text-muted-foreground">
							No recent events
						</div>
					) : (
						<div className="space-y-2">
							{recentEvents.map((eventDisplay, index) => (
								<div key={eventDisplay.id}>
									<div className="flex items-center gap-2 py-1">
										<div className={cn("flex-shrink-0", eventDisplay.color)}>
											{eventDisplay.icon}
										</div>
										<span className="text-sm flex-1">
											{eventDisplay.displayText}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(
												eventDisplay.event.timestamp
											).toLocaleTimeString()}
										</span>
									</div>
									{index < recentEvents.length - 1 && (
										<Separator className="my-1" />
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			)}
		</Card>
	);
}

// Simplified connection status indicator
export function ConnectionStatus({ className }: { className?: string }) {
	const { connectionStatus, isConnected, reconnect } = useRealtime();

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{isConnected ? (
				<Wifi className="h-4 w-4 text-green-600" />
			) : (
				<WifiOff className="h-4 w-4 text-red-600" />
			)}

			<span className="text-sm text-muted-foreground">
				{connectionStatus === "connected" ? "Live" : "Offline"}
			</span>

			{!isConnected && (
				<Button
					variant="ghost"
					size="sm"
					onClick={reconnect}
					className="h-6 px-2"
				>
					<RefreshCw className="h-3 w-3" />
				</Button>
			)}
		</div>
	);
}

// Event notification toast component
export function RealtimeEventToast({ event }: { event: RealtimeEvent }) {
	const eventDisplay = React.useMemo(() => {
		switch (event.type) {
			case "retro_note_added":
				return {
					title: "New Note Added",
					description: "Someone added a new note to the retro board",
					icon: <MessageSquare className="h-4 w-4" />,
				};

			case "retro_vote_cast":
				return {
					title: "Vote Cast",
					description: "Someone voted on a retro note",
					icon: <Users className="h-4 w-4" />,
				};

			case "pr_updated":
				return {
					title: "PR Updated",
					description: "A pull request has been updated",
					icon: <GitPullRequest className="h-4 w-4" />,
				};

			default:
				return {
					title: "Live Update",
					description: `${event.type} event received`,
					icon: <Activity className="h-4 w-4" />,
				};
		}
	}, [event.type]);

	return (
		<div className="flex items-center gap-3">
			<div className="flex-shrink-0 text-blue-600">{eventDisplay.icon}</div>
			<div>
				<div className="font-medium text-sm">{eventDisplay.title}</div>
				<div className="text-xs text-muted-foreground">
					{eventDisplay.description}
				</div>
			</div>
		</div>
	);
}
