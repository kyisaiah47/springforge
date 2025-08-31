"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Retro {
	id: string;
	title: string;
	sprint?: string;
	status: "planning" | "active" | "voting" | "completed" | "archived";
	created_at: string;
	created_by: string;
}

interface CreateRetroData {
	title: string;
	sprint?: string;
}

export default function RetroPage() {
	const [retros, setRetros] = useState<Retro[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const router = useRouter();

	useEffect(() => {
		loadRetros();
	}, []);

	const loadRetros = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/retro");
			if (!response.ok) {
				throw new Error("Failed to fetch retros");
			}
			const data = await response.json();
			setRetros(data.retros || []);
		} catch (error) {
			console.error("Error loading retros:", error);
			toast.error("Failed to load retrospectives");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateRetro = async () => {
		const title = prompt("Enter retrospective title:");
		if (!title) return;

		const sprint = prompt("Enter sprint name (optional):");
		
		try {
			setIsCreating(true);
			const createData: CreateRetroData = { title };
			if (sprint) createData.sprint = sprint;

			const response = await fetch("/api/retro", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(createData),
			});

			if (!response.ok) {
				throw new Error("Failed to create retrospective");
			}

			const newRetro = await response.json();
			setRetros((prev) => [newRetro, ...prev]);
			toast.success("Retrospective created successfully!");
			
			// Navigate to the new retro
			router.push(`/retro/${newRetro.id}`);
		} catch (error) {
			console.error("Error creating retro:", error);
			toast.error("Failed to create retrospective");
		} finally {
			setIsCreating(false);
		}
	};

	const handleViewDemo = () => {
		router.push("/retro/demo");
	};

	const handleRefresh = async () => {
		await loadRetros();
		toast.success("Retrospectives refreshed");
	};

	if (isLoading) {
		return (
			<div className="p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-2">Retro Arena</h1>
					<p className="text-muted-foreground">
						Loading retrospectives...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-2">Retro Arena</h1>
					<p className="text-muted-foreground">
						Collaborative team retrospectives with sticky notes and voting
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleRefresh}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
					<Button onClick={handleCreateRetro} disabled={isCreating}>
						<Plus className="mr-2 h-4 w-4" />
						Create Retro
					</Button>
				</div>
			</div>

			{retros.length === 0 ? (
				<EmptyState
					icon={<MessageSquare className="size-8 text-purple-600" />}
					title="No Retrospectives Yet"
					description="Create your first retrospective board to gather team feedback and improve your sprint process."
					action={{
						label: "Create Retrospective",
						onClick: handleCreateRetro,
						disabled: isCreating,
					}}
					secondaryAction={{
						label: "View Demo Data",
						onClick: handleViewDemo,
						variant: "outline",
					}}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{retros.map((retro) => (
						<div
							key={retro.id}
							className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
							onClick={() => router.push(`/retro/${retro.id}`)}
						>
							<div className="flex items-center justify-between mb-2">
								<h3 className="font-semibold">{retro.title}</h3>
								<span
									className={`px-2 py-1 text-xs rounded-md ${
										retro.status === "active"
											? "bg-green-100 text-green-800"
											: retro.status === "completed"
											? "bg-blue-100 text-blue-800"
											: "bg-gray-100 text-gray-800"
									}`}
								>
									{retro.status}
								</span>
							</div>
							{retro.sprint && (
								<p className="text-sm text-muted-foreground mb-2">
									Sprint: {retro.sprint}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Created {new Date(retro.created_at).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
