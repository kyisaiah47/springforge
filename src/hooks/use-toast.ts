"use client";

import { useState, useCallback } from "react";

export interface Toast {
	id: string;
	title?: string;
	description?: string;
	variant?: "default" | "destructive";
}

// Simple toast implementation for demo purposes
// In a production app, you'd want a more sophisticated toast system
export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback(
		({ title, description, variant = "default" }: Omit<Toast, "id">) => {
			const id = Math.random().toString(36).substr(2, 9);
			const newToast: Toast = { id, title, description, variant };

			setToasts((prev) => [...prev, newToast]);

			// Auto-remove toast after 5 seconds
			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== id));
			}, 5000);

			return id;
		},
		[]
	);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return {
		toast,
		dismiss,
		toasts,
	};
}
