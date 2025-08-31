"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Github,
	Check,
	ArrowRight,
	BarChart3,
	Rocket,
	Crown,
	Building,
	Sparkles,
} from "lucide-react";
import { linearAnimations, getStaggerDelay } from "@/components/page-transition";
import Link from "next/link";

export default function PricingPage() {
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
						<Link href="/modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
							Modules
						</Link>
						<Link href="/pricing" className="text-sm font-medium text-foreground">
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
							<BarChart3 className="mr-2 h-4 w-4" />
							Transparent Pricing
						</Badge>
						<h1 className="text-4xl md:text-6xl font-medium tracking-tight">
							Priced for every <span className="text-muted-foreground">development team</span>
						</h1>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							Start free, scale when ready. Our pricing grows with your team, 
							ensuring you only pay for what you use—and see massive ROI from day one.
						</p>
					</div>
				</div>
			</section>

			{/* ROI Preview */}
			<section className="py-16 px-6 bg-muted/30">
				<div className="max-w-4xl mx-auto text-center space-y-8">
					<h2 className="text-2xl font-semibold">The numbers don't lie: Orbit pays for itself</h2>
					<div className="grid md:grid-cols-3 gap-6">
						<Card className="p-6 border-border/50 bg-card/50">
							<CardContent className="p-0 text-center space-y-2">
								<div className="text-3xl font-bold text-green-600">$127k</div>
								<div className="text-sm font-medium">Annual Savings</div>
								<div className="text-xs text-muted-foreground">Per 10-developer team</div>
							</CardContent>
						</Card>
						<Card className="p-6 border-border/50 bg-card/50">
							<CardContent className="p-0 text-center space-y-2">
								<div className="text-3xl font-bold text-blue-600">2 weeks</div>
								<div className="text-sm font-medium">Payback Period</div>
								<div className="text-xs text-muted-foreground">Full ROI realized</div>
							</CardContent>
						</Card>
						<Card className="p-6 border-border/50 bg-card/50">
							<CardContent className="p-0 text-center space-y-2">
								<div className="text-3xl font-bold text-purple-600">3.4x</div>
								<div className="text-sm font-medium">Productivity Boost</div>
								<div className="text-xs text-muted-foreground">Average improvement</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Pricing Plans */}
			<section className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-3 gap-8">
						{/* Starter */}
						<Card className="p-8 border-border/50 relative" {...getStaggerDelay(0, 200)}>
							<CardContent className="p-0 space-y-6">
								<div className="flex items-center space-x-2">
									<Rocket className="h-5 w-5 text-blue-500" />
									<h3 className="text-xl font-semibold">Starter</h3>
								</div>
								<div className="space-y-2">
									<div className="text-3xl font-bold">Free</div>
									<div className="text-sm text-muted-foreground">Perfect for small teams getting started</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Up to 5 team members</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">All 4 modules included</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">GitHub integration</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Basic analytics</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Community support</span>
									</div>
								</div>
								<Link href="/login">
									<Button className="w-full">
										Get Started Free
									</Button>
								</Link>
							</CardContent>
						</Card>

						{/* Professional */}
						<Card className="p-8 border-border/50 relative ring-2 ring-primary" {...getStaggerDelay(1, 200)}>
							<Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
								Most Popular
							</Badge>
							<CardContent className="p-0 space-y-6">
								<div className="flex items-center space-x-2">
									<Crown className="h-5 w-5 text-yellow-500" />
									<h3 className="text-xl font-semibold">Professional</h3>
								</div>
								<div className="space-y-2">
									<div className="text-3xl font-bold">$12<span className="text-lg text-muted-foreground">/member/month</span></div>
									<div className="text-sm text-muted-foreground">For growing teams that need more power</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Unlimited team members</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Advanced AI insights</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Custom integrations</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Priority support</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Advanced reporting</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">SSO integration</span>
									</div>
								</div>
								<Link href="/login">
									<Button className="w-full">
										Start Free Trial
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
							</CardContent>
						</Card>

						{/* Enterprise */}
						<Card className="p-8 border-border/50 relative" {...getStaggerDelay(2, 200)}>
							<CardContent className="p-0 space-y-6">
								<div className="flex items-center space-x-2">
									<Building className="h-5 w-5 text-purple-500" />
									<h3 className="text-xl font-semibold">Enterprise</h3>
								</div>
								<div className="space-y-2">
									<div className="text-3xl font-bold">Custom</div>
									<div className="text-sm text-muted-foreground">For large organizations with specific needs</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Volume discounts</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Dedicated success manager</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">On-premise deployment</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">SLA guarantees</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Custom training</span>
									</div>
									<div className="flex items-center space-x-3">
										<Check className="h-4 w-4 text-green-500 shrink-0" />
										<span className="text-sm">Advanced compliance</span>
									</div>
								</div>
								<Button variant="outline" className="w-full">
									Contact Sales
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className="py-24 px-6 bg-muted/30">
				<div className="max-w-4xl mx-auto">
					<div className="text-center space-y-8 mb-16">
						<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
							Frequently asked questions
						</h2>
						<p className="text-lg text-muted-foreground">
							Everything you need to know about Orbit pricing and plans.
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-8">
						{[
							{
								question: "Is there really a free plan?",
								answer: "Yes! Our Starter plan is completely free for teams up to 5 members. No credit card required, no time limits. Perfect for trying out Orbit or powering small teams."
							},
							{
								question: "What happens when I exceed the free plan limits?",
								answer: "We'll notify you when you're approaching limits and help you seamlessly upgrade. Your data and settings carry over, and you'll unlock advanced features immediately."
							},
							{
								question: "Can I cancel anytime?",
								answer: "Absolutely. Cancel anytime with one click. Your data remains accessible for 30 days after cancellation, giving you time to export if needed."
							},
							{
								question: "Do you offer discounts for nonprofits or education?",
								answer: "Yes! We offer significant discounts for educational institutions, nonprofits, and open-source projects. Contact our team for special pricing."
							},
							{
								question: "How does billing work for teams?",
								answer: "You're only billed for active team members. Add or remove members anytime and we'll automatically prorate your next bill."
							},
							{
								question: "What integrations are included?",
								answer: "GitHub integration is included in all plans. Professional plans add Slack, Jira, Linear, and 50+ other tools. Enterprise gets custom integrations."
							}
						].map((faq, index) => (
							<div key={faq.question} className="space-y-3" {...getStaggerDelay(index, 150)}>
								<h3 className="text-lg font-semibold">{faq.question}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-24 px-6">
				<div className="max-w-2xl mx-auto text-center space-y-8">
					<div className="space-y-4">
						<h2 className="text-3xl md:text-4xl font-medium tracking-tight">
							Ready to transform your workflow?
						</h2>
						<p className="text-lg text-muted-foreground">
							Start free, scale when ready. See the impact in your first week.
						</p>
					</div>

					<div className="flex flex-col items-center space-y-4">
						<Link href="/login">
							<Button size="lg" className="h-12 px-8 text-base font-medium">
								<Github className="mr-2 h-5 w-5" />
								Start Free Today
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						
						<div className="flex items-center space-x-4 text-sm text-muted-foreground">
							<span>No credit card required</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>2 minute setup</span>
							<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
							<span>Cancel anytime</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}