"use client";

import { useState, useEffect, useCallback } from "react";
import { retroRealtimeService } from "./realtime";
import {
	RetroWithDetails,
	RetroNoteWithAuthor,
	RetroStatus,
	RetroColumn,
	CreateRetroRequest,
	CreateRetroNoteRequest,
	UpdateRetroNoteRequest,
} from "./types";

// Hook for managing a single retro
export function useRetro(retroId: string | null) {
	const [retro, setRetro] = useState<RetroWithDetails | null>(null);
	const [notes, setNotes] = useState<RetroNoteWithAuthor[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch retro data
	const fetchRetro = useCallback(async () => {
		if (!retroId) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/retro/${retroId}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch retro: ${response.statusText}`);
			}

			const data = await response.json();
			setRetro(data);
			setNotes(data.notes || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch retro");
		} finally {
			setLoading(false);
		}
	}, [retroId]);

	// Real-time subscriptions
	useEffect(() => {
		if (!retroId) return;

		const subscriptionKey = retroRealtimeService.subscribeToRetro(retroId, {
			onNoteAdded: (note) => {
				setNotes((prev) => [...prev, note]);
			},
			onNoteUpdated: (note) => {
				setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
			},
			onNoteDeleted: (noteId) => {
				setNotes((prev) => prev.filter((n) => n.id !== noteId));
			},
			onRetroUpdated: (updatedRetro) => {
				setRetro((prev) => (prev ? { ...prev, ...updatedRetro } : null));
			},
		});

		return () => {
			retroRealtimeService.unsubscribe(subscriptionKey);
		};
	}, [retroId]);

	// Load initial data
	useEffect(() => {
		fetchRetro();
	}, [fetchRetro]);

	// Create note
	const createNote = useCallback(
		async (data: CreateRetroNoteRequest) => {
			if (!retroId) return;

			try {
				const response = await fetch(`/api/retro/${retroId}/notes`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error(`Failed to create note: ${response.statusText}`);
				}

				const note = await response.json();
				// Note will be added via real-time subscription
				return note;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to create note");
				throw err;
			}
		},
		[retroId]
	);

	// Update note
	const updateNote = useCallback(
		async (noteId: string, data: UpdateRetroNoteRequest) => {
			if (!retroId) return;

			try {
				const response = await fetch(`/api/retro/${retroId}/notes/${noteId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error(`Failed to update note: ${response.statusText}`);
				}

				const note = await response.json();
				// Note will be updated via real-time subscription
				return note;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to update note");
				throw err;
			}
		},
		[retroId]
	);

	// Delete note
	const deleteNote = useCallback(
		async (noteId: string) => {
			if (!retroId) return;

			try {
				const response = await fetch(`/api/retro/${retroId}/notes/${noteId}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					throw new Error(`Failed to delete note: ${response.statusText}`);
				}

				// Note will be removed via real-time subscription
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to delete note");
				throw err;
			}
		},
		[retroId]
	);

	// Vote on note
	const voteOnNote = useCallback(
		async (noteId: string, increment: boolean) => {
			if (!retroId) return;

			try {
				const response = await fetch(
					`/api/retro/${retroId}/notes/${noteId}/vote`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ increment }),
					}
				);

				if (!response.ok) {
					throw new Error(`Failed to vote on note: ${response.statusText}`);
				}

				const note = await response.json();
				// Note will be updated via real-time subscription
				return note;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to vote on note");
				throw err;
			}
		},
		[retroId]
	);

	// Update retro status
	const updateStatus = useCallback(
		async (status: RetroStatus) => {
			if (!retroId) return;

			try {
				const response = await fetch(`/api/retro/${retroId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status }),
				});

				if (!response.ok) {
					throw new Error(
						`Failed to update retro status: ${response.statusText}`
					);
				}

				const updatedRetro = await response.json();
				setRetro((prev) => (prev ? { ...prev, ...updatedRetro } : null));
				return updatedRetro;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to update retro status"
				);
				throw err;
			}
		},
		[retroId]
	);

	// Get notes by column
	const getNotesByColumn = useCallback(
		(column: RetroColumn) => {
			return notes
				.filter((note) => note.column_key === column)
				.sort(
					(a, b) =>
						b.votes - a.votes ||
						new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				);
		},
		[notes]
	);

	return {
		retro,
		notes,
		loading,
		error,
		createNote,
		updateNote,
		deleteNote,
		voteOnNote,
		updateStatus,
		getNotesByColumn,
		refetch: fetchRetro,
	};
}

// Hook for managing retros list
export function useRetros(
	options: {
		status?: RetroStatus;
		createdBy?: string;
		limit?: number;
	} = {}
) {
	const [retros, setRetros] = useState<RetroWithDetails[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [cursor, setCursor] = useState<string | undefined>();

	// Fetch retros
	const fetchRetros = useCallback(
		async (reset = false) => {
			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams();
				if (options.status) params.set("status", options.status);
				if (options.createdBy) params.set("created_by", options.createdBy);
				if (options.limit) params.set("limit", options.limit.toString());
				if (!reset && cursor) params.set("cursor", cursor);

				const response = await fetch(`/api/retro?${params}`);
				if (!response.ok) {
					throw new Error(`Failed to fetch retros: ${response.statusText}`);
				}

				const data = await response.json();

				if (reset) {
					setRetros(data.retros);
				} else {
					setRetros((prev) => [...prev, ...data.retros]);
				}

				setCursor(data.nextCursor);
				setHasMore(!!data.nextCursor);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to fetch retros");
			} finally {
				setLoading(false);
			}
		},
		[options.status, options.createdBy, options.limit, cursor]
	);

	// Create retro
	const createRetro = useCallback(async (data: CreateRetroRequest) => {
		try {
			const response = await fetch("/api/retro", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Failed to create retro: ${response.statusText}`);
			}

			const retro = await response.json();
			setRetros((prev) => [retro, ...prev]);
			return retro;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create retro");
			throw err;
		}
	}, []);

	// Load more retros
	const loadMore = useCallback(() => {
		if (!loading && hasMore) {
			fetchRetros(false);
		}
	}, [fetchRetros, loading, hasMore]);

	// Refresh retros list
	const refresh = useCallback(() => {
		setCursor(undefined);
		fetchRetros(true);
	}, [fetchRetros]);

	// Load initial data
	useEffect(() => {
		refresh();
	}, [options.status, options.createdBy, options.limit]);

	return {
		retros,
		loading,
		error,
		hasMore,
		createRetro,
		loadMore,
		refresh,
	};
}
