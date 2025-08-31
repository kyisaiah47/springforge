"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Filter, Calendar, User, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StandupCard } from "./standup-card";
import type {
	GetStandupsRequest,
	GetStandupsResponse,
} from "@/lib/modules/autostand/types";

interface StandupHistoryProps {
	onFetchStandups: (
		request: GetStandupsRequest
	) => Promise<GetStandupsResponse>;
	className?: string;
}

interface FilterState {
	member_id?: string;
	date_from?: string;
	date_to?: string;
	order_by: "date" | "created_at";
	order_dir: "asc" | "desc";
}

const DATE_PRESETS = [
	{ label: "Today", days: 0 },
	{ label: "Last 3 days", days: 3 },
	{ label: "Last 7 days", days: 7 },
	{ label: "Last 30 days", days: 30 },
];

const SORT_OPTIONS = [
	{
		value: "date-desc",
		label: "Date (Newest first)",
		order_by: "date",
		order_dir: "desc",
	},
	{
		value: "date-asc",
		label: "Date (Oldest first)",
		order_by: "date",
		order_dir: "asc",
	},
	{
		value: "created_at-desc",
		label: "Created (Newest first)",
		order_by: "created_at",
		order_dir: "desc",
	},
	{
		value: "created_at-asc",
		label: "Created (Oldest first)",
		order_by: "created_at",
		order_dir: "asc",
	},
] as const;

export function StandupHistory({
	onFetchStandups,
	className,
}: StandupHistoryProps) {
	const [standups, setStandups] = useState<GetStandupsResponse["standups"]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<string | undefined>();
	const [filters, setFilters] = useState<FilterState>({
		order_by: "date",
		order_dir: "desc",
	});

	const loadStandups = useCallback(
		async (reset = false) => {
			setIsLoading(true);
			try {
				const request: GetStandupsRequest = {
					...filters,
					limit: 10,
					cursor: reset ? undefined : nextCursor,
				};

				const response = await onFetchStandups(request);

				if (reset) {
					setStandups(response.standups);
				} else {
					setStandups((prev) => [...prev, ...response.standups]);
				}

				setHasMore(response.has_more);
				setNextCursor(response.next_cursor);
			} catch (error) {
				console.error("Failed to load standups:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[filters, nextCursor, onFetchStandups]
	);

	// Load initial data
	useEffect(() => {
		loadStandups(true);
	}, [loadStandups]);

	const handleDatePreset = (days: number) => {
		const today = new Date();
		const fromDate = days === 0 ? today : subDays(today, days);

		setFilters((prev) => ({
			...prev,
			date_from: format(startOfDay(fromDate), "yyyy-MM-dd"),
			date_to: format(endOfDay(today), "yyyy-MM-dd"),
		}));
	};

	const handleSortChange = (sortValue: string) => {
		const option = SORT_OPTIONS.find((opt) => opt.value === sortValue);
		if (option) {
			setFilters((prev) => ({
				...prev,
				order_by: option.order_by as "date" | "created_at",
				order_dir: option.order_dir as "asc" | "desc",
			}));
		}
	};

	const clearFilters = () => {
		setFilters({
			order_by: "date",
			order_dir: "desc",
		});
	};

	const hasActiveFilters =
		filters.member_id || filters.date_from || filters.date_to;
	const currentSortOption = SORT_OPTIONS.find(
		(opt) =>
			opt.order_by === filters.order_by && opt.order_dir === filters.order_dir
	);

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Calendar className="size-5" />
						Standup History
					</CardTitle>
					<div className="flex items-center gap-2">
						{/* Date Filter */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
								>
									<Calendar className="size-4" />
									Date Range
									<ChevronDown className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48"
							>
								<DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
								{DATE_PRESETS.map((preset) => (
									<DropdownMenuItem
										key={preset.label}
										onClick={() => handleDatePreset(preset.days)}
									>
										{preset.label}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={clearFilters}>
									Clear Date Filter
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Sort Filter */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
								>
									<Filter className="size-4" />
									{currentSortOption?.label || "Sort"}
									<ChevronDown className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48"
							>
								<DropdownMenuLabel>Sort By</DropdownMenuLabel>
								{SORT_OPTIONS.map((option) => (
									<DropdownMenuItem
										key={option.value}
										onClick={() => handleSortChange(option.value)}
									>
										{option.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Active Filters Display */}
				{hasActiveFilters && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>Filters:</span>
						{filters.date_from && (
							<span className="px-2 py-1 bg-muted rounded text-xs">
								From: {format(new Date(filters.date_from), "MMM d, yyyy")}
							</span>
						)}
						{filters.date_to && (
							<span className="px-2 py-1 bg-muted rounded text-xs">
								To: {format(new Date(filters.date_to), "MMM d, yyyy")}
							</span>
						)}
						{filters.member_id && (
							<span className="px-2 py-1 bg-muted rounded text-xs">
								Member: {filters.member_id}
							</span>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={clearFilters}
							className="h-6 px-2 text-xs"
						>
							Clear All
						</Button>
					</div>
				)}
			</CardHeader>

			<CardContent>
				{/* Standups List */}
				<div className="space-y-4">
					{standups.length === 0 && !isLoading ? (
						<div className="text-center py-8 text-muted-foreground">
							<User className="size-8 mx-auto mb-2 opacity-50" />
							<p>No standups found</p>
							{hasActiveFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="mt-2"
								>
									Clear filters to see all standups
								</Button>
							)}
						</div>
					) : (
						standups.map((standup) => (
							<StandupCard
								key={standup.id}
								standup={standup}
							/>
						))
					)}

					{/* Loading State */}
					{isLoading && (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					)}

					{/* Load More Button */}
					{hasMore && !isLoading && (
						<div className="flex justify-center pt-4">
							<Button
								variant="outline"
								onClick={() => loadStandups(false)}
								disabled={isLoading}
							>
								Load More
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
