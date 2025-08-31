"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { linearAnimations, getStaggerDelay } from "@/components/page-transition";

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
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [formData, setFormData] = useState({ title: "", sprint: "" });
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

	const handleCreateRetro = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title.trim()) return;
		
		try {
			setIsCreating(true);
			const createData: CreateRetroData = { title: formData.title.trim() };
			if (formData.sprint.trim()) createData.sprint = formData.sprint.trim();

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
			
			// Close dialog and reset form
			setShowCreateDialog(false);
			setFormData({ title: "", sprint: "" });
			
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
					<Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
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
						onClick: () => setShowCreateDialog(true),
					}}
					secondaryAction={{
						label: "View Demo Data",
						onClick: handleViewDemo,
						variant: "outline",
					}}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{retros.map((retro, index) => (
						<div
							key={retro.id}
							className={`border rounded-lg p-4 cursor-pointer ${linearAnimations.cardHover} ${linearAnimations.listItem}`}
							onClick={() => router.push(`/retro/${retro.id}`)}
							{...getStaggerDelay(index)}
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

			{/* Create Retro Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Retrospective</DialogTitle>
						<DialogDescription>
							Set up a new retrospective session for your team.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateRetro}>
						<div className="space-y-4">
							<div>
								<Label htmlFor="title">Title *</Label>
								<Input
									id="title"
									value={formData.title}
									onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
									placeholder="Enter retrospective title"
									required
									autoFocus
								/>
							</div>
							<div>
								<Label htmlFor="sprint">Sprint Name (optional)</Label>
								<Input
									id="sprint"
									value={formData.sprint}
									onChange={(e) => setFormData(prev => ({ ...prev, sprint: e.target.value }))}
									placeholder="Sprint 1, Week 12, etc."
								/>
							</div>
						</div>
						<DialogFooter className="mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setShowCreateDialog(false);
									setFormData({ title: "", sprint: "" });
								}}
								disabled={isCreating}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isCreating || !formData.title.trim()}>
								{isCreating ? "Creating..." : "Create Retrospective"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}