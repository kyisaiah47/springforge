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
		shortcut: "g d",
	},
	{
		title: "AutoStand",
		url: "/standups",
		icon: Users,
		shortcut: "g s",
	},
	{
		title: "PR Radar",
		url: "/pr-radar",
		icon: GitPullRequest,
		shortcut: "g p",
	},
	{
		title: "Retro Arena",
		url: "/retro",
		icon: MessageSquare,
		shortcut: "g r",
	},
	{
		title: "Debug Arcade",
		url: "/arcade",
		icon: Gamepad2,
		shortcut: "g a",
	},
];

export function ModuleNav() {
	const pathname = usePathname();
	const router = useRouter();

	// Handle keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Only handle shortcuts when not in input fields
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement
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
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Modules</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{modules.map((module) => (
							<SidebarMenuItem key={module.title}>
								<SidebarMenuButton
									asChild
									isActive={pathname.startsWith(module.url)}
									tooltip={`${module.title} (${module.shortcut})`}
								>
									<Link href={module.url}>
										<module.icon className="h-4 w-4" />
										<span>{module.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	);
}
