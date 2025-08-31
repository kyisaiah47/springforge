"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
// Card components not needed for this implementation
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	CheckCircle,
	Users,
	GitPullRequest,
	MessageSquare,
	Gamepad2,
	ArrowRight,
	Sparkles,
	Database,
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	completed: boolean;
}

interface OnboardingFlowProps {
	isOpen: boolean;
	onClose: () => void;
	onComplete: () => void;
}

export function OnboardingFlow({
	isOpen,
	onClose,
	onComplete,
}: OnboardingFlowProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isSeeding, setIsSeeding] = useState(false);

	const steps: OnboardingStep[] = [
		{
			id: "welcome",
			title: "Welcome to Orbit",
			description:
				"Your all-in-one developer productivity suite is ready to streamline your team's workflow.",
			icon: Sparkles,
			completed: false,
		},
		{
			id: "modules",
			title: "Explore the Modules",
			description:
				"Orbit includes four powerful modules to enhance your development process.",
			icon: Users,
			completed: false,
		},
		{
			id: "demo-data",
			title: "Load Demo Data",
			description:
				"Get started quickly with realistic demo data to explore all features.",
			icon: Database,
			completed: false,
		},
	];

	const modules = [
		{
			title: "AutoStand",
			description: "Automated daily standups from GitHub activity",
			icon: Users,
			color: "text-blue-600",
		},
		{
			title: "PR Radar",
			description: "Pull request insights and scoring",
			icon: GitPullRequest,
			color: "text-green-600",
		},
		{
			title: "Retro Arena",
			description: "Collaborative team retrospectives",
			icon: MessageSquare,
			color: "text-purple-600",
		},
		{
			title: "Debug Arcade",
			description: "Coding challenges and skill development",
			icon: Gamepad2,
			color: "text-orange-600",
		},
	];

	const handleSeedDemoData = async () => {
		setIsSeeding(true);
		try {
			const response = await fetch("/api/onboarding/seed-demo", {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Failed to seed demo data");
			}

			toast.success("Demo data loaded successfully!");
			setCurrentStep(currentStep + 1);
		} catch (error) {
			console.error("Failed to seed demo data:", error);
			toast.error("Failed to load demo data. You can try again later.");
		} finally {
			setIsSeeding(false);
		}
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onComplete();
			onClose();
		}
	};

	const handleSkip = () => {
		onComplete();
		onClose();
	};

	const renderStepContent = () => {
		switch (steps[currentStep].id) {
			case "welcome":
				return (
					<div className="text-center space-y-4">
						<div className="flex justify-center">
							<Sparkles className="h-16 w-16 text-blue-600" />
						</div>
						<div>
							<h3 className="text-xl font-semibold mb-2">
								Welcome to Orbit!
							</h3>
							<p className="text-muted-foreground">
								Orbit is designed to streamline your development workflow
								with automated standups, PR insights, team retrospectives, and
								coding challenges.
							</p>
						</div>
					</div>
				);

			case "modules":
				return (
					<div className="space-y-4">
						<div className="text-center mb-6">
							<h3 className="text-xl font-semibold mb-2">
								Four Powerful Modules
							</h3>
							<p className="text-muted-foreground">
								Each module is designed to solve specific developer productivity
								challenges.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4">
							{modules.map((module) => (
								<div
									key={module.title}
									className="p-4 border rounded-lg"
								>
									<div className="flex items-center gap-3 mb-2">
										<module.icon className={`h-5 w-5 ${module.color}`} />
										<h4 className="font-medium">{module.title}</h4>
									</div>
									<p className="text-sm text-muted-foreground">
										{module.description}
									</p>
								</div>
							))}
						</div>
					</div>
				);

			case "demo-data":
				return (
					<div className="text-center space-y-4">
						<div className="flex justify-center">
							<Database className="h-16 w-16 text-green-600" />
						</div>
						<div>
							<h3 className="text-xl font-semibold mb-2">Load Demo Data</h3>
							<p className="text-muted-foreground mb-4">
								We&apos;ll create a demo organization with sample data so you
								can explore all features immediately.
							</p>
							<div className="bg-muted p-4 rounded-lg text-sm">
								<p className="font-medium mb-2">Demo data includes:</p>
								<ul className="text-left space-y-1">
									<li>• Sample team members and GitHub activity</li>
									<li>• Pull request insights and scoring examples</li>
									<li>• Retrospective board with notes and votes</li>
									<li>• Coding challenges ready to solve</li>
								</ul>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={onClose}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span>Getting Started</span>
						<span className="text-sm font-normal text-muted-foreground">
							({currentStep + 1} of {steps.length})
						</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Progress indicator */}
					<div className="flex items-center gap-2">
						{steps.map((step, index) => (
							<div
								key={step.id}
								className="flex items-center"
							>
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
										index <= currentStep
											? "bg-blue-600 text-white"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{index < currentStep ? (
										<CheckCircle className="h-4 w-4" />
									) : (
										index + 1
									)}
								</div>
								{index < steps.length - 1 && (
									<div
										className={`w-8 h-0.5 mx-2 ${
											index < currentStep ? "bg-blue-600" : "bg-muted"
										}`}
									/>
								)}
							</div>
						))}
					</div>

					{/* Step content */}
					<div className="min-h-[300px]">{renderStepContent()}</div>

					{/* Actions */}
					<div className="flex justify-between">
						<Button
							variant="outline"
							onClick={handleSkip}
						>
							Skip Setup
						</Button>
						<div className="flex gap-2">
							{steps[currentStep].id === "demo-data" ? (
								<Button
									onClick={handleSeedDemoData}
									disabled={isSeeding}
								>
									{isSeeding ? "Loading..." : "Load Demo Data"}
								</Button>
							) : (
								<Button onClick={handleNext}>
									{currentStep === steps.length - 1 ? "Get Started" : "Next"}
									<ArrowRight className="h-4 w-4 ml-2" />
								</Button>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
