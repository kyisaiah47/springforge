"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
	RealtimeChannel,
	RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// Real-time event types for all modules
export interface RealtimeEvent {
	type:
		| "retro_note_added"
		| "retro_note_updated"
		| "retro_note_deleted"
		| "retro_vote_cast"
		| "retro_status_changed"
		| "pr_updated"
		| "standup_posted"
		| "arcade_run_completed";
	payload: any;
	timestamp: string;
}

// Subscription configuration
export interface SubscriptionConfig {
	table: string;
	event?: "INSERT" | "UPDATE" | "DELETE" | "*";
	filter?: string;
	callback: (payload: RealtimePostgresChangesPayload<any>) => void;
}

// Connection status
export type ConnectionStatus =
	| "connecting"
	| "connected"
	| "disconnected"
	| "error";

interface RealtimeContextType {
	// Connection management
	connectionStatus: ConnectionStatus;
	isConnected: boolean;
	reconnect: () => void;

	// Subscription management
	subscribe: (channelName: string, configs: SubscriptionConfig[]) => string;
	unsubscribe: (subscriptionId: string) => void;
	unsubscribeAll: () => void;

	// Event broadcasting (for local state updates)
	broadcast: (event: RealtimeEvent) => void;
	addEventListener: (callback: (event: RealtimeEvent) => void) => () => void;

	// Active subscriptions count
	activeSubscriptions: number;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
	children: React.ReactNode;
	orgId?: string; // Optional org context for filtering
}

export function RealtimeProvider({ children, orgId }: RealtimeProviderProps) {
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatus>("disconnected");
	const [activeSubscriptions, setActiveSubscriptions] = useState(0);

	const supabase = createClient();
	const subscriptionsRef = useRef<Map<string, RealtimeChannel>>(new Map());
	const eventListenersRef = useRef<Set<(event: RealtimeEvent) => void>>(
		new Set()
	);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

	// Initialize connection
	useEffect(() => {
		setConnectionStatus("connecting");

		// Listen to connection status changes
		const handleStatusChange = (status: string) => {
			switch (status) {
				case "OPEN":
					setConnectionStatus("connected");
					break;
				case "CONNECTING":
					setConnectionStatus("connecting");
					break;
				case "CLOSED":
					setConnectionStatus("disconnected");
					// Auto-reconnect after 3 seconds
					if (reconnectTimeoutRef.current) {
						clearTimeout(reconnectTimeoutRef.current);
					}
					reconnectTimeoutRef.current = setTimeout(() => {
						reconnect();
					}, 3000);
					break;
				default:
					setConnectionStatus("error");
			}
		};

		// Connect to Supabase realtime
		supabase.realtime.onOpen(() => handleStatusChange("OPEN"));
		supabase.realtime.onClose(() => handleStatusChange("CLOSED"));
		supabase.realtime.onError(() => handleStatusChange("ERROR"));

		// Initial connection
		supabase.realtime.connect();

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			unsubscribeAll();
			supabase.realtime.disconnect();
		};
	}, []);

	const reconnect = () => {
		setConnectionStatus("connecting");
		supabase.realtime.connect();
	};

	const subscribe = (
		channelName: string,
		configs: SubscriptionConfig[]
	): string => {
		// Generate unique subscription ID
		const subscriptionId = `${channelName}_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		// Create channel
		const channel = supabase.channel(subscriptionId);

		// Add postgres changes listeners
		configs.forEach((config) => {
			const filter = config.filter ? { filter: config.filter } : {};

			channel.on(
				"postgres_changes",
				{
					event: config.event || "*",
					schema: "public",
					table: config.table,
					...filter,
				},
				config.callback
			);
		});

		// Subscribe to channel
		channel.subscribe((status) => {
			if (status === "SUBSCRIBED") {
				setActiveSubscriptions((prev) => prev + 1);
			}
		});

		// Store subscription
		subscriptionsRef.current.set(subscriptionId, channel);

		return subscriptionId;
	};

	const unsubscribe = (subscriptionId: string) => {
		const channel = subscriptionsRef.current.get(subscriptionId);
		if (channel) {
			supabase.removeChannel(channel);
			subscriptionsRef.current.delete(subscriptionId);
			setActiveSubscriptions((prev) => Math.max(0, prev - 1));
		}
	};

	const unsubscribeAll = () => {
		subscriptionsRef.current.forEach((channel) => {
			supabase.removeChannel(channel);
		});
		subscriptionsRef.current.clear();
		setActiveSubscriptions(0);
	};

	const broadcast = (event: RealtimeEvent) => {
		// Broadcast to local event listeners
		eventListenersRef.current.forEach((callback) => {
			try {
				callback(event);
			} catch (error) {
				console.error("Error in realtime event listener:", error);
			}
		});
	};

	const addEventListener = (callback: (event: RealtimeEvent) => void) => {
		eventListenersRef.current.add(callback);

		// Return cleanup function
		return () => {
			eventListenersRef.current.delete(callback);
		};
	};

	const contextValue: RealtimeContextType = {
		connectionStatus,
		isConnected: connectionStatus === "connected",
		reconnect,
		subscribe,
		unsubscribe,
		unsubscribeAll,
		broadcast,
		addEventListener,
		activeSubscriptions,
	};

	return (
		<RealtimeContext.Provider value={contextValue}>
			{children}
		</RealtimeContext.Provider>
	);
}

export function useRealtime() {
	const context = useContext(RealtimeContext);
	if (!context) {
		throw new Error("useRealtime must be used within a RealtimeProvider");
	}
	return context;
}

// Hook for subscribing to specific table changes
export function useRealtimeSubscription(
	channelName: string,
	configs: SubscriptionConfig[],
	enabled: boolean = true
) {
	const { subscribe, unsubscribe } = useRealtime();
	const subscriptionIdRef = useRef<string>();

	useEffect(() => {
		if (!enabled) return;

		// Subscribe
		const subscriptionId = subscribe(channelName, configs);
		subscriptionIdRef.current = subscriptionId;

		// Cleanup on unmount or dependency change
		return () => {
			if (subscriptionIdRef.current) {
				unsubscribe(subscriptionIdRef.current);
			}
		};
	}, [channelName, enabled, JSON.stringify(configs)]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (subscriptionIdRef.current) {
				unsubscribe(subscriptionIdRef.current);
			}
		};
	}, []);
}
