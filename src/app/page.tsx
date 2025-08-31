"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
	Github,
	Zap,
	Clock,
	Target,
	BarChart3,
	Rocket,
	CheckCircle,
	ArrowRight,
	Code2,
	GitBranch,
	MessageCircle,
	Trophy,
	Sparkles,
	Shield,
	Globe,
	Workflow,
} from "lucide-react";
import { linearAnimations, getStaggerDelay } from "@/components/page-transition";

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
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="flex flex-col items-center space-y-4">
					<Skeleton className="h-8 w-8 rounded-full" />
					<Skeleton className="h-4 w-20" />
				</div>
			</div>
		);
	}

	if (user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
				<div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
					{/* Logo */}
					<div className="flex items-center space-x-2">
						<Badge 
							variant="outline" 
							className="h-8 w-8 rounded-lg p-0 border-border/50"
						>
							<div className="text-sm font-bold">O</div>
						</Badge>
						<span className="font-semibold text-lg">Orbit</span>
					</div>

					{/* Navigation */}
					<nav className="hidden md:flex items-center space-x-8">
						<a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Features
						</a>
						<a href="#modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Modules
						</a>
						<a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Pricing
						</a>
						<Button onClick={signInWithGitHub} size="sm" className="ml-4">
							<Github className="mr-2 h-4 w-4" />
							Sign In
						</Button>
					</nav>

					{/* Mobile Menu */}
					<div className="md:hidden">
						<Button onClick={signInWithGitHub} size="sm">
							<Github className="mr-2 h-4 w-4" />
							Sign In
						</Button>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="flex flex-col items-center justify-center min-h-screen px-6 pt-16">
				<div className="text-center max-w-4xl mx-auto space-y-8">
					{/* Logo Badge */}
					<div className="flex justify-center mb-8">
						<Badge 
							variant="outline" 
							className="h-12 w-12 rounded-xl p-0 border-border/50 hover:border-border transition-colors"
						>
							<div className="text-xl font-bold">O</div>
						</Badge>
					</div>

					{/* Hero Text */}
					<div className="space-y-6">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight">
							<span className="block text-muted-foreground">Developer</span>
							<span className="block">productivity</span>
							<span className="block text-muted-foreground text-3xl md:text-4xl lg:text-5xl">
								reimagined
							</span>
						</h1>
						
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							Automate standups, analyze PRs, and run retrospectives with surgical precision.
						</p>
					</div>

					{/* CTA */}
					<div className="flex flex-col items-center space-y-4">
						<Button 
							onClick={signInWithGitHub}
							size="lg"
							className="h-12 px-8 text-base font-medium"
						>
							<Github className="mr-2 h-5 w-5" />
							Continue with GitHub
						</Button>
						
						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							<span>Free forever</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>No credit card required</span>
						</div>
					</div>

					{/* Quick Features Overview */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-16">
						{[
							{ icon: Users, label: "AutoStand" },
							{ icon: GitPullRequest, label: "PR Radar" },
							{ icon: MessageSquare, label: "Retro Arena" },
							{ icon: Gamepad2, label: "Debug Arcade" },
						].map((feature, index) => (
							<div 
								key={feature.label}
								className="group p-4 rounded-lg border border-border/50 hover:border-border transition-all duration-200 cursor-default"
								{...getStaggerDelay(index, 100)}
							>
								<div className="text-center">
									<feature.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground group-hover:text-foreground transition-colors" />
									<div className="text-sm font-medium">{feature.label}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Problem Section */}
			<section id="features" className="py-24 px-6">
				<div className="max-w-4xl mx-auto text-center space-y-12">
					<div className="space-y-4">
						<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
							The daily grind is <span className="text-muted-foreground">killing productivity</span>
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Developers spend hours on repetitive tasks instead of building. Standups drag on, PR reviews pile up, 
							and retrospectives feel like afterthoughts.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 mt-16">
						{[
							{
								icon: Clock,
								title: "Time waste",
								description: "30 minutes daily on standups that could be automated"
							},
							{
								icon: Target,
								title: "Context switching",
								description: "Constant interruptions break flow state and focus"
							},
							{
								icon: BarChart3,
								title: "No insights",
								description: "Teams lack visibility into productivity and bottlenecks"
							}
						].map((problem, index) => (
							<Card key={problem.title} className="border-border/50" {...getStaggerDelay(index, 150)}>
								<CardContent className="p-6 text-center">
									<problem.icon className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
									<h3 className="text-lg font-medium mb-2">{problem.title}</h3>
									<p className="text-sm text-muted-foreground">{problem.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* AutoStand Deep Dive */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div className="space-y-8">
							<div className="flex items-center space-x-3">
								<Badge variant="outline" className="rounded-full">
									<Users className="h-4 w-4 mr-1" />
									AutoStand
								</Badge>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
									Standups that write themselves
								</h2>
								<p className="text-lg text-muted-foreground">
									Connect your GitHub repository and watch as your daily standups generate automatically 
									from your actual work. No more awkward silences or "I worked on stuff" updates.
								</p>
							</div>
							<div className="space-y-4">
								{[
									"Analyzes commits, PRs, and issues from last 24 hours",
									"Generates structured yesterday/today/blockers format",
									"Posts directly to Slack channels",
									"Historical tracking and team insights"
								].map((feature, index) => (
									<div key={feature} className="flex items-start space-x-3" {...getStaggerDelay(index, 100)}>
										<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">{feature}</span>
									</div>
								))}
							</div>
						</div>
						
						{/* Mock Interface */}
						<Card className="border-border/50">
							<CardContent className="p-6">
								<div className="space-y-4">
									<div className="flex items-center space-x-3">
										<div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
											<Code2 className="h-4 w-4" />
										</div>
										<div className="flex-1">
											<div className="text-sm font-medium">Daily Standup - March 15</div>
											<div className="text-xs text-muted-foreground">Auto-generated from GitHub</div>
										</div>
									</div>
									<Separator />
									<div className="space-y-3 text-sm">
										<div>
											<span className="font-medium text-green-600">Yesterday:</span>
											<div className="mt-1 space-y-1">
												<div className="text-muted-foreground">• Merged PR #127: Add user authentication</div>
												<div className="text-muted-foreground">• Fixed 3 bugs in payment flow</div>
											</div>
										</div>
										<div>
											<span className="font-medium text-blue-600">Today:</span>
											<div className="mt-1 space-y-1">
												<div className="text-muted-foreground">• Implement dashboard analytics</div>
												<div className="text-muted-foreground">• Review PRs from team members</div>
											</div>
										</div>
										<div>
											<span className="font-medium text-orange-600">Blockers:</span>
											<div className="mt-1">
												<div className="text-muted-foreground">• None</div>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* PR Radar Deep Dive */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						{/* Mock Interface */}
						<Card className="border-border/50 order-2 lg:order-1">
							<CardContent className="p-6">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">Pull Request Insights</h4>
										<Badge variant="outline" className="text-xs">Live</Badge>
									</div>
									<Separator />
									<div className="space-y-3">
										{[
											{ title: "Fix authentication bug", risk: "Low", size: "Small", author: "alex" },
											{ title: "Add payment integration", risk: "High", size: "Large", author: "sarah" },
											{ title: "Update documentation", risk: "Low", size: "Small", author: "mike" }
										].map((pr, index) => (
											<div key={pr.title} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
												<div className="space-y-1">
													<div className="text-sm font-medium">{pr.title}</div>
													<div className="text-xs text-muted-foreground">by {pr.author}</div>
												</div>
												<div className="flex items-center space-x-2">
													<Badge variant={pr.risk === "High" ? "destructive" : "outline"} className="text-xs">
														{pr.risk}
													</Badge>
													<Badge variant="outline" className="text-xs">{pr.size}</Badge>
												</div>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="space-y-8 order-1 lg:order-2">
							<div className="flex items-center space-x-3">
								<Badge variant="outline" className="rounded-full">
									<GitPullRequest className="h-4 w-4 mr-1" />
									PR Radar
								</Badge>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
									Smart PR analysis and insights
								</h2>
								<p className="text-lg text-muted-foreground">
									Get instant visibility into pull request health, risk scores, and suggested reviewers. 
									Never let important PRs slip through the cracks again.
								</p>
							</div>
							<div className="space-y-4">
								{[
									"Real-time risk scoring based on size and complexity",
									"Smart reviewer suggestions using code ownership",
									"Stale PR detection with automated alerts",
									"Team productivity metrics and insights"
								].map((feature, index) => (
									<div key={feature} className="flex items-start space-x-3" {...getStaggerDelay(index, 100)}>
										<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">{feature}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* Retro Arena Deep Dive */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div className="space-y-8">
							<div className="flex items-center space-x-3">
								<Badge variant="outline" className="rounded-full">
									<MessageSquare className="h-4 w-4 mr-1" />
									Retro Arena
								</Badge>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
									Collaborative retrospectives that drive change
								</h2>
								<p className="text-lg text-muted-foreground">
									Real-time sticky note boards with voting, anonymous feedback, and action item tracking. 
									Turn team insights into actual improvements.
								</p>
							</div>
							<div className="space-y-4">
								{[
									"Real-time collaborative boards with drag-and-drop",
									"Anonymous posting for honest feedback",
									"Dot voting system with live results",
									"Action item tracking and follow-up"
								].map((feature, index) => (
									<div key={feature} className="flex items-start space-x-3" {...getStaggerDelay(index, 100)}>
										<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">{feature}</span>
									</div>
								))}
							</div>
						</div>
						
						{/* Mock Interface */}
						<Card className="border-border/50">
							<CardContent className="p-6">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">Sprint 12 Retrospective</h4>
										<Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
									</div>
									<Separator />
									<div className="grid grid-cols-2 gap-3">
										{[
											{ title: "Went Well", color: "bg-green-500/10 border-green-500/20", items: 3 },
											{ title: "Went Poorly", color: "bg-red-500/10 border-red-500/20", items: 2 },
											{ title: "Ideas", color: "bg-blue-500/10 border-blue-500/20", items: 4 },
											{ title: "Action Items", color: "bg-purple-500/10 border-purple-500/20", items: 2 }
										].map((column) => (
											<div key={column.title} className={`p-3 rounded-lg border ${column.color}`}>
												<div className="text-xs font-medium mb-2">{column.title}</div>
												<div className="text-xs text-muted-foreground">{column.items} notes</div>
											</div>
										))}
									</div>
									<div className="text-center">
										<div className="text-xs text-muted-foreground">4 team members active</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* Debug Arcade Deep Dive */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						{/* Mock Interface */}
						<Card className="border-border/50 order-2 lg:order-1">
							<CardContent className="p-6">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">Coding Challenges</h4>
										<Badge variant="outline" className="text-xs">Leaderboard</Badge>
									</div>
									<Separator />
									<div className="space-y-3">
										{[
											{ name: "Alex Chen", points: 2850, badge: "🏆" },
											{ name: "Sarah Kim", points: 2640, badge: "🥈" },
											{ name: "Mike Rodriguez", points: 2480, badge: "🥉" },
											{ name: "You", points: 1920, badge: "" }
										].map((player, index) => (
											<div key={player.name} className={`flex items-center justify-between p-2 rounded ${player.name === "You" ? "bg-muted/50" : ""}`}>
												<div className="flex items-center space-x-3">
													<span className="text-lg">{player.badge}</span>
													<span className="text-sm font-medium">{player.name}</span>
												</div>
												<span className="text-sm text-muted-foreground">{player.points} pts</span>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="space-y-8 order-1 lg:order-2">
							<div className="flex items-center space-x-3">
								<Badge variant="outline" className="rounded-full">
									<Gamepad2 className="h-4 w-4 mr-1" />
									Debug Arcade
								</Badge>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
									Gamified skill development
								</h2>
								<p className="text-lg text-muted-foreground">
									Sharpen your coding skills with progressive challenges, leaderboards, and team competitions. 
									Make learning addictive, not boring.
								</p>
							</div>
							<div className="space-y-4">
								{[
									"Progressive difficulty with multiple programming languages",
									"Sandboxed code execution with instant feedback",
									"Team leaderboards and friendly competition",
									"Skill tracking and performance analytics"
								].map((feature, index) => (
									<div key={feature} className="flex items-start space-x-3" {...getStaggerDelay(index, 100)}>
										<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">{feature}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* Why Choose Orbit */}
			<section className="py-24 px-6">
				<div className="max-w-4xl mx-auto text-center space-y-16">
					<div className="space-y-4">
						<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
							Built for teams who <span className="text-muted-foreground">ship fast</span>
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Every feature is designed to reduce friction, increase visibility, and help your team 
							focus on what matters most—building great software.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								icon: Rocket,
								title: "Lightning fast",
								description: "Built on modern infrastructure with sub-second response times"
							},
							{
								icon: Shield,
								title: "Secure by design",
								description: "Enterprise-grade security with SOC2 compliance and encryption"
							},
							{
								icon: Workflow,
								title: "GitHub native",
								description: "Deep integration with your existing GitHub workflow and permissions"
							},
							{
								icon: Globe,
								title: "Team-first",
								description: "Multi-tenant architecture with organization-level access control"
							},
							{
								icon: Sparkles,
								title: "Beautiful UI",
								description: "Thoughtfully designed interface that developers actually enjoy using"
							},
							{
								icon: Zap,
								title: "Always improving",
								description: "Weekly updates with new features and performance improvements"
							}
						].map((benefit, index) => (
							<div key={benefit.title} className="space-y-4 text-center" {...getStaggerDelay(index, 100)}>
								<div className="flex justify-center">
									<div className="p-3 rounded-lg bg-muted/50">
										<benefit.icon className="h-6 w-6" />
									</div>
								</div>
								<div className="space-y-2">
									<h3 className="text-lg font-medium">{benefit.title}</h3>
									<p className="text-sm text-muted-foreground">{benefit.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-24 px-6">
				<div className="max-w-2xl mx-auto text-center space-y-8">
					<div className="space-y-4">
						<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
							Ready to transform your workflow?
						</h2>
						<p className="text-lg text-muted-foreground">
							Join thousands of developers who've already automated their daily grind.
						</p>
					</div>

					<div className="flex flex-col items-center space-y-4">
						<Button 
							onClick={signInWithGitHub}
							size="lg"
							className="h-12 px-8 text-base font-medium"
						>
							<Github className="mr-2 h-5 w-5" />
							Get Started Now
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						
						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							<span>2 minute setup</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>Free forever</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>Cancel anytime</span>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/50 py-12 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
						<div className="flex items-center space-x-3">
							<Badge variant="outline" className="h-8 w-8 rounded-lg p-0">
								<div className="text-sm font-bold">O</div>
							</Badge>
							<span className="text-sm text-muted-foreground">© 2024 Orbit. All rights reserved.</span>
						</div>
						
						<div className="flex items-center space-x-6 text-sm text-muted-foreground">
							<span className="cursor-pointer hover:text-foreground transition-colors">Privacy</span>
							<span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
							<span className="cursor-pointer hover:text-foreground transition-colors">Docs</span>
							<span className="cursor-pointer hover:text-foreground transition-colors">Support</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}