"use client";

import React, { createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

type ToastContextType = ReturnType<typeof useToast>;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const toastMethods = useToast();

	return (
		<ToastContext.Provider value={toastMethods}>
			{children}
			<ToastContainer
				toasts={toastMethods.toasts}
				onDismiss={toastMethods.dismiss}
			/>
		</ToastContext.Provider>
	);
}

export function useToastContext() {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error("useToastContext must be used within a ToastProvider");
	}
	return context;
}
