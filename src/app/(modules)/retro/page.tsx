"use client";

import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

export default function RetroPage() {
	const handleCreateRetro = () => {
		toast.info("Retro creation coming soon! For now, check out the demo data.");
	};

	const handleViewDemo = () => {
		toast.info(
			"Demo retro data available! Load demo data from the dashboard to explore."
		);
	};

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight mb-2">Retro Arena</h1>
				<p className="text-muted-foreground">
					Collaborative team retrospectives with sticky notes and voting
				</p>
			</div>

			<EmptyState
				icon={<MessageSquare className="size-8 text-purple-600" />}
				title="No Retrospectives Yet"
				description="Create your first retrospective board to gather team feedback and improve your sprint process."
				action={{
					label: "Create Retrospective",
					onClick: handleCreateRetro,
				}}
				secondaryAction={{
					label: "View Demo Data",
					onClick: handleViewDemo,
					variant: "outline",
				}}
			/>
		</div>
	);
}
