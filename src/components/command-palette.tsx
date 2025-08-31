"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Users,
	GitPullRequest,
	MessageSquare,
	Gamepad2,
	Home,
	Settings,
	LogOut,
	Moon,
	Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/auth-provider";

const navigationItems = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: Home,
		keywords: ["dashboard", "home", "overview"],
	},
	{
		title: "AutoStand",
		url: "/standups",
		icon: Users,
		keywords: ["autostand", "standups", "daily", "team"],
	},
	{
		title: "PR Radar",
		url: "/pr-radar",
		icon: GitPullRequest,
		keywords: ["pr", "radar", "pull", "request", "review"],
	},
	{
		title: "Retro Arena",
		url: "/retro",
		icon: MessageSquare,
		keywords: ["retro", "retrospective", "arena", "feedback"],
	},
	{
		title: "Debug Arcade",
		url: "/arcade",
		icon: Gamepad2,
		keywords: ["debug", "arcade", "challenges", "coding"],
	},
	{
		title: "Settings",
		url: "/settings",
		icon: Settings,
		keywords: ["settings", "preferences", "config"],
	},
];

export function CommandPalette() {
	const [open, setOpen] = React.useState(false);
	const router = useRouter();
	const { setTheme, theme } = useTheme();
	const { signOut } = useAuth();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
		>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Navigation">
					{navigationItems.map((item) => (
						<CommandItem
							key={item.url}
							value={`${item.title} ${item.keywords.join(" ")}`}
							onSelect={() => runCommand(() => router.push(item.url))}
						>
							<item.icon className="mr-2 h-4 w-4" />
							<span>{item.title}</span>
						</CommandItem>
					))}
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Theme">
					<CommandItem
						value="toggle theme light"
						onSelect={() => runCommand(() => setTheme("light"))}
					>
						<Sun className="mr-2 h-4 w-4" />
						<span>Light Theme</span>
					</CommandItem>
					<CommandItem
						value="toggle theme dark"
						onSelect={() => runCommand(() => setTheme("dark"))}
					>
						<Moon className="mr-2 h-4 w-4" />
						<span>Dark Theme</span>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Account">
					<CommandItem
						value="sign out logout"
						onSelect={() => runCommand(() => signOut())}
					>
						<LogOut className="mr-2 h-4 w-4" />
						<span>Sign Out</span>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
