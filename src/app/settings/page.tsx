import { OrganizationSettings } from "@/components/settings/organization-settings";
import { TeamManagement } from "@/components/settings/team-management";
import { IntegrationSettings } from "@/components/settings/integration-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
	return (
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
			
			<div className="relative z-10 p-6 space-y-8">
				{/* Header */}
				<div className="py-6">
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<div className="relative">
								<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-3 h-3 bg-blue-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								<span className="font-medium">Settings</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Configure your organization, manage team members, and set up integrations. 
							Customize Orbit to work perfectly for your development workflow.
						</p>
					</div>
				</div>

				{/* Main Content */}
				<div className="space-y-6">
					<Tabs
						defaultValue="organization"
						className="space-y-8"
					>
						<div className="flex items-center justify-between">
							<TabsList className="bg-card/50 backdrop-blur-sm border-border/50 rounded-xl p-1">
								<TabsTrigger 
									value="organization"
									className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
								>
									Organization
								</TabsTrigger>
								<TabsTrigger 
									value="team"
									className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
								>
									Team
								</TabsTrigger>
								<TabsTrigger 
									value="integrations"
									className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
								>
									Integrations
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent
							value="organization"
							className="space-y-6 mt-8"
						>
							<OrganizationSettings />
						</TabsContent>

						<TabsContent
							value="team"
							className="space-y-6 mt-8"
						>
							<TeamManagement />
						</TabsContent>

						<TabsContent
							value="integrations"
							className="space-y-6 mt-8"
						>
							<IntegrationSettings />
						</TabsContent>
					</Tabs>
				</div>
				
			{/* Close the main container */}
			</div>
		</div>
	);
}
