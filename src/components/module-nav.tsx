"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	Users,
	GitPullRequest,
	MessageSquare,
	Gamepad2,
	Home,
} from "lucide-react";

const modules = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: Home,
		shortcut: "G D",
	},
	{
		title: "AutoStand",
		url: "/standups",
		icon: Users,
		shortcut: "G S",
	},
	{
		title: "PR Radar",
		url: "/pr-radar",
		icon: GitPullRequest,
		shortcut: "G P",
	},
	{
		title: "Retro Arena",
		url: "/retro",
		icon: MessageSquare,
		shortcut: "G R",
	},
	{
		title: "Debug Arcade",
		url: "/arcade",
		icon: Gamepad2,
		shortcut: "G A",
	},
];

export function ModuleNav() {
	const pathname = usePathname();
	const router = useRouter();

	// Handle keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Only handle shortcuts when not in input fields or when command palette is open
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement ||
				document.querySelector('[role="dialog"]') // Command palette is open
			) {
				return;
			}

			// Handle 'g' key combinations
			if (event.key === "g") {
				const handleSecondKey = (secondEvent: KeyboardEvent) => {
					secondEvent.preventDefault();

					switch (secondEvent.key) {
						case "d":
							router.push("/dashboard");
							break;
						case "s":
							router.push("/standups");
							break;
						case "p":
							router.push("/pr-radar");
							break;
						case "r":
							router.push("/retro");
							break;
						case "a":
							router.push("/arcade");
							break;
					}

					// Remove the listener after handling
					document.removeEventListener("keydown", handleSecondKey);
				};

				// Add temporary listener for the second key
				document.addEventListener("keydown", handleSecondKey);

				// Remove listener after 2 seconds if no second key is pressed
				setTimeout(() => {
					document.removeEventListener("keydown", handleSecondKey);
				}, 2000);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [router]);

	return (
		<SidebarContent className="px-2 py-2">
			<SidebarGroup>
				<SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-2">
					Modules
				</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu
						role="list"
						aria-label="Module navigation"
						className="space-y-0.5"
					>
						{modules.map((module) => {
							const isActive = pathname.startsWith(module.url);
							const moduleColor = 
								module.title === "Dashboard" ? "blue" :
								module.title === "AutoStand" ? "blue" :
								module.title === "PR Radar" ? "green" :
								module.title === "Retro Arena" ? "purple" :
								"orange";
							
							return (
								<SidebarMenuItem key={module.title}>
									<SidebarMenuButton
										asChild
										isActive={isActive}
										tooltip={module.title}
										className="group h-auto p-0 rounded-xl hover:bg-accent/50"
									>
										<Link
											href={module.url}
											className="flex items-center gap-3 p-3 w-full"
											aria-label={`Navigate to ${module.title}`}
										>
											<div className="relative shrink-0">
												<div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
													moduleColor === "blue" ? "from-blue-500/20 to-blue-600/30" :
													moduleColor === "green" ? "from-green-500/20 to-green-600/30" :
													moduleColor === "purple" ? "from-purple-500/20 to-purple-600/30" :
													"from-orange-500/20 to-orange-600/30"
												} border border-border/50 flex items-center justify-center group-hover:scale-105 transition-transform`}>
													<module.icon
														className={`h-4 w-4 ${
															moduleColor === "blue" ? "text-blue-600" :
															moduleColor === "green" ? "text-green-600" :
															moduleColor === "purple" ? "text-purple-600" :
															"text-orange-600"
														}`}
													/>
												</div>
											</div>
											<div className="flex flex-col flex-1 min-w-0">
												<span className="text-sm font-medium truncate">{module.title}</span>
											</div>
											{isActive && (
												<div className="w-2 h-2 bg-primary rounded-full shrink-0"></div>
											)}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	);
}
