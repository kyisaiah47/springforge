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
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="relative">
					<div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-purple-500"></div>
					<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-purple-500/20 to-transparent animate-pulse"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
			
			<div className="relative z-10 p-6 space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between py-6">
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<div className="relative">
								<div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
								<div className="absolute inset-0 w-3 h-3 bg-purple-500/30 rounded-full animate-ping"></div>
							</div>
							<h1 className="text-4xl md:text-5xl font-light tracking-tight">
								Retro <span className="font-medium">Arena</span>
							</h1>
						</div>
						<p className="text-lg text-muted-foreground max-w-2xl">
							Gamify your retrospectives with interactive boards, voting, and team insights. 
							Transform feedback sessions into engaging collaborative experiences.
						</p>
					</div>
					<div className="flex gap-3">
						<Button variant="outline" onClick={handleRefresh} className="rounded-xl">
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>
						<Button onClick={() => setShowCreateDialog(true)} disabled={isCreating} className="rounded-xl">
							<Plus className="mr-2 h-4 w-4" />
							Create Retro
						</Button>
					</div>
				</div>

				{/* Main Content */}
				<div className="space-y-6">
					{retros.length === 0 ? (
						<div className="text-center py-16">
							<div className="relative mx-auto w-16 h-16 mb-6">
								<div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-xl border border-border/50 flex items-center justify-center">
									<MessageSquare className="h-8 w-8 text-purple-600" />
								</div>
							</div>
							<h3 className="text-xl font-medium mb-2">No Retrospectives Yet</h3>
							<p className="text-muted-foreground max-w-md mx-auto mb-6">
								Create your first retrospective board to gather team feedback and improve your sprint process.
							</p>
							<div className="flex items-center justify-center gap-3">
								<Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
									<Plus className="mr-2 h-4 w-4" />
									Create Retrospective
								</Button>
								<Button variant="outline" onClick={handleViewDemo} className="rounded-xl">
									View Demo
								</Button>
							</div>
						</div>
					) : (
						<>
							<div className="flex items-center justify-between">
								<h2 className="text-2xl font-medium tracking-tight">Your Retrospectives</h2>
								<div className="text-sm text-muted-foreground">
									{retros.length} retrospective{retros.length !== 1 ? 's' : ''}
								</div>
							</div>
							
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{retros.map((retro, index) => (
									<div
										key={retro.id}
										className="group cursor-pointer"
										onClick={() => router.push(`/retro/${retro.id}`)}
										{...getStaggerDelay(index)}
									>
										<div className="border border-border/50 bg-card/50 backdrop-blur-sm rounded-xl p-6 hover:bg-card/70 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-primary/5">
											<div className="flex items-start justify-between mb-4">
												<div className="relative">
													<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
														<MessageSquare className="h-6 w-6 text-purple-600" />
													</div>
													<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
												</div>
												<div className={`text-xs px-2 py-1 rounded-full font-medium ${
													retro.status === "active"
														? "bg-green-500/20 text-green-600 border border-green-500/30"
														: retro.status === "completed"
														? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
														: "bg-muted/50 text-muted-foreground border border-border/30"
												}`}>
													{retro.status}
												</div>
											</div>
											
											<div className="space-y-3">
												<h3 className="font-medium text-lg group-hover:text-foreground/90 transition-colors">
													{retro.title}
												</h3>
												
												{retro.sprint && (
													<div className="text-sm text-muted-foreground">
														<span className="text-xs bg-muted/50 px-2 py-1 rounded-full mr-2">Sprint</span>
														{retro.sprint}
													</div>
												)}
												
												<div className="flex items-center justify-between pt-2 border-t border-border/30">
													<div className="text-xs text-muted-foreground">
														{new Date(retro.created_at).toLocaleDateString()}
													</div>
													<div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
														Open →
													</div>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>
				
			{/* Close the main container */}
			</div>

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