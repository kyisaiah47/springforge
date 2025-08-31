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
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Welcome to SprintForge
					</h1>
					<p className="text-muted-foreground">
						Your all-in-one developer productivity suite
					</p>
				</div>
				{hasCompletedOnboarding && (
					<Button
						variant="outline"
						onClick={startGuidedTour}
						className="flex items-center gap-2"
					>
						<HelpCircle className="h-4 w-4" />
						Take Tour
					</Button>
				)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							<AvatarImage
								src={user?.user_metadata?.avatar_url}
								alt={user?.user_metadata?.full_name || "User"}
							/>
							<AvatarFallback>{userInitials}</AvatarFallback>
						</Avatar>
						<div>
							<div className="font-semibold">
								{user?.user_metadata?.full_name || user?.email}
							</div>
							<div className="text-sm text-muted-foreground">
								GitHub: @{user?.user_metadata?.user_name}
							</div>
						</div>
					</CardTitle>
				</CardHeader>
			</Card>

			<div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
				data-tour="modules"
			>
				{modules.map((module) => (
					<Link
						key={module.title}
						href={module.href}
					>
						<Card className="hover:shadow-md transition-shadow cursor-pointer">
							<CardHeader className="pb-3">
								<div
									className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-3`}
								>
									<module.icon className={`h-6 w-6 ${module.color}`} />
								</div>
								<CardTitle className="text-lg">{module.title}</CardTitle>
								<CardDescription>{module.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Getting Started</CardTitle>
					<CardDescription>
						Your database schema and authentication are configured. Ready to
						explore the modules!
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="space-y-2 text-sm">
							<p>
								• Use{" "}
								<kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+K</kbd>{" "}
								to open the command palette
							</p>
							<p>
								• Navigate quickly with keyboard shortcuts:{" "}
								<kbd className="px-2 py-1 bg-muted rounded text-xs">g+s</kbd>{" "}
								for AutoStand,{" "}
								<kbd className="px-2 py-1 bg-muted rounded text-xs">g+p</kbd>{" "}
								for PR Radar
							</p>
							<p>• Toggle between light and dark themes from the user menu</p>
						</div>
						{hasCompletedOnboarding && (
							<div className="pt-2 border-t flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={startGuidedTour}
									className="flex items-center gap-2"
								>
									<Play className="h-4 w-4" />
									Take the Tour Again
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleSeedDemoData}
									className="flex items-center gap-2"
								>
									<Database className="h-4 w-4" />
									Seed Demo Data
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

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
