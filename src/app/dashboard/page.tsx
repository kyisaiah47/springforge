"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { useOnboarding } from "@/lib/onboarding/onboarding-provider";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Users,
	GitPullRequest,
	MessageSquare,
	Gamepad2,
	Play,
	HelpCircle,
	Database,
} from "lucide-react";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import {
	GuidedTour,
	defaultTourSteps,
} from "@/components/onboarding/guided-tour";
import Link from "next/link";

export default function DashboardPage() {
	const { user } = useAuth();
	const {
		showOnboardingFlow,
		showGuidedTour,
		hasCompletedOnboarding,
		completeOnboarding,
		closeOnboardingFlow,
		closeGuidedTour,
		startGuidedTour,
		markDemoDataSeeded,
	} = useOnboarding();

	const modules = [
		{
			title: "AutoStand",
			description: "Automated daily standups from GitHub activity",
			icon: Users,
			href: "/standups",
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950",
		},
		{
			title: "PR Radar",
			description: "Pull request insights and scoring",
			icon: GitPullRequest,
			href: "/pr-radar",
			color: "text-green-600",
			bgColor: "bg-green-50 dark:bg-green-950",
		},
		{
			title: "Retro Arena",
			description: "Collaborative team retrospectives",
			icon: MessageSquare,
			href: "/retro",
			color: "text-purple-600",
			bgColor: "bg-purple-50 dark:bg-purple-950",
		},
		{
			title: "Debug Arcade",
			description: "Coding challenges and skill development",
			icon: Gamepad2,
			href: "/arcade",
			color: "text-orange-600",
			bgColor: "bg-orange-50 dark:bg-orange-950",
		},
	];

	const userInitials =
		user?.user_metadata?.full_name
			?.split(" ")
			.map((name: string) => name[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) || "U";

	const handleOnboardingComplete = () => {
		completeOnboarding();
		markDemoDataSeeded();
		// Optionally start the guided tour after onboarding
		setTimeout(() => startGuidedTour(), 500);
	};

	const handleSeedDemoData = async () => {
		try {
			const response = await fetch("/api/admin/seed-demo", {
				method: "POST",
			});

			if (response.ok) {
				alert("Demo data seeded successfully!");
				window.location.reload();
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error seeding demo data:", error);
			alert("Failed to seed demo data");
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
			
			<div className="relative z-10 p-6 space-y-8">
				{/* Hero Section */}
				<div className="flex items-center justify-between py-8">
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<div className="relative">
								<div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 h-3 w-3 bg-green-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								Welcome to <span className="font-medium">Orbit</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Your development workflow is about to be transformed. 
							Access all your productivity modules from one beautiful interface.
						</p>
					</div>
					{hasCompletedOnboarding && (
						<Button
							variant="outline"
							onClick={startGuidedTour}
							className="flex items-center gap-2 rounded-xl"
						>
							<HelpCircle className="h-4 w-4" />
							Take Tour
						</Button>
					)}
				</div>

				{/* User Profile Card */}
				<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
					<CardContent className="p-6">
						<div className="flex items-center gap-4">
							<div className="relative">
								<Avatar className="h-12 w-12 ring-2 ring-border/50">
									<AvatarImage
										src={user?.user_metadata?.avatar_url}
										alt={user?.user_metadata?.full_name || "User"}
									/>
									<AvatarFallback className="bg-primary/10 text-primary font-medium">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background"></div>
							</div>
							<div className="flex-1">
								<div className="font-medium text-lg">
									{user?.user_metadata?.full_name || user?.email}
								</div>
								<div className="text-sm text-muted-foreground flex items-center gap-2">
									<span>GitHub: @{user?.user_metadata?.user_name}</span>
									<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
									<span>Ready to build</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Modules Grid */}
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-medium tracking-tight">Your Modules</h2>
						<div className="text-sm text-muted-foreground">4 productivity tools</div>
					</div>
					
					<div
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
						data-tour="modules"
					>
						{modules.map((module, index) => (
							<Link
								key={module.title}
								href={module.href}
								className="group"
							>
								<Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-primary/5">
									<CardContent className="p-6 space-y-4">
										<div className="flex items-center justify-between">
											<div className="relative">
												<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.bgColor.includes('blue') ? 'from-blue-500/20 to-blue-600/30' : 
													module.bgColor.includes('green') ? 'from-green-500/20 to-green-600/30' :
													module.bgColor.includes('purple') ? 'from-purple-500/20 to-purple-600/30' :
													'from-orange-500/20 to-orange-600/30'} border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
													<module.icon className={`h-6 w-6 ${module.color}`} />
												</div>
												<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
											</div>
											<div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
												Module {index + 1}
											</div>
										</div>
										
										<div className="space-y-2">
											<h3 className="text-lg font-medium group-hover:text-foreground/90 transition-colors">
												{module.title}
											</h3>
											<p className="text-sm text-muted-foreground leading-relaxed">
												{module.description}
											</p>
										</div>
										
										<div className="flex items-center justify-between pt-2">
											<div className="flex items-center space-x-1">
												<div className="w-1 h-1 bg-green-500 rounded-full"></div>
												<span className="text-xs text-muted-foreground">Active</span>
											</div>
											<div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
												Open →
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>

				{/* Quick Start Guide */}
				<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
					<CardContent className="p-6 space-y-6">
						<div className="space-y-2">
							<h3 className="text-xl font-medium">Quick Start Guide</h3>
							<p className="text-muted-foreground">
								Your workspace is ready. Here's how to get the most out of Orbit.
							</p>
						</div>
						
						<div className="grid md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
										<span className="text-xs font-medium text-blue-600">⌘</span>
									</div>
									<span className="text-sm font-medium">Command Palette</span>
								</div>
								<p className="text-xs text-muted-foreground">
									Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd> to quickly navigate
								</p>
							</div>
							
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
										<span className="text-xs font-medium text-green-600">⚡</span>
									</div>
									<span className="text-sm font-medium">Shortcuts</span>
								</div>
								<p className="text-xs text-muted-foreground">
									<kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">g+s</kbd> AutoStand, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">g+p</kbd> PR Radar
								</p>
							</div>
							
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
										<span className="text-xs font-medium text-purple-600">🎨</span>
									</div>
									<span className="text-sm font-medium">Themes</span>
								</div>
								<p className="text-xs text-muted-foreground">
									Switch themes from user menu
								</p>
							</div>
						</div>

						{hasCompletedOnboarding && (
							<div className="pt-4 border-t border-border/50 flex gap-3">
								<Button
									variant="outline"
									size="sm"
									onClick={startGuidedTour}
									className="flex items-center gap-2 rounded-lg"
								>
									<Play className="h-4 w-4" />
									Take Tour
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleSeedDemoData}
									className="flex items-center gap-2 rounded-lg"
								>
									<Database className="h-4 w-4" />
									Demo Data
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Close the main container */}
			</div>

			{/* Onboarding Flow */}
			<OnboardingFlow
				isOpen={showOnboardingFlow}
				onClose={closeOnboardingFlow}
				onComplete={handleOnboardingComplete}
			/>

			{/* Guided Tour */}
			<GuidedTour
				isOpen={showGuidedTour}
				onClose={closeGuidedTour}
				steps={defaultTourSteps}
			/>
		</div>
	);
}
