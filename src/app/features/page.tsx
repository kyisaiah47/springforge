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
	Zap,
	Clock,
	Target,
	BarChart3,
	CheckCircle,
	ArrowRight,
	Trophy,
	Shield,
	Globe,
	Sparkles,
} from "lucide-react";
import { linearAnimations, getStaggerDelay } from "@/components/page-transition";
import Link from "next/link";

export default function FeaturesPage() {
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
						<Link href="/features" className="text-sm font-medium text-foreground">
							Features
						</Link>
						<Link href="/modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
							<Sparkles className="mr-2 h-4 w-4" />
							Revolutionary Features
						</Badge>
						<h1 className="text-4xl md:text-6xl font-medium tracking-tight">
							The daily grind is <span className="text-muted-foreground">killing productivity</span>
						</h1>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							Developers spend hours on repetitive tasks instead of building. Standups drag on, PR reviews pile up, 
							and retrospectives feel like afterthoughts. Orbit eliminates every friction point.
						</p>
					</div>
				</div>
			</section>

			{/* Pain Points */}
			<section className="py-16 px-6 bg-muted/30">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								icon: Clock,
								title: "Time Vampires",
								problem: "45-minute standups where nothing gets accomplished",
								solution: "3-minute auto-generated updates from your actual work",
								impact: "89% time reduction"
							},
							{
								icon: GitPullRequest,
								title: "Review Bottlenecks", 
								problem: "PRs sitting for days while reviewers guess at complexity",
								solution: "AI-powered risk analysis and smart reviewer suggestions",
								impact: "3.2x faster reviews"
							},
							{
								icon: MessageSquare,
								title: "Useless Retros",
								problem: "Boring meetings that repeat the same issues every sprint",
								solution: "Gamified feedback with actionable insights and trends",
								impact: "94% engagement"
							}
						].map((item, index) => (
							<Card key={item.title} className="p-6 border-border/50" {...getStaggerDelay(index, 200)}>
								<CardContent className="p-0 space-y-6">
									<div className="flex items-center space-x-3">
										<item.icon className="h-6 w-6 text-red-500" />
										<h3 className="text-lg font-semibold">{item.title}</h3>
									</div>
									<div className="space-y-4">
										<div>
											<div className="text-sm font-medium text-red-600 mb-1">The Problem</div>
											<p className="text-sm text-muted-foreground">{item.problem}</p>
										</div>
										<div>
											<div className="text-sm font-medium text-green-600 mb-1">Orbit Solution</div>
											<p className="text-sm text-muted-foreground">{item.solution}</p>
										</div>
										<div className="pt-2 border-t border-border/30">
											<Badge variant="outline" className="text-xs">
												{item.impact}
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Social Proof */}
			<section className="py-24 px-6">
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
						</div>

						{/* Testimonials */}
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
					</div>
				</div>
			</section>

			{/* Competitive Advantage */}
			<section className="py-24 px-6 bg-muted/30">
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

			{/* CTA */}
			<section className="py-24 px-6">
				<div className="max-w-2xl mx-auto text-center space-y-8">
					<div className="space-y-4">
						<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
							Ready to eliminate the grind?
						</h2>
						<p className="text-lg text-muted-foreground">
							Join thousands of developers who've already automated their daily workflow.
						</p>
					</div>

					<div className="flex flex-col items-center space-y-4">
						<Link href="/login">
							<Button size="lg" className="h-12 px-8 text-base font-medium">
								<Github className="mr-2 h-5 w-5" />
								Get Started Now
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						
						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							<span>2 minute setup</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>Free forever</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}