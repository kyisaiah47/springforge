"use client";

import { useState } from "react";
import {
	Filter,
	Search,
	X,
	ChevronDown,
	AlertTriangle,
	FileText,
	User,
	GitBranch,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GetPRInsightsRequest } from "@/lib/modules/pr-radar/types";

interface PRFiltersProps {
	filters: Partial<GetPRInsightsRequest>;
	onFiltersChange: (filters: Partial<GetPRInsightsRequest>) => void;
	availableRepos?: string[];
	availableAuthors?: Array<{ github_login: string; member_id: string }>;
	className?: string;
}

const STATUS_OPTIONS = [
	{ value: "open", label: "Open", color: "text-green-600" },
	{ value: "merged", label: "Merged", color: "text-purple-600" },
	{ value: "closed", label: "Closed", color: "text-red-600" },
] as const;

const RISK_LEVELS = [
	{ value: 0, label: "Any Risk", color: "text-gray-600" },
	{ value: 3, label: "Low Risk (0-3)", color: "text-green-600" },
	{ value: 7, label: "Medium Risk (3-7)", color: "text-yellow-600" },
	{ value: 10, label: "High Risk (7-10)", color: "text-red-600" },
] as const;

const SORT_OPTIONS = [
	{ value: "updated_at", label: "Recently Updated" },
	{ value: "opened_at", label: "Recently Opened" },
	{ value: "risk_score", label: "Risk Score" },
	{ value: "size_score", label: "Size Score" },
] as const;

export function PRFilters({
	filters,
	onFiltersChange,
	availableRepos = [],
	availableAuthors = [],
	className,
}: PRFiltersProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const updateFilter = (
		key: keyof GetPRInsightsRequest,
		value: string | number | undefined
	) => {
		onFiltersChange({ ...filters, [key]: value });
	};

	const clearFilter = (key: keyof GetPRInsightsRequest) => {
		const newFilters = { ...filters };
		delete newFilters[key];
		onFiltersChange(newFilters);
	};

	const clearAllFilters = () => {
		onFiltersChange({});
		setSearchQuery("");
	};

	const activeFilterCount = Object.keys(filters).filter(
		(key) => filters[key as keyof GetPRInsightsRequest] !== undefined
	).length;

	const selectedRepo = availableRepos.find((repo) => repo === filters.repo);
	const selectedAuthor = availableAuthors.find(
		(author) => author.member_id === filters.author_member_id
	);
	const selectedStatus = STATUS_OPTIONS.find(
		(status) => status.value === filters.status
	);
	const selectedSort = SORT_OPTIONS.find(
		(sort) => sort.value === filters.order_by
	);

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Filter className="size-5" />
						Filters
						{activeFilterCount > 0 && (
							<span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded-full">
								{activeFilterCount}
							</span>
						)}
					</CardTitle>
					{activeFilterCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearAllFilters}
						>
							<X className="size-3" />
							Clear All
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="Search repositories..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Filter Row */}
				<div className="flex flex-wrap gap-2">
					{/* Repository Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"justify-between",
									selectedRepo &&
										"bg-blue-50 border-blue-200 dark:bg-blue-900/20"
								)}
							>
								<div className="flex items-center gap-2">
									<GitBranch className="size-3" />
									{selectedRepo || "All Repositories"}
								</div>
								<ChevronDown className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-56"
						>
							<DropdownMenuLabel>Repository</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => clearFilter("repo")}>
								All Repositories
							</DropdownMenuItem>
							{availableRepos.map((repo) => (
								<DropdownMenuItem
									key={repo}
									onClick={() => updateFilter("repo", repo)}
								>
									{repo}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Author Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"justify-between",
									selectedAuthor &&
										"bg-blue-50 border-blue-200 dark:bg-blue-900/20"
								)}
							>
								<div className="flex items-center gap-2">
									<User className="size-3" />
									{selectedAuthor?.github_login || "All Authors"}
								</div>
								<ChevronDown className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-56"
						>
							<DropdownMenuLabel>Author</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => clearFilter("author_member_id")}>
								All Authors
							</DropdownMenuItem>
							{availableAuthors.map((author) => (
								<DropdownMenuItem
									key={author.member_id}
									onClick={() =>
										updateFilter("author_member_id", author.member_id)
									}
								>
									{author.github_login}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Status Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"justify-between",
									selectedStatus &&
										"bg-blue-50 border-blue-200 dark:bg-blue-900/20"
								)}
							>
								<div className="flex items-center gap-2">
									<div
										className={cn(
											"size-2 rounded-full",
											selectedStatus?.color === "text-green-600" &&
												"bg-green-500",
											selectedStatus?.color === "text-purple-600" &&
												"bg-purple-500",
											selectedStatus?.color === "text-red-600" && "bg-red-500",
											!selectedStatus && "bg-gray-400"
										)}
									/>
									{selectedStatus?.label || "All Status"}
								</div>
								<ChevronDown className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-40"
						>
							<DropdownMenuLabel>Status</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => clearFilter("status")}>
								All Status
							</DropdownMenuItem>
							{STATUS_OPTIONS.map((status) => (
								<DropdownMenuItem
									key={status.value}
									onClick={() => updateFilter("status", status.value)}
								>
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"size-2 rounded-full",
												status.color === "text-green-600" && "bg-green-500",
												status.color === "text-purple-600" && "bg-purple-500",
												status.color === "text-red-600" && "bg-red-500"
											)}
										/>
										{status.label}
									</div>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Risk Level Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"justify-between",
									filters.risk_min !== undefined &&
										"bg-blue-50 border-blue-200 dark:bg-blue-900/20"
								)}
							>
								<div className="flex items-center gap-2">
									<AlertTriangle className="size-3" />
									{filters.risk_min !== undefined
										? RISK_LEVELS.find(
												(level) => level.value === filters.risk_min
										  )?.label || "Custom Risk"
										: "Any Risk"}
								</div>
								<ChevronDown className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-48"
						>
							<DropdownMenuLabel>Risk Level</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{RISK_LEVELS.map((level) => (
								<DropdownMenuItem
									key={level.value}
									onClick={() =>
										level.value === 0
											? clearFilter("risk_min")
											: updateFilter("risk_min", level.value)
									}
								>
									<span className={level.color}>{level.label}</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Sort Order */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="justify-between"
							>
								<div className="flex items-center gap-2">
									<FileText className="size-3" />
									{selectedSort?.label || "Recently Updated"}
								</div>
								<ChevronDown className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-48"
						>
							<DropdownMenuLabel>Sort By</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{SORT_OPTIONS.map((sort) => (
								<DropdownMenuItem
									key={sort.value}
									onClick={() => updateFilter("order_by", sort.value)}
								>
									{sort.label}
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() =>
									updateFilter(
										"order_dir",
										filters.order_dir === "asc" ? "desc" : "asc"
									)
								}
							>
								{filters.order_dir === "asc" ? "Ascending" : "Descending"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Active Filters */}
				{activeFilterCount > 0 && (
					<div className="flex flex-wrap gap-2 pt-2 border-t">
						{filters.repo && (
							<FilterTag
								label={`Repo: ${filters.repo}`}
								onRemove={() => clearFilter("repo")}
							/>
						)}
						{selectedAuthor && (
							<FilterTag
								label={`Author: ${selectedAuthor.github_login}`}
								onRemove={() => clearFilter("author_member_id")}
							/>
						)}
						{selectedStatus && (
							<FilterTag
								label={`Status: ${selectedStatus.label}`}
								onRemove={() => clearFilter("status")}
							/>
						)}
						{filters.risk_min !== undefined && (
							<FilterTag
								label={`Risk: ≥${filters.risk_min}`}
								onRemove={() => clearFilter("risk_min")}
							/>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface FilterTagProps {
	label: string;
	onRemove: () => void;
}

function FilterTag({ label, onRemove }: FilterTagProps) {
	return (
		<div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded">
			<span>{label}</span>
			<button
				onClick={onRemove}
				className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
			>
				<X className="size-2" />
			</button>
		</div>
	);
}
