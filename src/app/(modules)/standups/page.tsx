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
			<div className="p-6">
				<div className="animate-pulse">
					<div className="h-8 bg-muted rounded w-48 mb-2"></div>
					<div className="h-4 bg-muted rounded w-96 mb-6"></div>
					<div className="h-32 bg-muted rounded"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-2">AutoStand</h1>
					<p className="text-muted-foreground">
						Automated daily standups from GitHub activity
					</p>
				</div>
				{currentUser && <PostNowButton onGenerate={handleGenerateStandup} />}
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Team Members</CardTitle>
						<Users className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{teamStats.totalMembers}</div>
						<p className="text-xs text-muted-foreground">In your organization</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Standups Today
						</CardTitle>
						<Activity className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{teamStats.standupsToday}</div>
						<p className="text-xs text-muted-foreground">
							Generated today
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							GitHub Activity
						</CardTitle>
						<Plus className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{recentActivity?.commits?.length || 0}
						</div>
						<p className="text-xs text-muted-foreground">Recent commits</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
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
	);
}
