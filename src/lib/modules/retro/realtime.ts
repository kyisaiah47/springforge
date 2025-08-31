import { createClient } from "@/lib/supabase/client";
import { RetroRealtimeEvent, RetroNoteWithAuthor } from "./types";

export class RetroRealtimeService {
	private supabase = createClient();
	private subscriptions = new Map<string, any>();

	// Subscribe to retro changes
	subscribeToRetro(
		retroId: string,
		callbacks: {
			onNoteAdded?: (note: RetroNoteWithAuthor) => void;
			onNoteUpdated?: (note: RetroNoteWithAuthor) => void;
			onNoteDeleted?: (noteId: string) => void;
			onRetroUpdated?: (retro: any) => void;
		}
	) {
		const subscriptionKey = `retro_${retroId}`;

		// Unsubscribe if already subscribed
		this.unsubscribe(subscriptionKey);

		// Subscribe to retro notes changes
		const notesSubscription = this.supabase
			.channel(`retro_notes_${retroId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "retro_notes",
					filter: `retro_id=eq.${retroId}`,
				},
				async (payload) => {
					if (callbacks.onNoteAdded) {
						// Fetch the full note with author details
						const { data: note } = await this.supabase
							.from("retro_notes")
							.select(
								`
								*,
								author:members(
									id,
									email,
									github_login,
									avatar_url
								)
							`
							)
							.eq("id", payload.new.id)
							.single();

						if (note) {
							callbacks.onNoteAdded(note);
						}
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "retro_notes",
					filter: `retro_id=eq.${retroId}`,
				},
				async (payload) => {
					if (callbacks.onNoteUpdated) {
						// Fetch the full note with author details
						const { data: note } = await this.supabase
							.from("retro_notes")
							.select(
								`
								*,
								author:members(
									id,
									email,
									github_login,
									avatar_url
								)
							`
							)
							.eq("id", payload.new.id)
							.single();

						if (note) {
							callbacks.onNoteUpdated(note);
						}
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "retro_notes",
					filter: `retro_id=eq.${retroId}`,
				},
				(payload) => {
					if (callbacks.onNoteDeleted) {
						callbacks.onNoteDeleted(payload.old.id);
					}
				}
			)
			.subscribe();

		// Subscribe to retro changes
		const retroSubscription = this.supabase
			.channel(`retro_${retroId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "retros",
					filter: `id=eq.${retroId}`,
				},
				(payload) => {
					if (callbacks.onRetroUpdated) {
						callbacks.onRetroUpdated(payload.new);
					}
				}
			)
			.subscribe();

		// Store subscriptions for cleanup
		this.subscriptions.set(subscriptionKey, {
			notes: notesSubscription,
			retro: retroSubscription,
		});

		return subscriptionKey;
	}

	// Subscribe to organization retros list
	subscribeToOrgRetros(
		orgId: string,
		callbacks: {
			onRetroAdded?: (retro: any) => void;
			onRetroUpdated?: (retro: any) => void;
			onRetroDeleted?: (retroId: string) => void;
		}
	) {
		const subscriptionKey = `org_retros_${orgId}`;

		// Unsubscribe if already subscribed
		this.unsubscribe(subscriptionKey);

		const subscription = this.supabase
			.channel(`org_retros_${orgId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "retros",
					filter: `org_id=eq.${orgId}`,
				},
				async (payload) => {
					if (callbacks.onRetroAdded) {
						// Fetch the full retro with creator details
						const { data: retro } = await this.supabase
							.from("retros")
							.select(
								`
								*,
								created_by_member:members!retros_created_by_fkey(
									id,
									email,
									github_login,
									avatar_url
								)
							`
							)
							.eq("id", payload.new.id)
							.single();

						if (retro) {
							callbacks.onRetroAdded(retro);
						}
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "retros",
					filter: `org_id=eq.${orgId}`,
				},
				async (payload) => {
					if (callbacks.onRetroUpdated) {
						// Fetch the full retro with creator details
						const { data: retro } = await this.supabase
							.from("retros")
							.select(
								`
								*,
								created_by_member:members!retros_created_by_fkey(
									id,
									email,
									github_login,
									avatar_url
								)
							`
							)
							.eq("id", payload.new.id)
							.single();

						if (retro) {
							callbacks.onRetroUpdated(retro);
						}
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "retros",
					filter: `org_id=eq.${orgId}`,
				},
				(payload) => {
					if (callbacks.onRetroDeleted) {
						callbacks.onRetroDeleted(payload.old.id);
					}
				}
			)
			.subscribe();

		this.subscriptions.set(subscriptionKey, subscription);
		return subscriptionKey;
	}

	// Unsubscribe from a specific subscription
	unsubscribe(subscriptionKey: string) {
		const subscription = this.subscriptions.get(subscriptionKey);
		if (subscription) {
			if (subscription.notes && subscription.retro) {
				// Multiple subscriptions (retro detail)
				this.supabase.removeChannel(subscription.notes);
				this.supabase.removeChannel(subscription.retro);
			} else {
				// Single subscription (org retros)
				this.supabase.removeChannel(subscription);
			}
			this.subscriptions.delete(subscriptionKey);
		}
	}

	// Unsubscribe from all subscriptions
	unsubscribeAll() {
		for (const [key] of this.subscriptions) {
			this.unsubscribe(key);
		}
	}

	// Get connection status
	getConnectionStatus() {
		return this.supabase.realtime.isConnected();
	}

	// Manually trigger reconnection
	reconnect() {
		return this.supabase.realtime.connect();
	}
}

// Export singleton instance
export const retroRealtimeService = new RetroRealtimeService();
