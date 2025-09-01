"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import {
	Sidebar,
	SidebarHeader,
	SidebarFooter,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModuleNav } from "@/components/module-nav";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { OrbitalLogo } from "@/components/ui/orbital-logo";

interface AppShellProps {
	children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const { user, signOut } = useAuth();
	const { setTheme, theme } = useTheme();

	const userInitials = React.useMemo(() => {
		if (!user?.user_metadata?.full_name) return "U";
		return user.user_metadata.full_name
			.split(" ")
			.map((name: string) => name[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}, [user]);

	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<Sidebar
					data-tour="sidebar"
					role="navigation"
					aria-label="Main navigation"
					className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col"
				>
					<SidebarHeader className="border-b border-border/30 bg-card/30">
						<Link href="/dashboard" className="block">
							<div className="flex items-center gap-3 px-4 py-3 group hover:bg-accent/50 rounded-lg mx-2 my-1 transition-colors">
								<div className="relative">
									<div
										className="h-10 w-10 rounded-xl border border-border/50 flex items-center justify-center bg-gradient-to-br from-background/50 to-muted/30 backdrop-blur-sm group-hover:scale-105 transition-transform"
										role="img"
										aria-label="Orbit logo"
									>
										<OrbitalLogo size={20} />
									</div>
									<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-lg"></div>
								</div>
								<div className="flex flex-col">
									<span className="text-lg font-medium">Orbit</span>
									<span className="text-xs text-muted-foreground">
										Developer Productivity Suite
									</span>
								</div>
							</div>
						</Link>
					</SidebarHeader>

					<div className="flex-1 overflow-auto min-h-0">
						<ModuleNav />
					</div>

					<SidebarFooter className="border-t border-border/30 bg-card/30">
						<div className="px-2 py-1">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="w-full justify-start gap-3 px-3 py-2 h-auto hover:bg-accent/50 rounded-lg"
										data-tour="user-menu"
										aria-label={`User menu for ${
											user?.user_metadata?.full_name || "User"
										}`}
									>
										<Avatar className="h-8 w-8 ring-2 ring-border/30">
											<AvatarImage
												src={user?.user_metadata?.avatar_url}
												alt={`${
													user?.user_metadata?.full_name || "User"
												} avatar`}
											/>
											<AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
												{userInitials}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col items-start text-left flex-1">
											<span className="text-sm font-medium">
												{user?.user_metadata?.full_name || "User"}
											</span>
											<div className="flex items-center gap-2">
												<span className="text-xs text-muted-foreground">
													{user?.email}
												</span>
												<div className="w-1 h-1 bg-green-500 rounded-full"></div>
											</div>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56"
									aria-label="User account menu"
								>
									<DropdownMenuLabel>My Account</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/profile">
											<User
												className="mr-2 h-4 w-4"
												aria-hidden="true"
											/>
											Profile
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/settings">
											<Settings
												className="mr-2 h-4 w-4"
												aria-hidden="true"
											/>
											Settings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											setTheme(theme === "dark" ? "light" : "dark")
										}
										aria-label={`Switch to ${
											theme === "dark" ? "light" : "dark"
										} theme`}
									>
										{theme === "dark" ? (
											<Sun
												className="mr-2 h-4 w-4"
												aria-hidden="true"
											/>
										) : (
											<Moon
												className="mr-2 h-4 w-4"
												aria-hidden="true"
											/>
										)}
										Toggle Theme
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => signOut()}
										aria-label="Sign out of your account"
									>
										<LogOut
											className="mr-2 h-4 w-4"
											aria-hidden="true"
										/>
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</SidebarFooter>
				</Sidebar>

				<div className="flex flex-1 flex-col">
					<header
						className="flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-sm px-6"
						role="banner"
						aria-label="Application header"
					>
						<SidebarTrigger 
							aria-label="Toggle navigation sidebar" 
							className="hover:bg-accent/50 rounded-lg"
						/>
						<div className="flex flex-1 items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground/80">
									Press{" "}
									<kbd
										className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/50 bg-muted/50 backdrop-blur-sm px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
										aria-label="Command K keyboard shortcut"
									>
										<span className="text-xs">⌘</span>K
									</kbd>{" "}
									to open command palette
								</span>
							</div>
						</div>
					</header>

					<main
						className="flex-1 overflow-auto"
						role="main"
						aria-label="Main content"
						tabIndex={-1}
					>
						<PageTransition>
							{children}
						</PageTransition>
					</main>
				</div>
			</div>

			<CommandPalette />
		</SidebarProvider>
	);
}
