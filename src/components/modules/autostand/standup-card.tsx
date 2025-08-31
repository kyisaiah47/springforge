"use client";

import { formatDistanceToNow } from "date-fns";
import { GitCommit, GitPullRequest, Bug, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Standup } from "@/lib/modules/autostand/types";

interface StandupCardProps {
	standup: Standup & {
		member: {
			github_login: string;
			avatar_url: string | null;
		};
	};
}

export function StandupCard({ standup }: StandupCardProps) {
	const { member } = standup;
	const standupDate = new Date(standup.date);
	const createdAt = new Date(standup.created_at);

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center gap-3">
					<Avatar className="size-10">
						<AvatarImage
							src={member.avatar_url || undefined}
							alt={member.github_login}
						/>
						<AvatarFallback>
							<User className="size-4" />
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<CardTitle className="text-lg">{member.github_login}</CardTitle>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Calendar className="size-3" />
								{standupDate.toLocaleDateString()}
							</div>
							<div>
								Generated {formatDistanceToNow(createdAt, { addSuffix: true })}
							</div>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Yesterday Section */}
				<div>
					<h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
						Yesterday
					</h4>
					<div className="space-y-2">
						{standup.yesterday.length > 0 ? (
							standup.yesterday.map((item, index) => (
								<div
									key={index}
									className="flex items-start gap-2"
								>
									<GitCommit className="size-4 text-green-500 mt-0.5 shrink-0" />
									<span className="text-sm">{item}</span>
								</div>
							))
						) : (
							<div className="flex items-start gap-2">
								<GitCommit className="size-4 text-muted-foreground mt-0.5 shrink-0" />
								<span className="text-sm text-muted-foreground">
									No activity recorded
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Today Section */}
				<div>
					<h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
						Today
					</h4>
					<div className="space-y-2">
						{standup.today.length > 0 ? (
							standup.today.map((item, index) => (
								<div
									key={index}
									className="flex items-start gap-2"
								>
									<GitPullRequest className="size-4 text-blue-500 mt-0.5 shrink-0" />
									<span className="text-sm">{item}</span>
								</div>
							))
						) : (
							<div className="flex items-start gap-2">
								<GitPullRequest className="size-4 text-muted-foreground mt-0.5 shrink-0" />
								<span className="text-sm text-muted-foreground">
									No plans recorded
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Blockers Section */}
				{standup.blockers.length > 0 && (
					<div>
						<h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
							Blockers
						</h4>
						<div className="space-y-2">
							{standup.blockers.map((blocker, index) => (
								<div
									key={index}
									className="flex items-start gap-2"
								>
									<Bug className="size-4 text-red-500 mt-0.5 shrink-0" />
									<span className="text-sm">{blocker}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
