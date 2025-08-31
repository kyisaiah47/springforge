"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
		variant?: "default" | "outline" | "secondary";
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
		variant?: "default" | "outline" | "secondary";
	};
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	secondaryAction,
	className,
}: EmptyStateProps) {
	return (
		<Card className={cn("border-dashed", className)}>
			<CardHeader className="pb-4">
				<div className="flex flex-col items-center text-center space-y-4">
					{icon && (
						<div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
							{icon}
						</div>
					)}
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">{title}</h3>
						<p className="text-sm text-muted-foreground max-w-sm">
							{description}
						</p>
					</div>
				</div>
			</CardHeader>
			{(action || secondaryAction) && (
				<CardContent className="pt-0">
					<div className="flex flex-col sm:flex-row gap-2 justify-center">
						{action && (
							<Button
								onClick={action.onClick}
								variant={action.variant || "default"}
							>
								{action.label}
							</Button>
						)}
						{secondaryAction && (
							<Button
								onClick={secondaryAction.onClick}
								variant={secondaryAction.variant || "outline"}
							>
								{secondaryAction.label}
							</Button>
						)}
					</div>
				</CardContent>
			)}
		</Card>
	);
}
