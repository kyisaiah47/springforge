"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	Download,
	FileText,
	ExternalLink,
	Loader2,
	AlertCircle,
	CheckCircle2,
	Copy,
	Merge,
} from "lucide-react";
import { toast } from "sonner";

interface ExportDialogProps {
	retroId: string;
	retroTitle: string;
	children?: React.ReactNode;
}

interface ExportOptions {
	includeVotes: boolean;
	includeAuthor: boolean;
	includeTimestamps: boolean;
	groupByColumn: boolean;
}

interface NotionOptions {
	pageId?: string;
	databaseId?: string;
	token?: string;
}

export function ExportDialog({
	retroId,
	retroTitle,
	children,
}: ExportDialogProps) {
	const [open, setOpen] = useState(false);
	const [format, setFormat] = useState<"markdown" | "notion">("markdown");
	const [loading, setLoading] = useState(false);
	const [exportOptions, setExportOptions] = useState<ExportOptions>({
		includeVotes: true,
		includeAuthor: false,
		includeTimestamps: false,
		groupByColumn: true,
	});
	const [notionOptions, setNotionOptions] = useState<NotionOptions>({});
	const [exportResult, setExportResult] = useState<{
		content?: string;
		filename?: string;
		pageUrl?: string;
	} | null>(null);

	const handleExport = async () => {
		setLoading(true);
		setExportResult(null);

		try {
			const response = await fetch(`/api/retro/${retroId}/export`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					format,
					options: exportOptions,
					notionOptions: format === "notion" ? notionOptions : undefined,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message || "Export failed");
			}

			const result = await response.json();
			setExportResult(result);

			if (format === "markdown") {
				toast.success("Retro exported to Markdown successfully!");
			} else {
				toast.success("Retro exported to Notion successfully!");
			}
		} catch (err) {
			console.error("Export error:", err);
			toast.error(err instanceof Error ? err.message : "Export failed");
		} finally {
			setLoading(false);
		}
	};

	const downloadMarkdown = () => {
		if (!exportResult?.content || !exportResult?.filename) return;

		const blob = new Blob([exportResult.content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = exportResult.filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const copyToClipboard = async () => {
		if (!exportResult?.content) return;

		try {
			await navigator.clipboard.writeText(exportResult.content);
			toast.success("Copied to clipboard!");
		} catch (error) {
			toast.error("Failed to copy to clipboard");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				{children || (
					<Button
						variant="outline"
						size="sm"
					>
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Export Retro</DialogTitle>
					<DialogDescription>
						Export &quot;{retroTitle}&quot; to Markdown or Notion
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Format Selection */}
					<div className="space-y-3">
						<Label className="text-sm font-medium">Export Format</Label>
						<RadioGroup
							value={format}
							onValueChange={(value) =>
								setFormat(value as "markdown" | "notion")
							}
							className="flex gap-6"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="markdown"
									id="markdown"
								/>
								<Label
									htmlFor="markdown"
									className="flex items-center gap-2"
								>
									<FileText className="h-4 w-4" />
									Markdown
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="notion"
									id="notion"
								/>
								<Label
									htmlFor="notion"
									className="flex items-center gap-2"
								>
									<ExternalLink className="h-4 w-4" />
									Notion
									<Badge
										variant="secondary"
										className="text-xs"
									>
										Feature Flag
									</Badge>
								</Label>
							</div>
						</RadioGroup>
					</div>

					<Separator />

					{/* Export Options */}
					<div className="space-y-4">
						<Label className="text-sm font-medium">Export Options</Label>
						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="includeVotes"
									checked={exportOptions.includeVotes}
									onCheckedChange={(checked) =>
										setExportOptions((prev) => ({
											...prev,
											includeVotes: !!checked,
										}))
									}
								/>
								<Label
									htmlFor="includeVotes"
									className="text-sm"
								>
									Include vote counts
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="includeAuthor"
									checked={exportOptions.includeAuthor}
									onCheckedChange={(checked) =>
										setExportOptions((prev) => ({
											...prev,
											includeAuthor: !!checked,
										}))
									}
								/>
								<Label
									htmlFor="includeAuthor"
									className="text-sm"
								>
									Include authors
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="includeTimestamps"
									checked={exportOptions.includeTimestamps}
									onCheckedChange={(checked) =>
										setExportOptions((prev) => ({
											...prev,
											includeTimestamps: !!checked,
										}))
									}
								/>
								<Label
									htmlFor="includeTimestamps"
									className="text-sm"
								>
									Include timestamps
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="groupByColumn"
									checked={exportOptions.groupByColumn}
									onCheckedChange={(checked) =>
										setExportOptions((prev) => ({
											...prev,
											groupByColumn: !!checked,
										}))
									}
								/>
								<Label
									htmlFor="groupByColumn"
									className="text-sm"
								>
									Group by column
								</Label>
							</div>
						</div>
					</div>

					{/* Notion-specific options */}
					{format === "notion" && (
						<>
							<Separator />
							<div className="space-y-4">
								<Label className="text-sm font-medium">Notion Options</Label>
								<div className="space-y-3">
									<div>
										<Label
											htmlFor="notionToken"
											className="text-sm"
										>
											Notion Integration Token
										</Label>
										<Input
											id="notionToken"
											type="password"
											placeholder="secret_..."
											value={notionOptions.token || ""}
											onChange={(e) =>
												setNotionOptions((prev) => ({
													...prev,
													token: e.target.value,
												}))
											}
										/>
									</div>
									<div>
										<Label
											htmlFor="pageId"
											className="text-sm"
										>
											Page ID (optional)
										</Label>
										<Input
											id="pageId"
											placeholder="Page ID to append to"
											value={notionOptions.pageId || ""}
											onChange={(e) =>
												setNotionOptions((prev) => ({
													...prev,
													pageId: e.target.value,
												}))
											}
										/>
									</div>
								</div>
							</div>
						</>
					)}

					{/* Export Result */}
					{exportResult && (
						<>
							<Separator />
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									<Label className="text-sm font-medium">Export Complete</Label>
								</div>

								{format === "markdown" && exportResult.content && (
									<div className="space-y-2">
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={downloadMarkdown}
												className="flex-1"
											>
												<Download className="h-4 w-4 mr-2" />
												Download File
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={copyToClipboard}
												className="flex-1"
											>
												<Copy className="h-4 w-4 mr-2" />
												Copy Content
											</Button>
										</div>
										<div className="text-xs text-muted-foreground">
											Filename: {exportResult.filename}
										</div>
									</div>
								)}

								{format === "notion" && exportResult.pageUrl && (
									<div className="space-y-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												window.open(exportResult.pageUrl, "_blank")
											}
											className="w-full"
										>
											<ExternalLink className="h-4 w-4 mr-2" />
											Open in Notion
										</Button>
										<div className="text-xs text-muted-foreground">
											Page URL: {exportResult.pageUrl}
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Close
					</Button>
					<Button
						onClick={handleExport}
						disabled={loading}
					>
						{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						Export
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Duplicate Merge Dialog Component
interface MergeDuplicatesDialogProps {
	retroId: string;
	onMergeComplete?: () => void;
	children?: React.ReactNode;
}

interface PreviewResult {
	dryRun: boolean;
	originalCount: number;
	mergedCount: number;
	duplicateGroups: Array<{
		count: number;
		notes: Array<{
			id: string;
			text: string;
			votes: number;
			column_key: string;
		}>;
	}>;
}

interface MergeResult {
	dryRun: boolean;
	originalCount: number;
	mergedCount: number;
	mergeOperations: number;
}

export function MergeDuplicatesDialog({
	retroId,
	onMergeComplete,
	children,
}: MergeDuplicatesDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [similarityThreshold, setSimilarityThreshold] = useState(0.8);
	const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
		null
	);
	const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

	const handlePreview = async () => {
		setLoading(true);
		setPreviewResult(null);

		try {
			const response = await fetch(`/api/retro/${retroId}/merge-duplicates`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					similarityThreshold,
					dryRun: true,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message || "Preview failed");
			}

			const result = await response.json();
			setPreviewResult(result);
		} catch (err) {
			console.error("Preview error:", err);
			toast.error(err instanceof Error ? err.message : "Preview failed");
		} finally {
			setLoading(false);
		}
	};

	const handleMerge = async () => {
		setLoading(true);
		setMergeResult(null);

		try {
			const response = await fetch(`/api/retro/${retroId}/merge-duplicates`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					similarityThreshold,
					dryRun: false,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message || "Merge failed");
			}

			const result = await response.json();
			setMergeResult(result);
			toast.success(`Merged ${result.mergeOperations} duplicate groups!`);
			onMergeComplete?.();
		} catch (err) {
			console.error("Merge error:", err);
			toast.error(err instanceof Error ? err.message : "Merge failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				{children || (
					<Button
						variant="outline"
						size="sm"
					>
						<Merge className="h-4 w-4 mr-2" />
						Merge Duplicates
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Merge Duplicate Notes</DialogTitle>
					<DialogDescription>
						Find and merge similar notes to reduce clutter in your retro
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="space-y-3">
						<Label
							htmlFor="threshold"
							className="text-sm font-medium"
						>
							Similarity Threshold: {Math.round(similarityThreshold * 100)}%
						</Label>
						<input
							id="threshold"
							type="range"
							min="0.5"
							max="1"
							step="0.05"
							value={similarityThreshold}
							onChange={(e) =>
								setSimilarityThreshold(parseFloat(e.target.value))
							}
							className="w-full"
						/>
						<div className="text-xs text-muted-foreground">
							Higher values require more similarity to merge notes
						</div>
					</div>

					{previewResult && (
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-blue-600" />
								<Label className="text-sm font-medium">Preview Results</Label>
							</div>
							<div className="bg-muted p-3 rounded-lg space-y-2">
								<div className="text-sm">
									<strong>Original notes:</strong> {previewResult.originalCount}
								</div>
								<div className="text-sm">
									<strong>After merging:</strong> {previewResult.mergedCount}
								</div>
								<div className="text-sm">
									<strong>Duplicate groups found:</strong>{" "}
									{previewResult.duplicateGroups?.length || 0}
								</div>
							</div>

							{previewResult.duplicateGroups?.length > 0 && (
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Duplicate Groups:
									</Label>
									<div className="max-h-40 overflow-y-auto space-y-2">
										{previewResult.duplicateGroups.map(
											(group, index: number) => (
												<div
													key={index}
													className="bg-muted p-2 rounded text-xs"
												>
													<div className="font-medium mb-1">
														Group {index + 1} ({group.count} notes):
													</div>
													{group.notes.map((note, noteIndex: number) => (
														<div
															key={noteIndex}
															className="text-muted-foreground"
														>
															• {note.text.substring(0, 50)}...
														</div>
													))}
												</div>
											)
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{mergeResult && (
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600" />
								<Label className="text-sm font-medium">Merge Complete</Label>
							</div>
							<div className="bg-green-50 p-3 rounded-lg space-y-2">
								<div className="text-sm">
									Successfully merged {mergeResult.mergeOperations} duplicate
									groups
								</div>
								<div className="text-sm">
									Reduced from {mergeResult.originalCount} to{" "}
									{mergeResult.mergedCount} notes
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Close
					</Button>
					{!mergeResult && (
						<>
							<Button
								variant="outline"
								onClick={handlePreview}
								disabled={loading}
							>
								{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
								Preview
							</Button>
							<Button
								onClick={handleMerge}
								disabled={loading || !previewResult}
							>
								{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
								Merge Duplicates
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
