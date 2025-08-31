"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";

interface OnboardingState {
	hasCompletedOnboarding: boolean;
	showOnboardingFlow: boolean;
	showGuidedTour: boolean;
	hasSeededDemoData: boolean;
}

interface OnboardingContextType extends OnboardingState {
	completeOnboarding: () => void;
	startOnboardingFlow: () => void;
	startGuidedTour: () => void;
	closeOnboardingFlow: () => void;
	closeGuidedTour: () => void;
	markDemoDataSeeded: () => void;
	resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
	undefined
);

const ONBOARDING_STORAGE_KEY = "sprintforge-onboarding";

interface OnboardingProviderProps {
	children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
	const [state, setState] = useState<OnboardingState>({
		hasCompletedOnboarding: false,
		showOnboardingFlow: false,
		showGuidedTour: false,
		hasSeededDemoData: false,
	});

	// Load onboarding state from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
		if (stored) {
			try {
				const parsedState = JSON.parse(stored);
				setState((prev) => ({ ...prev, ...parsedState }));
			} catch (error) {
				console.error("Failed to parse onboarding state:", error);
			}
		} else {
			// First time user - show onboarding flow
			setState((prev) => ({ ...prev, showOnboardingFlow: true }));
		}
	}, []);

	// Save state to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
	}, [state]);

	const completeOnboarding = () => {
		setState((prev) => ({
			...prev,
			hasCompletedOnboarding: true,
			showOnboardingFlow: false,
		}));
	};

	const startOnboardingFlow = () => {
		setState((prev) => ({ ...prev, showOnboardingFlow: true }));
	};

	const startGuidedTour = () => {
		setState((prev) => ({ ...prev, showGuidedTour: true }));
	};

	const closeOnboardingFlow = () => {
		setState((prev) => ({ ...prev, showOnboardingFlow: false }));
	};

	const closeGuidedTour = () => {
		setState((prev) => ({ ...prev, showGuidedTour: false }));
	};

	const markDemoDataSeeded = () => {
		setState((prev) => ({ ...prev, hasSeededDemoData: true }));
	};

	const resetOnboarding = () => {
		setState({
			hasCompletedOnboarding: false,
			showOnboardingFlow: true,
			showGuidedTour: false,
			hasSeededDemoData: false,
		});
	};

	const value: OnboardingContextType = {
		...state,
		completeOnboarding,
		startOnboardingFlow,
		startGuidedTour,
		closeOnboardingFlow,
		closeGuidedTour,
		markDemoDataSeeded,
		resetOnboarding,
	};

	return (
		<OnboardingContext.Provider value={value}>
			{children}
		</OnboardingContext.Provider>
	);
}

export function useOnboarding() {
	const context = useContext(OnboardingContext);
	if (context === undefined) {
		throw new Error("useOnboarding must be used within an OnboardingProvider");
	}
	return context;
}
