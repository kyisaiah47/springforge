"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface Toast {
	id: string;
	title?: string;
	description?: string;
	variant?: "default" | "success" | "error" | "warning" | "info";
	action?: {
		label: string;
		onClick: () => void;
	};
	duration?: number;
}

interface ToastProps {
	toast: Toast;
	onDismiss: (id: string) => void;
}

const variantStyles = {
	default: "bg-background border-border text-foreground",
	success:
		"bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400",
	error:
		"bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400",
	warning:
		"bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-400",
	info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-400",
};

const iconMap = {
	default: Info,
	success: CheckCircle,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info,
};

export function ToastComponent({ toast, onDismiss }: ToastProps) {
	const Icon = iconMap[toast.variant || "default"];

	React.useEffect(() => {
		if (toast.duration !== 0) {
			const timer = setTimeout(() => {
				onDismiss(toast.id);
			}, toast.duration || 5000);

			return () => clearTimeout(timer);
		}
	}, [toast.id, toast.duration, onDismiss]);

	return (
		<div
			className={cn(
				"pointer-events-auto relative flex w-full items-start space-x-3 rounded-lg border p-4 shadow-lg transition-all",
				variantStyles[toast.variant || "default"]
			)}
		>
			<Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />

			<div className="flex-1 min-w-0">
				{toast.title && (
					<div className="text-sm font-semibold">{toast.title}</div>
				)}
				{toast.description && (
					<div className="text-sm opacity-90 mt-1">{toast.description}</div>
				)}
				{toast.action && (
					<div className="mt-3">
						<Button
							variant="outline"
							size="sm"
							onClick={toast.action.onClick}
							className="h-8 text-xs"
						>
							{toast.action.label}
						</Button>
					</div>
				)}
			</div>

			<Button
				variant="ghost"
				size="sm"
				className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
				onClick={() => onDismiss(toast.id)}
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
}

export function ToastContainer({
	toasts,
	onDismiss,
}: {
	toasts: Toast[];
	onDismiss: (id: string) => void;
}) {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 w-full max-w-sm pointer-events-none">
			{toasts.map((toast) => (
				<ToastComponent
					key={toast.id}
					toast={toast}
					onDismiss={onDismiss}
				/>
			))}
		</div>
	);
}
