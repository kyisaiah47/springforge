"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Users,
	UserPlus,
	MoreHorizontal,
	Trash2,
	Shield,
	User,
	Loader2,
	Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
	id: string;
	email: string;
	github_login: string | null;
	github_id: string | null;
	avatar_url: string | null;
	slack_user_id: string | null;
	role: "admin" | "member";
	created_at: string;
}

interface TeamData {
	members: Member[];
	current_user_role: "admin" | "member";
}

export function TeamManagement() {
	const [data, setData] = useState<TeamData | null>(null);
	const [loading, setLoading] = useState(true);
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [inviteForm, setInviteForm] = useState({
		email: "",
		role: "member" as "admin" | "member",
	});
	const [inviting, setInviting] = useState(false);
	const { toast } = useToast();

	const fetchMembers = useCallback(async () => {
		try {
			const response = await fetch("/api/organizations/members");
			if (!response.ok) throw new Error("Failed to fetch members");

			const teamData: TeamData = await response.json();
			setData(teamData);
		} catch (error) {
			console.error("Error fetching members:", error);
			toast({
				title: "Error",
				description: "Failed to load team members",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	const handleInviteMember = async () => {
		if (!inviteForm.email.trim()) return;

		setInviting(true);
		try {
			const response = await fetch("/api/organizations/members", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(inviteForm),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to invite member");
			}

			toast({
				title: "Success",
				description: "Team member invited successfully",
			});

			setInviteDialogOpen(false);
			setInviteForm({ email: "", role: "member" });
			await fetchMembers();
		} catch (error) {
			console.error("Error inviting member:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to invite member",
				variant: "destructive",
			});
		} finally {
			setInviting(false);
		}
	};

	const handleUpdateRole = async (
		memberId: string,
		newRole: "admin" | "member"
	) => {
		try {
			const response = await fetch("/api/organizations/members", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					member_id: memberId,
					role: newRole,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update member role");
			}

			toast({
				title: "Success",
				description: "Member role updated successfully",
			});

			await fetchMembers();
		} catch (error) {
			console.error("Error updating member role:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to update member role",
				variant: "destructive",
			});
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		if (!confirm("Are you sure you want to remove this team member?")) return;

		try {
			const response = await fetch(`/api/organizations/members/${memberId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to remove member");
			}

			toast({
				title: "Success",
				description: "Team member removed successfully",
			});

			await fetchMembers();
		} catch (error) {
			console.error("Error removing member:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to remove member",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardContent className="py-12">
					<p className="text-center text-muted-foreground">
						Failed to load team members
					</p>
				</CardContent>
			</Card>
		);
	}

	const isAdmin = data.current_user_role === "admin";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						<div>
							<CardTitle>Team Members</CardTitle>
							<CardDescription>
								Manage your team members and their permissions
							</CardDescription>
						</div>
					</div>
					{isAdmin && (
						<Dialog
							open={inviteDialogOpen}
							onOpenChange={setInviteDialogOpen}
						>
							<DialogTrigger asChild>
								<Button>
									<UserPlus className="mr-2 h-4 w-4" />
									Invite Member
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Invite Team Member</DialogTitle>
									<DialogDescription>
										Send an invitation to join your organization
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="invite-email">Email Address</Label>
										<Input
											id="invite-email"
											type="email"
											value={inviteForm.email}
											onChange={(e) =>
												setInviteForm({ ...inviteForm, email: e.target.value })
											}
											placeholder="colleague@company.com"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="invite-role">Role</Label>
										<Select
											value={inviteForm.role}
											onValueChange={(value: "admin" | "member") =>
												setInviteForm({ ...inviteForm, role: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="member">Member</SelectItem>
												<SelectItem value="admin">Administrator</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setInviteDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										onClick={handleInviteMember}
										disabled={inviting}
									>
										{inviting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Inviting...
											</>
										) : (
											"Send Invitation"
										)}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{data.members.map((member) => (
						<div
							key={member.id}
							className="flex items-center justify-between p-4 border rounded-lg"
						>
							<div className="flex items-center gap-3">
								<Avatar>
									<AvatarImage src={member.avatar_url || undefined} />
									<AvatarFallback>
										{member.github_login?.[0]?.toUpperCase() ||
											member.email[0].toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className="flex items-center gap-2">
										<p className="font-medium">
											{member.github_login || member.email}
										</p>
										<Badge
											variant={
												member.role === "admin" ? "default" : "secondary"
											}
										>
											{member.role === "admin" ? (
												<>
													<Shield className="mr-1 h-3 w-3" />
													Admin
												</>
											) : (
												<>
													<User className="mr-1 h-3 w-3" />
													Member
												</>
											)}
										</Badge>
									</div>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Mail className="h-3 w-3" />
										{member.email}
									</div>
								</div>
							</div>

							{isAdmin && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
										>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												handleUpdateRole(
													member.id,
													member.role === "admin" ? "member" : "admin"
												)
											}
										>
											{member.role === "admin" ? (
												<>
													<User className="mr-2 h-4 w-4" />
													Make Member
												</>
											) : (
												<>
													<Shield className="mr-2 h-4 w-4" />
													Make Admin
												</>
											)}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleRemoveMember(member.id)}
											className="text-destructive"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Remove Member
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					))}

					{data.members.length === 0 && (
						<div className="text-center py-8">
							<Users className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-2 text-sm font-semibold">No team members</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Get started by inviting your first team member.
							</p>
						</div>
					)}

					{!isAdmin && (
						<div className="flex items-center gap-2 p-3 bg-muted rounded-md">
							<Badge variant="secondary">Member</Badge>
							<span className="text-sm text-muted-foreground">
								Only administrators can manage team members
							</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
