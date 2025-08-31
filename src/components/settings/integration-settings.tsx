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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Github,
	MessageSquare,
	Plus,
	MoreHorizontal,
	Trash2,
	Settings,
	Loader2,
	TestTube,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
	id: string;
	type: "github" | "slack";
	settings: Record<string, unknown>;
	created_at: string;
}

interface IntegrationData {
	integrations: Integration[];
	current_user_role: "admin" | "member";
}

interface TestResult {
	success: boolean;
	message: string;
	details: Record<string, unknown>;
}

export function IntegrationSettings() {
	const [data, setData] = useState<IntegrationData | null>(null);
	const [loading, setLoading] = useState(true);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedIntegration, setSelectedIntegration] =
		useState<Integration | null>(null);
	const [createForm, setCreateForm] = useState({
		type: "slack" as "github" | "slack",
		webhook_url: "",
		access_token: "",
		github_org: "",
		channel: "",
	});
	const [editForm, setEditForm] = useState({
		webhook_url: "",
		access_token: "",
		github_org: "",
		channel: "",
	});
	const [creating, setCreating] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [testing, setTesting] = useState<string | null>(null);
	const { toast } = useToast();

	const fetchIntegrations = useCallback(async () => {
		try {
			const response = await fetch("/api/organizations/integrations");
			if (!response.ok) throw new Error("Failed to fetch integrations");

			const integrationData: IntegrationData = await response.json();
			setData(integrationData);
		} catch (error) {
			console.error("Error fetching integrations:", error);
			toast({
				title: "Error",
				description: "Failed to load integrations",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		fetchIntegrations();
	}, [fetchIntegrations]);

	const handleCreateIntegration = async () => {
		setCreating(true);
		try {
			const settings: Record<string, unknown> = {};
			let access_token = "";

			if (createForm.type === "slack") {
				settings.webhook_url = createForm.webhook_url;
				if (createForm.channel) settings.channel = createForm.channel;
			} else if (createForm.type === "github") {
				access_token = createForm.access_token;
				if (createForm.github_org) settings.github_org = createForm.github_org;
			}

			const response = await fetch("/api/organizations/integrations", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					type: createForm.type,
					settings,
					access_token: access_token || undefined,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create integration");
			}

			toast({
				title: "Success",
				description: "Integration created successfully",
			});

			setCreateDialogOpen(false);
			setCreateForm({
				type: "slack",
				webhook_url: "",
				access_token: "",
				github_org: "",
				channel: "",
			});
			await fetchIntegrations();
		} catch (error) {
			console.error("Error creating integration:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to create integration",
				variant: "destructive",
			});
		} finally {
			setCreating(false);
		}
	};

	const handleUpdateIntegration = async () => {
		if (!selectedIntegration) return;

		setUpdating(true);
		try {
			const settings: Record<string, unknown> = {};
			let access_token = "";

			if (selectedIntegration.type === "slack") {
				settings.webhook_url = editForm.webhook_url;
				if (editForm.channel) settings.channel = editForm.channel;
			} else if (selectedIntegration.type === "github") {
				access_token = editForm.access_token;
				if (editForm.github_org) settings.github_org = editForm.github_org;
			}

			const response = await fetch(
				`/api/organizations/integrations/${selectedIntegration.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						settings,
						access_token: access_token || undefined,
					}),
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update integration");
			}

			toast({
				title: "Success",
				description: "Integration updated successfully",
			});

			setEditDialogOpen(false);
			setSelectedIntegration(null);
			await fetchIntegrations();
		} catch (error) {
			console.error("Error updating integration:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to update integration",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const handleDeleteIntegration = async (integrationId: string) => {
		if (!confirm("Are you sure you want to delete this integration?")) return;

		try {
			const response = await fetch(
				`/api/organizations/integrations/${integrationId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete integration");
			}

			toast({
				title: "Success",
				description: "Integration deleted successfully",
			});

			await fetchIntegrations();
		} catch (error) {
			console.error("Error deleting integration:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to delete integration",
				variant: "destructive",
			});
		}
	};

	const handleTestIntegration = async (integration: Integration) => {
		setTesting(integration.id);
		try {
			const testData: Record<string, unknown> = {
				type: integration.type,
				settings: integration.settings,
			};

			// For GitHub, we need to prompt for access token since it's not stored in settings
			if (integration.type === "github") {
				const token = prompt("Enter your GitHub access token for testing:");
				if (!token) {
					setTesting(null);
					return;
				}
				testData.access_token = token;
			}

			const response = await fetch("/api/organizations/integrations/test", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(testData),
			});

			if (!response.ok) throw new Error("Failed to test integration");

			const result: TestResult = await response.json();

			toast({
				title: result.success ? "Test Successful" : "Test Failed",
				description: result.message,
				variant: result.success ? "default" : "destructive",
			});
		} catch (error) {
			console.error("Error testing integration:", error);
			toast({
				title: "Error",
				description: "Failed to test integration",
				variant: "destructive",
			});
		} finally {
			setTesting(null);
		}
	};

	const openEditDialog = (integration: Integration) => {
		setSelectedIntegration(integration);
		setEditForm({
			webhook_url: (integration.settings.webhook_url as string) || "",
			access_token: "", // Don't pre-fill for security
			github_org: (integration.settings.github_org as string) || "",
			channel: (integration.settings.channel as string) || "",
		});
		setEditDialogOpen(true);
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
						Failed to load integrations
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
						<Settings className="h-5 w-5" />
						<div>
							<CardTitle>Integrations</CardTitle>
							<CardDescription>
								Connect Orbit with your development tools
							</CardDescription>
						</div>
					</div>
					{isAdmin && (
						<Dialog
							open={createDialogOpen}
							onOpenChange={setCreateDialogOpen}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									Add Integration
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add Integration</DialogTitle>
									<DialogDescription>
										Connect a new service to your organization
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Integration Type</Label>
										<Select
											value={createForm.type}
											onValueChange={(value: "github" | "slack") =>
												setCreateForm({ ...createForm, type: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="slack">
													<div className="flex items-center gap-2">
														<MessageSquare className="h-4 w-4" />
														Slack
													</div>
												</SelectItem>
												<SelectItem value="github">
													<div className="flex items-center gap-2">
														<Github className="h-4 w-4" />
														GitHub
													</div>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{createForm.type === "slack" && (
										<>
											<div className="space-y-2">
												<Label htmlFor="webhook-url">Webhook URL</Label>
												<Input
													id="webhook-url"
													type="url"
													value={createForm.webhook_url}
													onChange={(e) =>
														setCreateForm({
															...createForm,
															webhook_url: e.target.value,
														})
													}
													placeholder="https://hooks.slack.com/services/..."
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="channel">Channel (Optional)</Label>
												<Input
													id="channel"
													value={createForm.channel}
													onChange={(e) =>
														setCreateForm({
															...createForm,
															channel: e.target.value,
														})
													}
													placeholder="#general"
												/>
											</div>
										</>
									)}

									{createForm.type === "github" && (
										<>
											<div className="space-y-2">
												<Label htmlFor="access-token">Access Token</Label>
												<Input
													id="access-token"
													type="password"
													value={createForm.access_token}
													onChange={(e) =>
														setCreateForm({
															...createForm,
															access_token: e.target.value,
														})
													}
													placeholder="ghp_..."
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="github-org">
													Organization (Optional)
												</Label>
												<Input
													id="github-org"
													value={createForm.github_org}
													onChange={(e) =>
														setCreateForm({
															...createForm,
															github_org: e.target.value,
														})
													}
													placeholder="your-org"
												/>
											</div>
										</>
									)}
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setCreateDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										onClick={handleCreateIntegration}
										disabled={creating}
									>
										{creating ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating...
											</>
										) : (
											"Create Integration"
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
					{data.integrations.map((integration) => (
						<div
							key={integration.id}
							className="flex items-center justify-between p-4 border rounded-lg"
						>
							<div className="flex items-center gap-3">
								{integration.type === "github" ? (
									<Github className="h-8 w-8" />
								) : (
									<MessageSquare className="h-8 w-8" />
								)}
								<div>
									<div className="flex items-center gap-2">
										<p className="font-medium capitalize">{integration.type}</p>
										<Badge variant="outline">
											{integration.type === "github" ? "API" : "Webhook"}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										{integration.type === "slack"
											? `Webhook: ${(
													(integration.settings.webhook_url as string) || ""
											  )?.substring(0, 50)}...`
											: `Organization: ${
													(integration.settings.github_org as string) ||
													"Personal"
											  }`}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleTestIntegration(integration)}
									disabled={testing === integration.id}
								>
									{testing === integration.id ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Testing...
										</>
									) : (
										<>
											<TestTube className="mr-2 h-4 w-4" />
											Test
										</>
									)}
								</Button>

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
												onClick={() => openEditDialog(integration)}
											>
												<Settings className="mr-2 h-4 w-4" />
												Edit Settings
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleDeleteIntegration(integration.id)}
												className="text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>
					))}

					{data.integrations.length === 0 && (
						<div className="text-center py-8">
							<Settings className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-2 text-sm font-semibold">No integrations</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Connect GitHub and Slack to get started with Orbit.
							</p>
						</div>
					)}

					{!isAdmin && (
						<div className="flex items-center gap-2 p-3 bg-muted rounded-md">
							<Badge variant="secondary">Member</Badge>
							<span className="text-sm text-muted-foreground">
								Only administrators can manage integrations
							</span>
						</div>
					)}
				</div>
			</CardContent>

			{/* Edit Integration Dialog */}
			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Integration</DialogTitle>
						<DialogDescription>
							Update your {selectedIntegration?.type} integration settings
						</DialogDescription>
					</DialogHeader>
					{selectedIntegration && (
						<div className="space-y-4">
							{selectedIntegration.type === "slack" && (
								<>
									<div className="space-y-2">
										<Label htmlFor="edit-webhook-url">Webhook URL</Label>
										<Input
											id="edit-webhook-url"
											type="url"
											value={editForm.webhook_url}
											onChange={(e) =>
												setEditForm({
													...editForm,
													webhook_url: e.target.value,
												})
											}
											placeholder="https://hooks.slack.com/services/..."
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-channel">Channel (Optional)</Label>
										<Input
											id="edit-channel"
											value={editForm.channel}
											onChange={(e) =>
												setEditForm({ ...editForm, channel: e.target.value })
											}
											placeholder="#general"
										/>
									</div>
								</>
							)}

							{selectedIntegration.type === "github" && (
								<>
									<div className="space-y-2">
										<Label htmlFor="edit-access-token">Access Token</Label>
										<Input
											id="edit-access-token"
											type="password"
											value={editForm.access_token}
											onChange={(e) =>
												setEditForm({
													...editForm,
													access_token: e.target.value,
												})
											}
											placeholder="Enter new token or leave blank to keep current"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-github-org">
											Organization (Optional)
										</Label>
										<Input
											id="edit-github-org"
											value={editForm.github_org}
											onChange={(e) =>
												setEditForm({ ...editForm, github_org: e.target.value })
											}
											placeholder="your-org"
										/>
									</div>
								</>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateIntegration}
							disabled={updating}
						>
							{updating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								"Update Integration"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
