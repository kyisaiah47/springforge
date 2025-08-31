import { useEffect } from "react";
import { useRealtimeSubscription } from "@/lib/realtime/realtime-provider";
import { PRInsight } from "./types";

interface UsePRRealtimeOptions {
	orgId?: string;
	onPRUpdated?: (pr: PRInsight) => void;
	onPRAdded?: (pr: PRInsight) => void;
	enabled?: boolean;
}

export function usePRRealtime({
	orgId,
	onPRUpdated,
	onPRAdded,
	enabled = true,
}: UsePRRealtimeOptions) {
	useRealtimeSubscription(
		`pr_radar_${orgId}`,
		[
			{
				table: "pr_insights",
				event: "INSERT",
				filter: orgId ? `org_id=eq.${orgId}` : undefined,
				callback: (payload) => {
					if (onPRAdded) {
						onPRAdded(payload.new as PRInsight);
					}
				},
			},
			{
				table: "pr_insights",
				event: "UPDATE",
				filter: orgId ? `org_id=eq.${orgId}` : undefined,
				callback: (payload) => {
					if (onPRUpdated) {
						onPRUpdated(payload.new as PRInsight);
					}
				},
			},
		],
		enabled && !!orgId
	);
}

// Hook for standup real-time updates
export function useStandupRealtime({
	orgId,
	onStandupPosted,
	enabled = true,
}: {
	orgId?: string;
	onStandupPosted?: (standup: any) => void;
	enabled?: boolean;
}) {
	useRealtimeSubscription(
		`standups_${orgId}`,
		[
			{
				table: "standups",
				event: "INSERT",
				filter: orgId ? `org_id=eq.${orgId}` : undefined,
				callback: (payload) => {
					if (onStandupPosted) {
						onStandupPosted(payload.new);
					}
				},
			},
		],
		enabled && !!orgId
	);
}

// Hook for arcade real-time updates
export function useArcadeRealtime({
	orgId,
	onRunCompleted,
	enabled = true,
}: {
	orgId?: string;
	onRunCompleted?: (run: any) => void;
	enabled?: boolean;
}) {
	useRealtimeSubscription(
		`arcade_${orgId}`,
		[
			{
				table: "arcade_runs",
				event: "INSERT",
				filter: orgId ? `org_id=eq.${orgId}` : undefined,
				callback: (payload) => {
					if (onRunCompleted) {
						onRunCompleted(payload.new);
					}
				},
			},
		],
		enabled && !!orgId
	);
}
