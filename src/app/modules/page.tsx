"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Users,
	GitPullRequest,
	MessageSquare,
	Gamepad2,
	Github,
	Clock,
	BarChart3,
	CheckCircle,
	ArrowRight,
	Code2,
	GitBranch,
	MessageCircle,
	Trophy,
	Shield,
	Globe,
	Workflow,
	Sparkles,
} from "lucide-react";
import { linearAnimations, getStaggerDelay } from "@/components/page-transition";
import Link from "next/link";

export default function ModulesPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* Header */}
			<header className="border-b border-border/40 bg-background">
				<div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
					<Link href="/" className="flex items-center space-x-2">
						<Badge 
							variant="outline" 
							className="h-8 w-8 rounded-lg p-0 border-border/50 flex items-center justify-center"
						>
							<svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="4" fill="none"/>
								<ellipse cx="32" cy="32" rx="28" ry="12" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" transform="rotate(60 32 32)"/>
								<ellipse cx="32" cy="32" rx="28" ry="12" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.5" transform="rotate(-60 32 32)"/>
								<ellipse cx="32" cy="32" rx="16" ry="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" transform="rotate(120 32 32)"/>
								<circle cx="32" cy="32" r="5" fill="currentColor"/>
								<circle cx="54" cy="32" r="4" fill="currentColor"/>
								<circle cx="10" cy="32" r="3" fill="currentColor"/>
								<circle cx="48" cy="16" r="2.5" fill="currentColor" opacity="0.8"/>
								<circle cx="16" cy="48" r="2.5" fill="currentColor" opacity="0.8"/>
								<circle cx="48" cy="48" r="2" fill="currentColor" opacity="0.6"/>
								<circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6"/>
							</svg>
						</Badge>
						<span className="font-semibold text-lg">Orbit</span>
					</Link>

					<nav className="flex items-center space-x-8">
						<Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Features
						</Link>
						<Link href="/modules" className="text-sm font-medium text-foreground">
							Modules
						</Link>
						<Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Pricing
						</Link>
						<Link href="/login">
							<Button size="sm">
								<Github className="mr-2 h-4 w-4" />
								Sign In
							</Button>
						</Link>
					</nav>
				</div>
			</header>

			{/* Hero */}
			<section className="py-24 px-6">
				<div className="max-w-4xl mx-auto text-center space-y-12">
					<div className="space-y-6">
						<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
							<Workflow className="mr-2 h-4 w-4" />
							Four Powerful Modules
						</Badge>
						<h1 className="text-4xl md:text-6xl font-medium tracking-tight">
							Every workflow, <span className="text-muted-foreground">perfected</span>
						</h1>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							From standups to retrospectives, each module is meticulously designed to eliminate friction 
							and amplify your team's natural productivity patterns.
						</p>
					</div>
				</div>
			</section>

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
							<div className="grid grid-cols-2 gap-4">
								{[
									{ metric: "89%", label: "Time Saved", description: "3min vs 45min average" },
									{ metric: "2.1x", label: "Team Velocity", description: "Measured improvement" },
									{ metric: "94%", label: "Accuracy Rate", description: "vs manual updates" },
									{ metric: "100%", label: "Participation", description: "No more skipped standups" },
								].map((stat, index) => (
									<div key={stat.metric} className="space-y-1" {...getStaggerDelay(index, 100)}>
										<div className="text-2xl font-bold">{stat.metric}</div>
										<div className="text-sm font-medium">{stat.label}</div>
										<div className="text-xs text-muted-foreground">{stat.description}</div>
									</div>
								))}
							</div>
							<div className="pt-4">
								<Link href="/standups">
									<Button variant="outline">
										See AutoStand in Action
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
							</div>
						</div>
						<div className="bg-muted/30 rounded-lg p-8 space-y-4">
							<div className="text-sm font-medium text-muted-foreground">Generated Standup</div>
							<Card className="p-4 bg-background border-border/50">
								<div className="space-y-3">
									<div className="flex items-center space-x-2">
										<div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
											<CheckCircle className="h-4 w-4 text-green-600" />
										</div>
										<span className="text-sm font-medium">Yesterday's Progress</span>
									</div>
									<div className="text-sm text-muted-foreground pl-8">
										• Implemented user authentication flow (3 commits)
										<br />
										• Fixed critical bug in payment processing
										<br />
										• Reviewed and merged 2 PRs from the team
									</div>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* PR Radar Deep Dive */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div className="bg-muted/30 rounded-lg p-8 space-y-4">
							<div className="text-sm font-medium text-muted-foreground">Risk Analysis</div>
							<Card className="p-4 bg-background border-border/50">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Payment Service Refactor</span>
										<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
											Medium Risk
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground space-y-1">
										<div>• 347 lines changed across 12 files</div>
										<div>• No tests added for new payment methods</div>
										<div>• Suggested reviewers: @sarah, @mike (payment experts)</div>
									</div>
								</div>
							</Card>
						</div>
						<div className="space-y-8">
							<div className="flex items-center space-x-3">
								<Badge variant="outline" className="rounded-full">
									<GitPullRequest className="h-4 w-4 mr-1" />
									PR Radar
								</Badge>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
									AI-powered code review insights
								</h2>
								<p className="text-lg text-muted-foreground">
									Every pull request gets automatically analyzed for complexity, risk, and optimal reviewers. 
									Turn your biggest bottleneck into your smoothest process.
								</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								{[
									{ metric: "3.2x", label: "Faster Reviews", description: "Average cycle time" },
									{ metric: "67%", label: "Risk Reduction", description: "Bugs caught early" },
									{ metric: "91%", label: "Reviewer Match", description: "Right person, right PR" },
									{ metric: "45min", label: "Time Saved", description: "Per PR reviewed" },
								].map((stat, index) => (
									<div key={stat.metric} className="space-y-1" {...getStaggerDelay(index, 100)}>
										<div className="text-2xl font-bold">{stat.metric}</div>
										<div className="text-sm font-medium">{stat.label}</div>
										<div className="text-xs text-muted-foreground">{stat.description}</div>
									</div>
								))}
							</div>
							<div className="pt-4">
								<Link href="/pr-radar">
									<Button variant="outline">
										Explore PR Radar
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
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
									Retrospectives that drive real change
								</h2>
								<p className="text-lg text-muted-foreground">
									Gamified feedback collection with anonymous input, smart clustering, and actionable insights. 
									Finally, retros that teams actually want to participate in.
								</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								{[
									{ metric: "94%", label: "Engagement", description: "vs traditional retros" },
									{ metric: "2.8x", label: "Action Items", description: "Actually completed" },
									{ metric: "73%", label: "Issue Resolution", description: "Within next sprint" },
									{ metric: "15min", label: "Session Length", description: "Focused & efficient" },
								].map((stat, index) => (
									<div key={stat.metric} className="space-y-1" {...getStaggerDelay(index, 100)}>
										<div className="text-2xl font-bold">{stat.metric}</div>
										<div className="text-sm font-medium">{stat.label}</div>
										<div className="text-xs text-muted-foreground">{stat.description}</div>
									</div>
								))}
							</div>
							<div className="pt-4">
								<Link href="/retro">
									<Button variant="outline">
										Try Retro Arena
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
							</div>
						</div>
						<div className="bg-muted/30 rounded-lg p-8 space-y-4">
							<div className="text-sm font-medium text-muted-foreground">Live Retro Board</div>
							<div className="grid grid-cols-3 gap-3">
								{["😊 Went Well", "😐 Could Improve", "🚀 Action Items"].map((category, index) => (
									<div key={category} className="space-y-2">
										<div className="text-xs font-medium text-center p-2 bg-background rounded">
											{category}
										</div>
										<div className="space-y-1">
											{index === 0 && (
												<>
													<div className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
														Great collaboration this sprint!
													</div>
													<div className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
														CI/CD pipeline is much faster
													</div>
												</>
											)}
											{index === 1 && (
												<>
													<div className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
														Too many meetings interrupting flow
													</div>
													<div className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
														Need better documentation
													</div>
												</>
											)}
											{index === 2 && (
												<div className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
													Block focus time in calendars
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* Debug Arcade Deep Dive */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<div className="bg-muted/30 rounded-lg p-8 space-y-4">
							<div className="text-sm font-medium text-muted-foreground">Error Dashboard</div>
							<Card className="p-4 bg-background border-border/50">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">TypeError in checkout flow</span>
										<Badge className="bg-red-50 text-red-700 border-red-200">
											Critical
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground space-y-1">
										<div>• Affecting 23% of users in production</div>
										<div>• First seen 2 hours ago</div>
										<div>• Similar to issue fixed in PR #847</div>
									</div>
								</div>
							</Card>
						</div>
						<div className="space-y-8">
							<div className="flex items-center space-x-3">
								<Badge variant="outline" className="rounded-full">
									<Gamepad2 className="h-4 w-4 mr-1" />
									Debug Arcade
								</Badge>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
									Bug hunting, gamified
								</h2>
								<p className="text-lg text-muted-foreground">
									Centralized error tracking with intelligent clustering and team leaderboards. 
									Turn debugging from a chore into a competitive team sport.
								</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								{[
									{ metric: "76%", label: "Faster Resolution", description: "Mean time to fix" },
									{ metric: "84%", label: "Bug Prevention", description: "Caught before production" },
									{ metric: "3.1x", label: "Team Engagement", description: "In debugging activities" },
									{ metric: "12min", label: "Average Response", description: "To critical errors" },
								].map((stat, index) => (
									<div key={stat.metric} className="space-y-1" {...getStaggerDelay(index, 100)}>
										<div className="text-2xl font-bold">{stat.metric}</div>
										<div className="text-sm font-medium">{stat.label}</div>
										<div className="text-xs text-muted-foreground">{stat.description}</div>
									</div>
								))}
							</div>
							<div className="pt-4">
								<Link href="/arcade">
									<Button variant="outline">
										Enter Debug Arcade
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-24 px-6 bg-muted/30">
				<div className="max-w-2xl mx-auto text-center space-y-8">
					<div className="space-y-4">
						<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
							Ready to supercharge every workflow?
						</h2>
						<p className="text-lg text-muted-foreground">
							All four modules work together seamlessly to create the ultimate development experience.
						</p>
					</div>

					<div className="flex flex-col items-center space-y-4">
						<Link href="/login">
							<Button size="lg" className="h-12 px-8 text-base font-medium">
								<Github className="mr-2 h-5 w-5" />
								Start Your Free Trial
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						
						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							<span>All modules included</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>2 minute setup</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}