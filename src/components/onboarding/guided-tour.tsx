"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
// cn utility not needed for this implementation

interface TourStep {
	id: string;
	title: string;
	content: string;
	target?: string; // CSS selector for the element to highlight
	position?: "top" | "bottom" | "left" | "right";
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface GuidedTourProps {
	isOpen: boolean;
	onClose: () => void;
	steps: TourStep[];
}

export function GuidedTour({ isOpen, onClose, steps }: GuidedTourProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [, setTargetElement] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (!isOpen || !steps[currentStep]?.target) {
			setTargetElement(null);
			return;
		}

		const element = document.querySelector(
			steps[currentStep].target!
		) as HTMLElement;
		setTargetElement(element);

		if (element) {
			// Scroll element into view
			element.scrollIntoView({ behavior: "smooth", block: "center" });

			// Add highlight class
			element.classList.add("tour-highlight");

			return () => {
				element.classList.remove("tour-highlight");
			};
		}
	}, [currentStep, isOpen, steps]);

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onClose();
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSkip = () => {
		onClose();
	};

	if (!isOpen || steps.length === 0) {
		return null;
	}

	const step = steps[currentStep];
	const isLastStep = currentStep === steps.length - 1;
	const isFirstStep = currentStep === 0;

	return (
		<>
			{/* Overlay */}
			<div className="fixed inset-0 bg-black/50 z-50" />

			{/* Tour card */}
			<Card className="fixed z-50 w-80 shadow-lg">
				<CardContent className="p-4">
					<div className="flex items-start justify-between mb-3">
						<div className="flex items-center gap-2">
							<Lightbulb className="h-4 w-4 text-yellow-500" />
							<span className="text-sm font-medium">
								{currentStep + 1} of {steps.length}
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-6 w-6 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="space-y-3">
						<h3 className="font-semibold">{step.title}</h3>
						<p className="text-sm text-muted-foreground">{step.content}</p>

						{step.action && (
							<Button
								variant="outline"
								size="sm"
								onClick={step.action.onClick}
								className="w-full"
							>
								{step.action.label}
							</Button>
						)}
					</div>

					<div className="flex items-center justify-between mt-4 pt-3 border-t">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSkip}
						>
							Skip Tour
						</Button>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePrevious}
								disabled={isFirstStep}
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
							<Button
								size="sm"
								onClick={handleNext}
							>
								{isLastStep ? "Finish" : "Next"}
								{!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Highlight styles */}
			<style
				jsx
				global
			>{`
				.tour-highlight {
					position: relative;
					z-index: 51;
					box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
					border-radius: 4px;
				}
			`}</style>
		</>
	);
}

// Default tour steps for Orbit
export const defaultTourSteps: TourStep[] = [
	{
		id: "welcome",
		title: "Welcome to Orbit!",
		content:
			"Let's take a quick tour of your new developer productivity suite. This will only take a minute.",
	},
	{
		id: "navigation",
		title: "Navigation Sidebar",
		content:
			"Use the sidebar to navigate between modules. You can also use keyboard shortcuts like 'g+s' for AutoStand.",
		target: "[data-tour='sidebar']",
	},
	{
		id: "command-palette",
		title: "Command Palette",
		content:
			"Press Cmd+K (or Ctrl+K) to open the command palette for quick navigation and actions.",
		action: {
			label: "Try it now",
			onClick: () => {
				// Trigger command palette
				const event = new KeyboardEvent("keydown", {
					key: "k",
					metaKey: true,
					ctrlKey: true,
				});
				document.dispatchEvent(event);
			},
		},
	},
	{
		id: "modules",
		title: "Explore the Modules",
		content:
			"Each module card shows a different aspect of your development workflow. Click any card to explore.",
		target: "[data-tour='modules']",
	},
	{
		id: "user-menu",
		title: "User Settings",
		content:
			"Access your profile, theme settings, and organization management from the user menu.",
		target: "[data-tour='user-menu']",
	},
	{
		id: "complete",
		title: "You're All Set!",
		content:
			"That's it! You're ready to boost your team's productivity with Orbit. Explore the modules and discover what works best for your workflow.",
	},
];
