"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Github, Settings, Bell, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfilePage() {
	const { user } = useAuth();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const userInitials = user?.user_metadata?.full_name
		?.split(" ")
		.map((name: string) => name[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "U";

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
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-3 h-3 bg-green-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								<span className="font-medium">Profile</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Manage your personal preferences, update your profile information, and customize your Orbit experience.
						</p>
					</div>
				</div>

				<div className="max-w-4xl space-y-8">
					{/* Profile Overview */}
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-3">
								<User className="h-5 w-5" />
								Personal Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-start gap-6">
								<Avatar className="h-20 w-20 ring-2 ring-border/30">
									<AvatarImage
										src={user?.user_metadata?.avatar_url}
										alt={`${user?.user_metadata?.full_name || "User"} avatar`}
									/>
									<AvatarFallback className="text-lg bg-primary/10 text-primary font-medium">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								
								<div className="space-y-3 flex-1">
									<div className="space-y-1">
										<h3 className="text-xl font-semibold">
											{user?.user_metadata?.full_name || "User"}
										</h3>
										<div className="flex items-center gap-2">
											<Mail className="h-4 w-4 text-muted-foreground" />
											<span className="text-muted-foreground">{user?.email}</span>
										</div>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-muted-foreground text-sm">
												Member since {new Date(user?.created_at || "").toLocaleDateString()}
											</span>
										</div>
									</div>
									
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
											<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
											Active
										</Badge>
										<Badge variant="outline">
											<Github className="w-3 h-3 mr-1" />
											GitHub Connected
										</Badge>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Settings */}
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-3">
								<Settings className="h-5 w-5" />
								Quick Settings
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-muted/20">
								<div className="flex items-center gap-3">
									<Palette className="h-5 w-5 text-muted-foreground" />
									<div>
										<div className="font-medium">Theme</div>
										<div className="text-sm text-muted-foreground">
											Choose your preferred appearance
										</div>
									</div>
								</div>
								{mounted ? (
									<div className="flex gap-2">
										<Button
											variant={theme === "light" ? "default" : "outline"}
											size="sm"
											onClick={() => setTheme("light")}
										>
											Light
										</Button>
										<Button
											variant={theme === "dark" ? "default" : "outline"}
											size="sm"
											onClick={() => setTheme("dark")}
										>
											Dark
										</Button>
										<Button
											variant={theme === "system" ? "default" : "outline"}
											size="sm"
											onClick={() => setTheme("system")}
										>
											System
										</Button>
									</div>
								) : (
									<div className="flex gap-2">
										<Button variant="outline" size="sm" disabled>
											Light
										</Button>
										<Button variant="outline" size="sm" disabled>
											Dark
										</Button>
										<Button variant="outline" size="sm" disabled>
											System
										</Button>
									</div>
								)}
							</div>

							<div className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-muted/20">
								<div className="flex items-center gap-3">
									<Bell className="h-5 w-5 text-muted-foreground" />
									<div>
										<div className="font-medium">Notifications</div>
										<div className="text-sm text-muted-foreground">
											Manage your notification preferences
										</div>
									</div>
								</div>
								<Button variant="outline" size="sm">
									Configure
								</Button>
							</div>
						</CardContent>
					</Card>

					<Separator className="opacity-50" />

					{/* Navigation to Settings */}
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<h3 className="font-medium">Organization Settings</h3>
									<p className="text-sm text-muted-foreground">
										Manage team members, integrations, and organization-wide preferences
									</p>
								</div>
								<Link href="/settings">
									<Button variant="outline">
										<Settings className="w-4 h-4 mr-2" />
										Open Settings
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}