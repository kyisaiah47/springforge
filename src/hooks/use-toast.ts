"use client";

import { useState, useCallback } from "react";
import type { Toast } from "@/components/ui/toast";

// Enhanced toast hook with better error handling and retry functionality
export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback(
		({
			title,
			description,
			variant = "default",
			action,
			duration = 5000,
		}: Omit<Toast, "id">) => {
			const id = Math.random().toString(36).substr(2, 9);
			const newToast: Toast = {
				id,
				title,
				description,
				variant,
				action,
				duration,
			};

			setToasts((prev) => [...prev, newToast]);

			return id;
		},
		[]
	);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const dismissAll = useCallback(() => {
		setToasts([]);
	}, []);

	// Helper methods for common toast types
	const success = useCallback(
		(title: string, description?: string) => {
			return toast({ title, description, variant: "success" });
		},
		[toast]
	);

	const error = useCallback(
		(title: string, description?: string, retryAction?: () => void) => {
			return toast({
				title,
				description,
				variant: "error",
				action: retryAction
					? {
							label: "Retry",
							onClick: retryAction,
					  }
					: undefined,
				duration: 0, // Don't auto-dismiss error toasts
			});
		},
		[toast]
	);

	const warning = useCallback(
		(title: string, description?: string) => {
			return toast({ title, description, variant: "warning" });
		},
		[toast]
	);

	const info = useCallback(
		(title: string, description?: string) => {
			return toast({ title, description, variant: "info" });
		},
		[toast]
	);

	// Helper for API errors with retry functionality
	const apiError = useCallback(
		(error: any, retryAction?: () => void, customMessage?: string) => {
			const title = customMessage || "Request Failed";
			let description = "An unexpected error occurred";

			// Parse API error response
			if (error?.error?.message) {
				description = error.error.message;
			} else if (error?.message) {
				description = error.message;
			} else if (typeof error === "string") {
				description = error;
			}

			return toast({
				title,
				description,
				variant: "error",
				action: retryAction
					? {
							label: "Retry",
							onClick: retryAction,
					  }
					: undefined,
				duration: 0,
			});
		},
		[toast]
	);

	return {
		toast,
		dismiss,
		dismissAll,
		toasts,
		success,
		error,
		warning,
		info,
		apiError,
	};
}
