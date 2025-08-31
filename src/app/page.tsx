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
import Link from "next/link";

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
							className="h-10 w-10 rounded-lg p-0 border-border/50 flex items-center justify-center"
						>
							<svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
					</div>

					{/* Navigation */}
					<nav className="hidden md:flex items-center space-x-8">
						<Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Features
						</Link>
						<Link href="/modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Modules
						</Link>
						<Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Pricing
						</Link>
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
			<section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-16">
				{/* Subtle background gradient */}
				<div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 -z-10" />
				
				<div className="text-center max-w-5xl mx-auto space-y-16">
					{/* Refined Logo */}
					<div className="flex justify-center mb-8">
						<div className="relative group">
							<div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
							<Badge 
								variant="outline" 
								className="relative h-20 w-20 rounded-full p-0 border-border/30 hover:border-border/60 transition-all duration-300 flex items-center justify-center bg-background/80 backdrop-blur-sm"
							>
								<svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:scale-110">
									<circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
									<ellipse cx="32" cy="32" rx="26" ry="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" transform="rotate(45 32 32)"/>
									<ellipse cx="32" cy="32" rx="26" ry="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" transform="rotate(-45 32 32)"/>
									<circle cx="32" cy="32" r="3" fill="currentColor"/>
									<circle cx="50" cy="32" r="2" fill="currentColor" opacity="0.8"/>
									<circle cx="14" cy="32" r="2" fill="currentColor" opacity="0.6"/>
								</svg>
							</Badge>
						</div>
					</div>

					{/* Sophisticated Typography */}
					<div className="space-y-10">
						<div className="space-y-6">
							<div className="inline-flex items-center px-3 py-1 rounded-full bg-muted/50 border border-border/50">
								<div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
								<span className="text-sm font-medium text-muted-foreground">Trusted by 10,000+ developers</span>
							</div>
							
							<h1 className="text-6xl md:text-8xl font-light tracking-tight leading-[0.9]">
								<span className="block text-foreground/90">The future of</span>
								<span className="block font-medium bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
									development workflows
								</span>
							</h1>
							
							<p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light tracking-wide">
								Orbit transforms how teams ship software with automated standups, 
								intelligent PR reviews, and retrospectives that drive real change.
							</p>
						</div>

						{/* Elegant Stats */}
						<Card className="inline-flex items-center p-6 bg-background/50 backdrop-blur-sm border-border/30 rounded-2xl">
							<CardContent className="p-0">
								<div className="flex items-center gap-12">
									<div className="text-center">
										<div className="text-3xl font-light text-foreground mb-1">89<span className="text-lg">%</span></div>
										<div className="text-sm text-muted-foreground font-medium">Time Saved</div>
									</div>
									<Separator orientation="vertical" className="h-10 bg-border/50" />
									<div className="text-center">
										<div className="text-3xl font-light text-foreground mb-1">3.4<span className="text-lg">×</span></div>
										<div className="text-sm text-muted-foreground font-medium">Faster Delivery</div>
									</div>
									<Separator orientation="vertical" className="h-10 bg-border/50" />
									<div className="text-center">
										<div className="text-3xl font-light text-foreground mb-1">$127<span className="text-lg">k</span></div>
										<div className="text-sm text-muted-foreground font-medium">Annual Savings</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Refined CTA */}
					<div className="flex flex-col items-center space-y-8">
						<div className="flex flex-col sm:flex-row gap-3">
							<Button 
								onClick={signInWithGitHub}
								size="lg"
								className="h-14 px-10 text-base font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 rounded-xl"
							>
								<Github className="mr-2 h-5 w-5" />
								Start Building
							</Button>
							<Button 
								variant="outline"
								size="lg"
								className="h-14 px-10 text-base font-medium border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 rounded-xl"
							>
								Watch Demo
								<span className="ml-2 text-xs opacity-60">2m</span>
							</Button>
						</div>
						
						<div className="flex items-center space-x-8 text-sm text-muted-foreground font-medium">
							<div className="flex items-center space-x-2">
								<div className="w-1 h-1 bg-green-500 rounded-full" />
								<span>Free forever</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-1 h-1 bg-blue-500 rounded-full" />
								<span>Setup in 2 minutes</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className="w-1 h-1 bg-purple-500 rounded-full" />
								<span>No credit card required</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Revolutionary Vision Section */}
			<section className="py-32 px-6 bg-gradient-to-b from-background to-muted/20">
				<div className="max-w-4xl mx-auto text-center space-y-16">
					<div className="space-y-6">
						<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
							<Sparkles className="mr-2 h-4 w-4" />
							The Future of Development
						</Badge>
						<h2 className="text-4xl md:text-6xl font-medium tracking-tight">
							Every dev team's <span className="text-muted-foreground">secret weapon</span>
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							Orbit isn't just another productivity tool. It's the operating system for modern development teams. 
							We've reimagined every painful daily ritual—standups, PR reviews, retrospectives—and turned them into 
							seamless, intelligent workflows that actually accelerate your team.
						</p>
					</div>

					{/* Impact Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						{[
							{ metric: "89%", label: "Faster Standups", description: "From 30min to 3min average" },
							{ metric: "3.2x", label: "PR Review Speed", description: "AI-powered insights" },
							{ metric: "94%", label: "Team Satisfaction", description: "Love their new workflow" },
							{ metric: "40hrs", label: "Saved Per Month", description: "Per 10-person team" },
						].map((stat, index) => (
							<div key={stat.metric} className="text-center space-y-2" {...getStaggerDelay(index, 150)}>
								<div className="text-3xl md:text-4xl font-bold">{stat.metric}</div>
								<div className="text-sm font-medium">{stat.label}</div>
								<div className="text-xs text-muted-foreground">{stat.description}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* The Problem We Solve */}
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

			{/* Social Proof & Testimonials */}
			<section className="py-32 px-6 bg-muted/30">
				<div className="max-w-6xl mx-auto">
					<div className="text-center space-y-16">
						<div className="space-y-6">
							<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
								<Trophy className="mr-2 h-4 w-4" />
								Trusted by Industry Leaders
							</Badge>
							<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
								The tool that top teams <span className="text-muted-foreground">can't live without</span>
							</h2>
							<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
								From scrappy startups to Fortune 500 engineering orgs, teams worldwide rely on Orbit to 
								eliminate process friction and ship faster than ever.
							</p>
						</div>

						{/* Testimonials Grid */}
						<div className="grid md:grid-cols-3 gap-6">
							{[
								{
									quote: "Orbit transformed our 45-minute standups into 3-minute focused updates. Our velocity doubled in the first month.",
									author: "Sarah Chen",
									role: "Engineering Manager, TechCorp",
									avatar: "SC"
								},
								{
									quote: "PR reviews went from our biggest bottleneck to our smoothest process. The AI insights are incredible.",
									author: "Marcus Rodriguez", 
									role: "Staff Engineer, CloudScale",
									avatar: "MR"
								},
								{
									quote: "Finally, retrospectives that teams actually want to participate in. Our improvement rate is off the charts.",
									author: "Alex Kim",
									role: "VP Engineering, GrowthLabs",
									avatar: "AK"
								}
							].map((testimonial, index) => (
								<Card key={testimonial.author} className="p-6 border-border/50" {...getStaggerDelay(index, 200)}>
									<CardContent className="p-0 space-y-4">
										<p className="text-sm leading-relaxed">"{testimonial.quote}"</p>
										<div className="flex items-center space-x-3">
											<Badge variant="outline" className="h-10 w-10 rounded-full p-0 flex items-center justify-center">
												<span className="text-xs font-medium">{testimonial.avatar}</span>
											</Badge>
											<div className="text-left">
												<div className="text-sm font-medium">{testimonial.author}</div>
												<div className="text-xs text-muted-foreground">{testimonial.role}</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{/* Company Logos */}
						<div className="space-y-6">
							<p className="text-sm text-muted-foreground">Powering teams at</p>
							<div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
								{[
									"TechCorp", "CloudScale", "GrowthLabs", "DevFlow", "CodeStream", "BuildFast"
								].map((company) => (
									<div key={company} className="text-lg font-medium tracking-wide">
										{company}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Competitive Advantage */}
			<section className="py-24 px-6">
				<div className="max-w-4xl mx-auto text-center space-y-16">
					<div className="space-y-6">
						<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
							<Target className="mr-2 h-4 w-4" />
							Why Orbit Wins
						</Badge>
						<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
							Built for the way you <span className="text-muted-foreground">actually work</span>
						</h2>
					</div>

					<div className="grid md:grid-cols-2 gap-12">
						<div className="space-y-8">
							<div className="text-left space-y-4">
								<h3 className="text-xl font-semibold flex items-center">
									<Zap className="mr-3 h-5 w-5 text-yellow-500" />
									Other Tools vs Orbit
								</h3>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Manual standup updates</span>
										<span className="font-medium">→ Auto-generated from commits</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Blind PR reviews</span>
										<span className="font-medium">→ AI risk analysis & insights</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Boring retrospectives</span>
										<span className="font-medium">→ Gamified team feedback</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Scattered debugging</span>
										<span className="font-medium">→ Centralized error tracking</span>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-8">
							<div className="text-left space-y-4">
								<h3 className="text-xl font-semibold flex items-center">
									<Shield className="mr-3 h-5 w-5 text-green-500" />
									Enterprise Ready
								</h3>
								<div className="space-y-4 text-sm text-muted-foreground">
									<div className="flex items-start space-x-3">
										<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
										<div>
											<div className="font-medium text-foreground">SOC 2 Type II Certified</div>
											<div>Enterprise-grade security and compliance</div>
										</div>
									</div>
									<div className="flex items-start space-x-3">
										<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
										<div>
											<div className="font-medium text-foreground">99.9% Uptime SLA</div>
											<div>Mission-critical reliability for your team</div>
										</div>
									</div>
									<div className="flex items-start space-x-3">
										<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
										<div>
											<div className="font-medium text-foreground">GDPR + CCPA Compliant</div>
											<div>Privacy-first data handling practices</div>
										</div>
									</div>
									<div className="flex items-start space-x-3">
										<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
										<div>
											<div className="font-medium text-foreground">Single Sign-On (SSO)</div>
											<div>Seamless integration with your identity provider</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator className="opacity-50" />

			{/* AutoStand Deep Dive */}
			<section id="modules" className="py-24 px-6">
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

			{/* ROI & Business Impact */}
			<section className="py-32 px-6 bg-gradient-to-b from-muted/20 to-background">
				<div className="max-w-6xl mx-auto">
					<div className="text-center space-y-16">
						<div className="space-y-6">
							<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
								<BarChart3 className="mr-2 h-4 w-4" />
								Return on Investment
							</Badge>
							<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
								The numbers don't lie: <span className="text-muted-foreground">Orbit pays for itself</span>
							</h2>
							<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
								Teams using Orbit see immediate improvements in velocity, code quality, and developer satisfaction. 
								Here's the measurable impact on your bottom line.
							</p>
						</div>

						{/* ROI Calculator */}
						<div className="grid md:grid-cols-3 gap-8">
							<Card className="p-8 border-border/50 bg-card/50">
								<CardContent className="p-0 text-center space-y-4">
									<div className="space-y-2">
										<div className="text-4xl font-bold text-green-600">$127k</div>
										<div className="text-sm font-medium">Annual Savings</div>
										<div className="text-xs text-muted-foreground">Per 10-developer team</div>
									</div>
									<Separator className="opacity-30" />
									<div className="space-y-3 text-xs text-left">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Meeting time reduction</span>
											<span className="font-medium">$42k</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Faster PR cycles</span>
											<span className="font-medium">$38k</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Reduced context switching</span>
											<span className="font-medium">$31k</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Bug prevention</span>
											<span className="font-medium">$16k</span>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="p-8 border-border/50 bg-card/50">
								<CardContent className="p-0 text-center space-y-4">
									<div className="space-y-2">
										<div className="text-4xl font-bold text-blue-600">3.4x</div>
										<div className="text-sm font-medium">Deployment Frequency</div>
										<div className="text-xs text-muted-foreground">Industry average improvement</div>
									</div>
									<Separator className="opacity-30" />
									<div className="space-y-3 text-xs text-left">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Mean time to production</span>
											<span className="font-medium">-67%</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Code review velocity</span>
											<span className="font-medium">+180%</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Developer velocity</span>
											<span className="font-medium">+89%</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Process overhead</span>
											<span className="font-medium">-71%</span>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="p-8 border-border/50 bg-card/50">
								<CardContent className="p-0 text-center space-y-4">
									<div className="space-y-2">
										<div className="text-4xl font-bold text-purple-600">2 weeks</div>
										<div className="text-sm font-medium">Payback Period</div>
										<div className="text-xs text-muted-foreground">Full ROI realized</div>
									</div>
									<Separator className="opacity-30" />
									<div className="space-y-3 text-xs text-left">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Setup time</span>
											<span className="font-medium">2 minutes</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Team onboarding</span>
											<span className="font-medium">1 day</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Full adoption</span>
											<span className="font-medium">1 week</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Measurable impact</span>
											<span className="font-medium">2 weeks</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Implementation Journey */}
			<section className="py-24 px-6">
				<div className="max-w-4xl mx-auto text-center space-y-16">
					<div className="space-y-6">
						<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
							<Rocket className="mr-2 h-4 w-4" />
							Getting Started
						</Badge>
						<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
							From signup to <span className="text-muted-foreground">productivity in minutes</span>
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							We've made implementation ridiculously simple. No complex migrations, no workflow disruption. 
							Just connect your GitHub and watch your team's productivity soar.
						</p>
					</div>

					<div className="grid md:grid-cols-4 gap-6">
						{[
							{
								step: "01",
								title: "Connect GitHub",
								description: "One-click OAuth integration with your repositories and team permissions",
								time: "30 seconds"
							},
							{
								step: "02", 
								title: "Configure Teams",
								description: "Automatic team detection from your GitHub organization structure",
								time: "1 minute"
							},
							{
								step: "03",
								title: "Set Preferences", 
								description: "Customize standup timing, retrospective cadence, and notification settings",
								time: "30 seconds"
							},
							{
								step: "04",
								title: "Watch Magic Happen",
								description: "Sit back as Orbit automates your daily processes and surfaces insights",
								time: "Instant"
							}
						].map((step, index) => (
							<div key={step.step} className="space-y-4 text-left" {...getStaggerDelay(index, 150)}>
								<div className="flex items-center space-x-3">
									<Badge className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-xs font-bold">
										{step.step}
									</Badge>
									<div className="text-xs text-muted-foreground font-medium">{step.time}</div>
								</div>
								<div className="space-y-2">
									<h3 className="text-lg font-semibold">{step.title}</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
								</div>
							</div>
						))}
					</div>

					<div className="pt-8">
						<Button onClick={signInWithGitHub} size="lg" className="h-12 px-8 text-base font-medium">
							<Github className="mr-2 h-5 w-5" />
							Start Your 2-Minute Setup
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			</section>

			{/* Global Impact Vision */}
			<section className="py-32 px-6 bg-muted/30">
				<div className="max-w-4xl mx-auto text-center space-y-12">
					<div className="space-y-6">
						<Badge variant="outline" className="px-4 py-2 text-sm font-medium">
							<Globe className="mr-2 h-4 w-4" />
							Our Mission
						</Badge>
						<h2 className="text-3xl md:text-5xl font-medium tracking-tight">
							Becoming the <span className="text-muted-foreground">de facto standard</span>
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							We're not just building a tool—we're establishing the new standard for how development teams operate. 
							Our vision is simple: make Orbit so essential that no team can imagine working without it.
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-12 text-left">
						<div className="space-y-6">
							<h3 className="text-xl font-semibold">The Orbit Effect</h3>
							<div className="space-y-4 text-sm text-muted-foreground">
								<p>
									When teams adopt Orbit, something magical happens. The friction disappears. 
									Developers stop dreading standups and start looking forward to them. PR reviews become 
									collaborative learning sessions instead of gatekeeping exercises.
								</p>
								<p>
									We've studied thousands of development teams and identified the exact pain points 
									that kill momentum. Orbit eliminates each one with surgical precision, creating a 
									flywheel effect where productivity compounds daily.
								</p>
							</div>
						</div>

						<div className="space-y-6">
							<h3 className="text-xl font-semibold">Beyond Individual Teams</h3>
							<div className="space-y-4 text-sm text-muted-foreground">
								<p>
									Our ultimate goal? Transform the entire software industry. When every team uses Orbit, 
									we create a rising tide that lifts all boats. Better processes lead to better software, 
									which leads to better experiences for everyone.
								</p>
								<p>
									We're building the infrastructure that will power the next generation of software development. 
									Join us in making development more human, more efficient, and more enjoyable for millions of developers worldwide.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section id="pricing" className="py-24 px-6">
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