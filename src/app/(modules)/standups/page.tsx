"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
	StandupHistory,
	PostNowButton,
	ActivityTimeline,
} from "@/components/modules/autostand";
import type {
	GetStandupsRequest,
	GetStandupsResponse,
	GenerateStandupResponse,
	GitHubActivity,
} from "@/lib/modules/autostand/types";

interface Member {
	id: string;
	github_login: string;
	avatar_url: string | null;
}

export default function StandupsPage() {
	const [currentUser, setCurrentUser] = useState<Member | null>(null);
	const [recentActivity, setRecentActivity] = useState<GitHubActivity | null>(
		null
	);
	const [isLoadingUser, setIsLoadingUser] = useState(true);
	const [teamStats, setTeamStats] = useState({
		totalMembers: 0,
		standupsToday: 0,
		activeRepos: 0,
	});

	// Load current user info on mount
	useEffect(() => {
		loadCurrentUser();
		loadTeamStats();
	}, []);

	const loadTeamStats = async () => {
		try {
			// Load team members
			const membersResponse = await fetch("/api/organizations/members");
			if (membersResponse.ok) {
				const membersData = await membersResponse.json();
				const totalMembers = membersData.members?.length || 0;
				
				// Load today's standups
				const today = new Date().toISOString().split('T')[0];
				const standupsResponse = await fetch(`/api/standups?date_from=${today}&date_to=${today}`);
				let standupsToday = 0;
				if (standupsResponse.ok) {
					const standupsData = await standupsResponse.json();
					standupsToday = standupsData.standups?.length || 0;
				}

				setTeamStats({
					totalMembers,
					standupsToday,
					activeRepos: 0, // TODO: Add repo count from GitHub integration
				});
			}
		} catch (error) {
			console.error("Error loading team stats:", error);
		}
	};

	const loadCurrentUser = async () => {
		try {
			// Get current user from the organizations members API
			const response = await fetch("/api/organizations/members");
			if (!response.ok) {
				throw new Error("Failed to fetch current user");
			}
			
			const data = await response.json();
			// Find the current user in the members list
			const currentUserEmail = await getCurrentUserEmail();
			const currentMember = data.members.find((member: any) => 
				member.email === currentUserEmail
			);
			
			if (currentMember) {
				setCurrentUser({
					id: currentMember.id,
					github_login: currentMember.github_login || "unknown",
					avatar_url: currentMember.avatar_url,
				});
			} else {
				throw new Error("Current user not found in organization");
			}
		} catch (error) {
			console.error("Failed to load user:", error);
			toast.error("Failed to load user information");
		} finally {
			setIsLoadingUser(false);
		}
	};

	const getCurrentUserEmail = async () => {
		// Get current user email from Supabase auth
		const { createClient } = await import("@/lib/supabase/client");
		const supabase = createClient();
		const { data: { user } } = await supabase.auth.getUser();
		return user?.email;
	};

	const handleFetchStandups = async (
		request: GetStandupsRequest
	): Promise<GetStandupsResponse> => {
		try {
			const params = new URLSearchParams();

			if (request.member_id) params.append("member_id", request.member_id);
			if (request.date_from) params.append("date_from", request.date_from);
			if (request.date_to) params.append("date_to", request.date_to);
			if (request.limit) params.append("limit", request.limit.toString());
			if (request.cursor) params.append("cursor", request.cursor);
			if (request.order_by) params.append("order_by", request.order_by);
			if (request.order_dir) params.append("order_dir", request.order_dir);

			const response = await fetch(`/api/standups?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error("Failed to fetch standups:", error);
			toast.error("Failed to load standups");
			throw error;
		}
	};

	const handleGenerateStandup = async () => {
		if (!currentUser) {
			toast.error("User not loaded");
			return;
		}

		try {
			const response = await fetch("/api/standups/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					member_id: currentUser.id,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result: GenerateStandupResponse = await response.json();

			if (result.generated) {
				toast.success("Standup generated successfully!");
			} else {
				toast.info("Standup already exists for today");
			}

			// Refresh stats to show updated standup count
			loadTeamStats();

			// Extract activity from the generated standup
			if (result.standup.raw_github_data) {
				setRecentActivity(
					result.standup.raw_github_data as unknown as GitHubActivity
				);
			}
		} catch (error) {
			console.error("Failed to generate standup:", error);
			toast.error("Failed to generate standup");
		}
	};

	if (isLoadingUser) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="relative">
					<div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-blue-500"></div>
					<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
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
								<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-3 h-3 bg-blue-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								Auto<span className="font-medium">Stand</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Transform your GitHub activity into meaningful standup updates. 
							No more manual status reports—just intelligent automation.
						</p>
					</div>
					{currentUser && (
						<div className="flex items-center space-x-3">
							<PostNowButton onGenerate={handleGenerateStandup} />
						</div>
					)}
				</div>

				{/* Stats Overview */}
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-medium tracking-tight">Overview</h2>
						<div className="text-sm text-muted-foreground">Live metrics</div>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm group hover:bg-card/70 transition-all duration-300">
							<CardContent className="p-6">
								<div className="flex items-center justify-between mb-4">
									<div className="relative">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
											<Users className="h-6 w-6 text-blue-600" />
										</div>
										<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
									</div>
									<div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
										Active
									</div>
								</div>
								<div className="space-y-2">
									<div className="text-3xl font-light">
										{teamStats.totalMembers}
									</div>
									<div className="space-y-1">
										<div className="text-sm font-medium text-foreground/90">Team Members</div>
										<div className="text-xs text-muted-foreground">
											In your organization
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-border/50 bg-card/50 backdrop-blur-sm group hover:bg-card/70 transition-all duration-300">
							<CardContent className="p-6">
								<div className="flex items-center justify-between mb-4">
									<div className="relative">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/30 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
											<Activity className="h-6 w-6 text-green-600" />
										</div>
										<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/5 via-transparent to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
									</div>
									<div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
										Today
									</div>
								</div>
								<div className="space-y-2">
									<div className="text-3xl font-light">
										{teamStats.standupsToday}
									</div>
									<div className="space-y-1">
										<div className="text-sm font-medium text-foreground/90">Standups Today</div>
										<div className="text-xs text-muted-foreground">
											Generated automatically
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-border/50 bg-card/50 backdrop-blur-sm group hover:bg-card/70 transition-all duration-300">
							<CardContent className="p-6">
								<div className="flex items-center justify-between mb-4">
									<div className="relative">
										<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
											<Plus className="h-6 w-6 text-purple-600" />
										</div>
										<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
									</div>
									<div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
										Recent
									</div>
								</div>
								<div className="space-y-2">
									<div className="text-3xl font-light">
										{recentActivity?.commits?.length || 0}
									</div>
									<div className="space-y-1">
										<div className="text-sm font-medium text-foreground/90">GitHub Activity</div>
										<div className="text-xs text-muted-foreground">
											Recent commits tracked
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Main Content */}
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-medium tracking-tight">Activity & History</h2>
						<div className="text-sm text-muted-foreground">Real-time updates</div>
					</div>
					
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Recent Activity Timeline */}
						<div className="lg:col-span-1">
							{recentActivity ? (
								<ActivityTimeline activity={recentActivity} />
							) : (
								<EmptyState
									icon={<Activity className="size-6 text-muted-foreground" />}
									title="No Recent Activity"
									description="Generate a standup to see your GitHub activity and team insights."
									action={{
										label: "Generate Standup",
										onClick: handleGenerateStandup,
									}}
									secondaryAction={{
										label: "Load Demo Data",
										onClick: () => (window.location.href = "/dashboard"),
										variant: "outline",
									}}
								/>
							)}
						</div>

						{/* Standup History */}
						<div className="lg:col-span-2">
							<StandupHistory onFetchStandups={handleFetchStandups} />
						</div>
					</div>
				</div>
				
			{/* Close the main container */}
			</div>
		</div>
	);
}
