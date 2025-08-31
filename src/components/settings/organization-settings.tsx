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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Organization {
	id: string;
	name: string;
	settings: {
		timezone?: string;
		slack_webhook_url?: string;
		github_org?: string;
		feature_flags?: {
			notion_export?: boolean;
			jira_integration?: boolean;
			advanced_pr_scoring?: boolean;
		};
	};
	created_at: string;
}

interface OrganizationData {
	organization: Organization;
	member_role: "admin" | "member";
}

export function OrganizationSettings() {
	const [data, setData] = useState<OrganizationData | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		timezone: "",
		slack_webhook_url: "",
		github_org: "",
		feature_flags: {
			notion_export: false,
			jira_integration: false,
			advanced_pr_scoring: false,
		},
	});
	const { toast } = useToast();

	const fetchOrganization = useCallback(async () => {
		try {
			const response = await fetch("/api/organizations");
			if (!response.ok) throw new Error("Failed to fetch organization");

			const orgData: OrganizationData = await response.json();
			setData(orgData);

			// Initialize form data
			setFormData({
				name: orgData.organization.name,
				timezone: orgData.organization.settings.timezone || "America/New_York",
				slack_webhook_url:
					orgData.organization.settings.slack_webhook_url || "",
				github_org: orgData.organization.settings.github_org || "",
				feature_flags: {
					notion_export:
						orgData.organization.settings.feature_flags?.notion_export || false,
					jira_integration:
						orgData.organization.settings.feature_flags?.jira_integration ||
						false,
					advanced_pr_scoring:
						orgData.organization.settings.feature_flags?.advanced_pr_scoring ||
						false,
				},
			});
		} catch (error) {
			console.error("Error fetching organization:", error);
			toast({
				title: "Error",
				description: "Failed to load organization settings",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		fetchOrganization();
	}, [fetchOrganization]);

	const handleSave = async () => {
		if (!data || data.member_role !== "admin") return;

		setSaving(true);
		try {
			const response = await fetch("/api/organizations", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					settings: {
						timezone: formData.timezone,
						slack_webhook_url: formData.slack_webhook_url,
						github_org: formData.github_org,
						feature_flags: formData.feature_flags,
					},
				}),
			});

			if (!response.ok) throw new Error("Failed to update organization");

			toast({
				title: "Success",
				description: "Organization settings updated successfully",
			});

			// Refresh data
			await fetchOrganization();
		} catch (error) {
			console.error("Error updating organization:", error);
			toast({
				title: "Error",
				description: "Failed to update organization settings",
				variant: "destructive",
			});
		} finally {
			setSaving(false);
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
						Failed to load organization settings
					</p>
				</CardContent>
			</Card>
		);
	}

	const isAdmin = data.member_role === "admin";

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Building2 className="h-5 w-5" />
						<CardTitle>Organization Details</CardTitle>
					</div>
					<CardDescription>
						Manage your organization&apos;s basic information and settings
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label htmlFor="org-name">Organization Name</Label>
							<Input
								id="org-name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								disabled={!isAdmin}
								placeholder="Enter organization name"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="timezone">Timezone</Label>
							<Input
								id="timezone"
								value={formData.timezone}
								onChange={(e) =>
									setFormData({ ...formData, timezone: e.target.value })
								}
								disabled={!isAdmin}
								placeholder="America/New_York"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="github-org">GitHub Organization</Label>
							<Input
								id="github-org"
								value={formData.github_org}
								onChange={(e) =>
									setFormData({ ...formData, github_org: e.target.value })
								}
								disabled={!isAdmin}
								placeholder="your-github-org"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slack-webhook">Default Slack Webhook URL</Label>
							<Input
								id="slack-webhook"
								type="url"
								value={formData.slack_webhook_url}
								onChange={(e) =>
									setFormData({
										...formData,
										slack_webhook_url: e.target.value,
									})
								}
								disabled={!isAdmin}
								placeholder="https://hooks.slack.com/services/..."
							/>
							<p className="text-sm text-muted-foreground">
								Used as fallback for notifications when no specific integration
								is configured
							</p>
						</div>
					</div>

					{isAdmin && (
						<>
							<Separator />
							<Button
								onClick={handleSave}
								disabled={saving}
								className="w-full"
							>
								{saving ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</>
					)}

					{!isAdmin && (
						<div className="flex items-center gap-2 p-3 bg-muted rounded-md">
							<Badge variant="secondary">Member</Badge>
							<span className="text-sm text-muted-foreground">
								Only administrators can modify organization settings
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Feature Flags</CardTitle>
					<CardDescription>
						Enable or disable experimental features for your organization
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Notion Export</Label>
								<p className="text-sm text-muted-foreground">
									Enable exporting retrospectives to Notion
								</p>
							</div>
							<Switch
								checked={formData.feature_flags.notion_export}
								onCheckedChange={(checked) =>
									setFormData({
										...formData,
										feature_flags: {
											...formData.feature_flags,
											notion_export: checked,
										},
									})
								}
								disabled={!isAdmin}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Jira Integration</Label>
								<p className="text-sm text-muted-foreground">
									Connect with Jira for issue tracking
								</p>
							</div>
							<Switch
								checked={formData.feature_flags.jira_integration}
								onCheckedChange={(checked) =>
									setFormData({
										...formData,
										feature_flags: {
											...formData.feature_flags,
											jira_integration: checked,
										},
									})
								}
								disabled={!isAdmin}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Advanced PR Scoring</Label>
								<p className="text-sm text-muted-foreground">
									Use enhanced algorithms for PR risk assessment
								</p>
							</div>
							<Switch
								checked={formData.feature_flags.advanced_pr_scoring}
								onCheckedChange={(checked) =>
									setFormData({
										...formData,
										feature_flags: {
											...formData.feature_flags,
											advanced_pr_scoring: checked,
										},
									})
								}
								disabled={!isAdmin}
							/>
						</div>
					</div>

					{isAdmin && (
						<>
							<Separator />
							<Button
								onClick={handleSave}
								disabled={saving}
								variant="outline"
								className="w-full"
							>
								{saving ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Feature Flags
									</>
								)}
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
