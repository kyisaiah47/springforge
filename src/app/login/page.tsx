"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Github, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import { OrbitalLogo } from "@/components/ui/orbital-logo";

function LoginContent() {
	const { user, loading, signInWithGitHub } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectedFrom = searchParams.get("redirectedFrom");

	useEffect(() => {
		if (user && !loading) {
			router.push(redirectedFrom || "/dashboard");
		}
	}, [user, loading, router, redirectedFrom]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="relative">
					<div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-foreground"></div>
					<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-primary/20 to-transparent animate-pulse"></div>
				</div>
			</div>
		);
	}

	if (user) {
		return null; // Will redirect via useEffect
	}

	return (
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
			
			{/* Header */}
			<header className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
				<div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
					<Link href="/" className="flex items-center space-x-2">
						<Badge 
							variant="outline" 
							className="h-8 w-8 rounded-lg p-0 border-border/50 flex items-center justify-center"
						>
							<OrbitalLogo size={16} />
						</Badge>
						<span className="font-semibold text-lg">Orbit</span>
					</Link>

					<Link href="/" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
						<ArrowLeft className="h-4 w-4" />
						Back to home
					</Link>
				</div>
			</header>

			{/* Main content */}
			<div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-24">
				<div className="max-w-md w-full space-y-8">
					{/* Logo and title */}
					<div className="text-center space-y-6">
						<div className="flex justify-center">
							<div className="relative">
								<Badge 
									variant="outline" 
									className="h-16 w-16 rounded-2xl p-0 border-border/50 flex items-center justify-center bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 group"
								>
									<OrbitalLogo size={32} />
								</Badge>
								<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
							</div>
						</div>

						<div className="space-y-3">
							<h1 className="text-3xl md:text-4xl font-light tracking-tight">
								Welcome to <span className="font-medium">Orbit</span>
							</h1>
							<p className="text-lg text-muted-foreground">
								Sign in to start revolutionizing your workflow
							</p>
						</div>
					</div>

					{/* Login card */}
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
						<CardContent className="p-8 space-y-6">
							<div className="space-y-4">
								<Button
									onClick={signInWithGitHub}
									size="lg"
									className="w-full h-12 text-base font-medium rounded-xl"
								>
									<Github className="mr-3 h-5 w-5" />
									Continue with GitHub
								</Button>
							</div>

							<div className="text-center space-y-2">
								<p className="text-sm text-muted-foreground">
									By continuing, you agree to our Terms of Service
								</p>
								<div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground/80">
									<span>Secure OAuth</span>
									<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
									<span>No passwords</span>
									<div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
									<span>2-second setup</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
				</div>
			}
		>
			<LoginContent />
		</Suspense>
	);
}
