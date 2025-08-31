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
	CommandShortcut,
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
	Plus,
	Zap,
	RefreshCw,
	Search,
	Copy,
	Clock,
	Activity,
	Github,
	Slack,
	ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/auth-provider";
import { toast } from "sonner";

const navigationItems = [
	{
		title: "Dashboard",
		subtitle: "Overview of all modules",
		url: "/dashboard",
		icon: Home,
		keywords: ["dashboard", "home", "overview"],
		shortcut: "G D",
	},
	{
		title: "AutoStand", 
		subtitle: "Automated daily standups",
		url: "/standups",
		icon: Users,
		keywords: ["autostand", "standups", "daily", "team"],
		shortcut: "G S",
	},
	{
		title: "PR Radar",
		subtitle: "Pull request insights and scoring",
		url: "/pr-radar",
		icon: GitPullRequest,
		keywords: ["pr", "radar", "pull", "request", "review"],
		shortcut: "G P",
	},
	{
		title: "Retro Arena",
		subtitle: "Team retrospectives",
		url: "/retro",
		icon: MessageSquare,
		keywords: ["retro", "retrospective", "arena", "feedback"],
		shortcut: "G R",
	},
	{
		title: "Debug Arcade",
		subtitle: "Coding challenges",
		url: "/arcade",
		icon: Gamepad2,
		keywords: ["debug", "arcade", "challenges", "coding"],
		shortcut: "G A",
	},
	{
		title: "Settings",
		subtitle: "Organization & integrations",
		url: "/settings",
		icon: Settings,
		keywords: ["settings", "preferences", "config"],
		shortcut: "G ,",
	},
];

const quickActions = [
	{
		title: "Generate Standup",
		subtitle: "Create today's standup from GitHub activity",
		icon: Zap,
		keywords: ["generate", "standup", "create", "today"],
		shortcut: "C S",
		action: (router: any) => {
			router.push("/standups");
			toast.success("Navigate to AutoStand to generate standup");
		},
	},
	{
		title: "Create Retrospective",
		subtitle: "Start a new team retrospective session",
		icon: Plus,
		keywords: ["create", "retro", "retrospective", "new"],
		shortcut: "C R", 
		action: (router: any) => {
			router.push("/retro");
			toast.success("Navigate to Retro Arena to create retrospective");
		},
	},
	{
		title: "Refresh PR Data",
		subtitle: "Update pull request insights from GitHub",
		icon: RefreshCw,
		keywords: ["refresh", "pr", "update", "github"],
		shortcut: "R P",
		action: () => {
			toast.promise(
				fetch("/api/prs").then(res => res.json()),
				{
					loading: "Refreshing PR data...",
					success: "PR insights updated!",
					error: "Failed to refresh PR data",
				}
			);
		},
	},
	{
		title: "Copy Current URL",
		subtitle: "Copy the current page URL to clipboard",
		icon: Copy,
		keywords: ["copy", "url", "clipboard", "link"],
		shortcut: "⌘ ⇧ C",
		action: () => {
			navigator.clipboard.writeText(window.location.href);
			toast.success("URL copied to clipboard");
		},
	},
	{
		title: "View Recent Activity",
		subtitle: "See latest commits and GitHub activity",
		icon: Activity,
		keywords: ["activity", "commits", "github", "recent"],
		action: (router: any) => {
			router.push("/standups");
			toast.success("Viewing recent GitHub activity");
		},
	},
];

const integrationActions = [
	{
		title: "GitHub Integration",
		subtitle: "Configure GitHub access token",
		icon: Github,
		keywords: ["github", "integration", "token", "configure"],
		action: (router: any) => router.push("/settings?tab=integrations"),
	},
	{
		title: "Slack Integration", 
		subtitle: "Configure Slack webhook",
		icon: Slack,
		keywords: ["slack", "integration", "webhook", "configure"],
		action: (router: any) => router.push("/settings?tab=integrations"),
	},
	{
		title: "Test Integrations",
		subtitle: "Verify GitHub and Slack connections",
		icon: ExternalLink,
		keywords: ["test", "verify", "integrations", "connections"],
		action: (router: any) => {
			router.push("/settings?tab=integrations");
			toast.success("Navigate to settings to test integrations");
		},
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
			// ESC key to close
			if (e.key === "Escape" && open) {
				e.preventDefault();
				setOpen(false);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open]);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title="Command Palette"
			description="Quickly navigate and perform actions"
		>
			<CommandInput
				placeholder="Search commands, pages, and actions..."
				aria-label="Search commands"
			/>
			<CommandList
				role="listbox"
				aria-label="Available commands"
				className="max-h-[400px]"
			>
				<CommandEmpty>
					<div className="flex flex-col items-center gap-2 py-6">
						<Search className="size-8 text-muted-foreground" />
						<div className="text-sm font-medium">No results found</div>
						<div className="text-xs text-muted-foreground">
							Try searching for "dashboard", "standup", or "retro"
						</div>
					</div>
				</CommandEmpty>
				
				<CommandGroup
					heading="Navigation"
					role="group"
					aria-label="Navigation commands"
				>
					{navigationItems.map((item) => (
						<CommandItem
							key={item.url}
							value={`${item.title} ${item.subtitle} ${item.keywords.join(" ")}`}
							onSelect={() => runCommand(() => router.push(item.url))}
							role="option"
							aria-label={`Navigate to ${item.title}`}
							className="flex items-center gap-3 px-4 py-3"
						>
							<item.icon className="size-4" />
							<div className="flex-1 min-w-0">
								<div className="font-medium truncate">{item.title}</div>
								<div className="text-sm text-muted-foreground truncate">
									{item.subtitle}
								</div>
							</div>
							<CommandShortcut>{item.shortcut}</CommandShortcut>
						</CommandItem>
					))}
				</CommandGroup>

				<CommandSeparator />
				<CommandGroup
					heading="Quick Actions"
					role="group"
					aria-label="Quick action commands"
				>
					{quickActions.map((action) => (
						<CommandItem
							key={action.title}
							value={`${action.title} ${action.subtitle} ${action.keywords.join(" ")}`}
							onSelect={() => runCommand(() => action.action(router))}
							role="option"
							aria-label={action.title}
							className="flex items-center gap-3 px-4 py-3"
						>
							<action.icon className="size-4" />
							<div className="flex-1 min-w-0">
								<div className="font-medium truncate">{action.title}</div>
								<div className="text-sm text-muted-foreground truncate">
									{action.subtitle}
								</div>
							</div>
							{action.shortcut && (
								<CommandShortcut>{action.shortcut}</CommandShortcut>
							)}
						</CommandItem>
					))}
				</CommandGroup>

				<CommandSeparator />
				<CommandGroup
					heading="Integrations"
					role="group"
					aria-label="Integration commands"
				>
					{integrationActions.map((action) => (
						<CommandItem
							key={action.title}
							value={`${action.title} ${action.subtitle} ${action.keywords.join(" ")}`}
							onSelect={() => runCommand(() => action.action(router))}
							role="option"
							aria-label={action.title}
							className="flex items-center gap-3 px-4 py-3"
						>
							<action.icon className="size-4" />
							<div className="flex-1 min-w-0">
								<div className="font-medium truncate">{action.title}</div>
								<div className="text-sm text-muted-foreground truncate">
									{action.subtitle}
								</div>
							</div>
						</CommandItem>
					))}
				</CommandGroup>

				<CommandSeparator />
				<CommandGroup
					heading="Preferences"
					role="group"
					aria-label="Preference commands"
				>
					<CommandItem
						value="toggle theme light"
						onSelect={() => runCommand(() => setTheme("light"))}
						role="option"
						aria-label="Switch to light theme"
						className="flex items-center gap-3 px-4 py-3"
					>
						<Sun className="size-4" />
						<div className="flex-1">
							<div className="font-medium">Light Theme</div>
							<div className="text-sm text-muted-foreground">Switch to light mode</div>
						</div>
					</CommandItem>
					<CommandItem
						value="toggle theme dark"
						onSelect={() => runCommand(() => setTheme("dark"))}
						role="option"
						aria-label="Switch to dark theme"
						className="flex items-center gap-3 px-4 py-3"
					>
						<Moon className="size-4" />
						<div className="flex-1">
							<div className="font-medium">Dark Theme</div>
							<div className="text-sm text-muted-foreground">Switch to dark mode</div>
						</div>
					</CommandItem>
					<CommandItem
						value="sign out logout"
						onSelect={() => runCommand(() => signOut())}
						role="option"
						aria-label="Sign out of your account"
						className="flex items-center gap-3 px-4 py-3"
					>
						<LogOut className="size-4" />
						<div className="flex-1">
							<div className="font-medium">Sign Out</div>
							<div className="text-sm text-muted-foreground">Sign out of your account</div>
						</div>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
