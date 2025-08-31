"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
	children: ReactNode;
}

// CSS-based Linear-style transitions
export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const [isAnimating, setIsAnimating] = useState(false);
	const [displayChildren, setDisplayChildren] = useState(children);

	useEffect(() => {
		setIsAnimating(true);
		const timeout = setTimeout(() => {
			setDisplayChildren(children);
			setIsAnimating(false);
		}, 150);

		return () => clearTimeout(timeout);
	}, [pathname, children]);

	return (
		<div 
			className={cn(
				"min-h-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
				isAnimating ? "opacity-0 translate-y-2 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"
			)}
		>
			{displayChildren}
		</div>
	);
}

// Utility classes for Linear-style animations
export const linearAnimations = {
	// Page transitions
	pageEnter: "animate-in fade-in-0 slide-in-from-bottom-4 duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
	pageExit: "animate-out fade-out-0 slide-out-to-top-4 duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
	
	// Card hover effects
	cardHover: "transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-[1.02] hover:shadow-lg",
	
	// Button interactions
	buttonHover: "transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]",
	
	// Modal/Dialog slide up
	modalSlideUp: "animate-in slide-in-from-bottom-16 fade-in-0 duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
	
	// Staggered list items
	listItem: "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
	
	// Loading states
	skeleton: "animate-pulse",
	
	// Smooth fade in
	fadeIn: "animate-in fade-in-0 duration-400 ease-out",
	
	// Scale on tap/click
	scaleOnTap: "active:scale-[0.95] transition-transform duration-100 ease-out",
};

// Stagger delay utilities
export const getStaggerDelay = (index: number, baseDelay = 50) => ({
	style: { animationDelay: `${index * baseDelay}ms` }
});

// Raycast-style quick animations
export const raycastAnimations = {
	// Quick scale hover
	quickHover: "transition-transform duration-150 ease-out hover:scale-[1.05] active:scale-[0.95]",
	
	// Smooth list item hover
	listItemHover: "transition-all duration-150 ease-out hover:bg-accent/50 hover:translate-x-1",
	
	// Command palette item
	commandItem: "transition-all duration-150 ease-out hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
	
	// Icon bounce
	iconBounce: "transition-transform duration-200 ease-out hover:scale-110 active:scale-95",
};

// Smooth loading component
export function SmoothLoading({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center justify-center p-8", className)}>
			<div className="flex space-x-1">
				<div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
				<div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
				<div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
			</div>
		</div>
	);
}