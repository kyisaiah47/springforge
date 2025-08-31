import { OrganizationSettings } from "@/components/settings/organization-settings";
import { TeamManagement } from "@/components/settings/team-management";
import { IntegrationSettings } from "@/components/settings/integration-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
			<p className="text-muted-foreground mb-6">
				Manage your organization and team settings
			</p>

			<Tabs
				defaultValue="organization"
				className="space-y-6"
			>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="organization">Organization</TabsTrigger>
					<TabsTrigger value="team">Team</TabsTrigger>
					<TabsTrigger value="integrations">Integrations</TabsTrigger>
				</TabsList>

				<TabsContent
					value="organization"
					className="space-y-6"
				>
					<OrganizationSettings />
				</TabsContent>

				<TabsContent
					value="team"
					className="space-y-6"
				>
					<TeamManagement />
				</TabsContent>

				<TabsContent
					value="integrations"
					className="space-y-6"
				>
					<IntegrationSettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}
