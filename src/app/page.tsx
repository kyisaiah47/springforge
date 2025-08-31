"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Users,
	GitPullRequest,
	MessageSquare,
	Gamepad2,
	ArrowRight,
	Github,
} from "lucide-react";

export default function Home() {
	const { user, loading, signInWithGitHub } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (user && !loading) {
			router.push("/dashboard");
		}
	}, [user, loading, router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (user) {
		return null; // Will redirect via useEffect
	}

	const features = [
		{
			title: "AutoStand",
			description: "Automated daily standups from GitHub activity",
			icon: Users,
			color: "text-blue-600",
		},
		{
			title: "PR Radar",
			description: "Pull request insights and scoring",
			icon: GitPullRequest,
			color: "text-green-600",
		},
		{
			title: "Retro Arena",
			description: "Collaborative team retrospectives",
			icon: MessageSquare,
			color: "text-purple-600",
		},
		{
			title: "Debug Arcade",
			description: "Coding challenges and skill development",
			icon: Gamepad2,
			color: "text-orange-600",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<div className="container mx-auto px-4 py-16">
				{/* Hero Section */}
				<div className="text-center mb-16">
					<div className="flex items-center justify-center mb-6">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
							<span className="text-2xl font-bold">SF</span>
						</div>
					</div>
					<h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
						Welcome to{" "}
						<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
							SprintForge
						</span>
					</h1>
					<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
						Your all-in-one developer productivity suite. Streamline workflows
						with automated standups, PR insights, team retrospectives, and
						coding challenges.
					</p>
					<Button
						onClick={signInWithGitHub}
						size="lg"
						className="text-lg px-8 py-6"
					>
						<Github className="mr-2 h-5 w-5" />
						Get Started with GitHub
						<ArrowRight className="ml-2 h-5 w-5" />
					</Button>
				</div>

				{/* Features Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					{features.map((feature) => (
						<Card
							key={feature.title}
							className="border-2 hover:border-primary/20 transition-colors"
						>
							<CardHeader className="text-center">
								<div className="flex justify-center mb-4">
									<div className="p-3 rounded-full bg-muted">
										<feature.icon className={`h-8 w-8 ${feature.color}`} />
									</div>
								</div>
								<CardTitle className="text-lg">{feature.title}</CardTitle>
								<CardDescription>{feature.description}</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>

				{/* Benefits Section */}
				<Card className="max-w-4xl mx-auto">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Why SprintForge?</CardTitle>
						<CardDescription className="text-lg">
							Built by developers, for developers
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<div className="text-center">
								<h3 className="font-semibold mb-2">Save Time</h3>
								<p className="text-sm text-muted-foreground">
									Automate routine tasks like standups and PR reviews to focus
									on what matters most.
								</p>
							</div>
							<div className="text-center">
								<h3 className="font-semibold mb-2">Improve Quality</h3>
								<p className="text-sm text-muted-foreground">
									Get insights into code quality and team performance with
									intelligent scoring.
								</p>
							</div>
							<div className="text-center">
								<h3 className="font-semibold mb-2">Grow Skills</h3>
								<p className="text-sm text-muted-foreground">
									Challenge yourself with coding puzzles and track your progress
									over time.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
