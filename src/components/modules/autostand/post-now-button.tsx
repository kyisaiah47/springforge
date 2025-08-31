"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linearAnimations } from "@/components/page-transition";

interface PostNowButtonProps {
	onGenerate: () => Promise<void>;
	disabled?: boolean;
	className?: string;
}

export function PostNowButton({
	onGenerate,
	disabled,
	className,
}: PostNowButtonProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const handleClick = async () => {
		if (isGenerating || disabled) return;

		setIsGenerating(true);
		try {
			await onGenerate();
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Button
			onClick={handleClick}
			disabled={disabled || isGenerating}
			className={`${className} ${linearAnimations.buttonHover}`}
			size="sm"
		>
			{isGenerating ? (
				<>
					<Loader2 className="size-4 animate-spin mr-2" />
					Generating...
				</>
			) : (
				<>
					<Send className="size-4 mr-2" />
					Generate Standup
				</>
			)}
		</Button>
	);
}
