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
				<Sidebar>
					<SidebarHeader className="border-b border-sidebar-border">
						<div className="flex items-center gap-2 px-4 py-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<span className="text-sm font-bold">SF</span>
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-semibold">SprintForge</span>
								<span className="text-xs text-muted-foreground">
									Developer Suite
								</span>
							</div>
						</div>
					</SidebarHeader>

					<ModuleNav />

					<SidebarFooter className="border-t border-sidebar-border">
						<div className="flex items-center gap-2 px-4 py-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="h-8 w-full justify-start gap-2 px-2"
									>
										<Avatar className="h-6 w-6">
											<AvatarImage
												src={user?.user_metadata?.avatar_url}
												alt={user?.user_metadata?.full_name || "User"}
											/>
											<AvatarFallback className="text-xs">
												{userInitials}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col items-start text-left">
											<span className="text-sm font-medium">
												{user?.user_metadata?.full_name || "User"}
											</span>
											<span className="text-xs text-muted-foreground">
												{user?.email}
											</span>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56"
								>
									<DropdownMenuLabel>My Account</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/settings">
											<User className="mr-2 h-4 w-4" />
											Profile
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/settings">
											<Settings className="mr-2 h-4 w-4" />
											Settings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											setTheme(theme === "dark" ? "light" : "dark")
										}
									>
										{theme === "dark" ? (
											<Sun className="mr-2 h-4 w-4" />
										) : (
											<Moon className="mr-2 h-4 w-4" />
										)}
										Toggle Theme
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => signOut()}>
										<LogOut className="mr-2 h-4 w-4" />
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</SidebarFooter>
				</Sidebar>

				<div className="flex flex-1 flex-col">
					<header className="flex h-14 items-center gap-4 border-b bg-background px-6">
						<SidebarTrigger />
						<div className="flex flex-1 items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									Press{" "}
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
										<span className="text-xs">⌘</span>K
									</kbd>{" "}
									to open command palette
								</span>
							</div>
						</div>
					</header>

					<main className="flex-1 overflow-auto">{children}</main>
				</div>
			</div>

			<CommandPalette />
		</SidebarProvider>
	);
}
