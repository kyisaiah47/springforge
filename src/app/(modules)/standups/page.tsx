"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	// Load current user info on mount
	useEffect(() => {
		loadCurrentUser();
	}, []);

	const loadCurrentUser = async () => {
		try {
			// This would typically come from auth context or API
			// For now, we'll simulate it
			setCurrentUser({
				id: "user-1",
				github_login: "demo-user",
				avatar_url: null,
			});
		} catch (error) {
			console.error("Failed to load user:", error);
			toast.error("Failed to load user information");
		} finally {
			setIsLoadingUser(false);
		}
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
						<div className="text-2xl font-bold">12</div>
						<p className="text-xs text-muted-foreground">Active this week</p>
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
						<div className="text-2xl font-bold">8</div>
						<p className="text-xs text-muted-foreground">
							Generated automatically
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
						<div className="text-2xl font-bold">24</div>
						<p className="text-xs text-muted-foreground">Commits this week</p>
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
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Activity className="size-5" />
									Recent Activity
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-center py-8 text-muted-foreground">
									<Activity className="size-8 mx-auto mb-2 opacity-50" />
									<p className="mb-2">No recent activity</p>
									<p className="text-sm">
										Generate a standup to see your GitHub activity
									</p>
								</div>
							</CardContent>
						</Card>
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
