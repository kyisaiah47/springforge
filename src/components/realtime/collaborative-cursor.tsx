"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRealtime } from "@/lib/realtime/realtime-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface CursorPosition {
	x: number;
	y: number;
	timestamp: number;
}

interface UserCursor extends CursorPosition {
	userId: string;
	userName: string;
	userColor: string;
	isActive: boolean;
}

interface CollaborativeCursorProps {
	roomId: string; // e.g., retro ID
	userId: string;
	userName: string;
	userColor?: string;
	children: React.ReactNode;
	className?: string;
	enabled?: boolean;
}

// Generate a consistent color for a user based on their ID
function getUserColor(userId: string): string {
	const colors = [
		"#ef4444", // red
		"#f97316", // orange
		"#eab308", // yellow
		"#22c55e", // green
		"#06b6d4", // cyan
		"#3b82f6", // blue
		"#8b5cf6", // violet
		"#ec4899", // pink
	];

	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash);
	}

	return colors[Math.abs(hash) % colors.length];
}

export function CollaborativeCursor({
	roomId,
	userId,
	userName,
	userColor,
	children,
	className,
	enabled = true,
}: CollaborativeCursorProps) {
	const [cursors, setCursors] = useState<Map<string, UserCursor>>(new Map());
	const [isMouseInside, setIsMouseInside] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const supabase = createClient();
	const channelRef = useRef<any>(null);
	const lastSentPosition = useRef<CursorPosition | null>(null);
	const throttleTimeoutRef = useRef<NodeJS.Timeout>();

	const finalUserColor = userColor || getUserColor(userId);

	// Throttled cursor position broadcast
	const broadcastCursorPosition = useCallback(
		(x: number, y: number) => {
			if (!enabled || !channelRef.current) return;

			const now = Date.now();
			const position = { x, y, timestamp: now };

			// Throttle to max 10 updates per second
			if (throttleTimeoutRef.current) {
				clearTimeout(throttleTimeoutRef.current);
			}

			throttleTimeoutRef.current = setTimeout(() => {
				channelRef.current?.send({
					type: "broadcast",
					event: "cursor_move",
					payload: {
						userId,
						userName,
						userColor: finalUserColor,
						...position,
					},
				});

				lastSentPosition.current = position;
			}, 100);
		},
		[enabled, userId, userName, finalUserColor]
	);

	// Handle mouse move
	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!enabled || !containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
			const y = ((e.clientY - rect.top) / rect.height) * 100; // Percentage

			broadcastCursorPosition(x, y);
		},
		[enabled, broadcastCursorPosition]
	);

	// Handle mouse enter/leave
	const handleMouseEnter = useCallback(() => {
		setIsMouseInside(true);
		if (enabled && channelRef.current) {
			channelRef.current.send({
				type: "broadcast",
				event: "cursor_enter",
				payload: {
					userId,
					userName,
					userColor: finalUserColor,
				},
			});
		}
	}, [enabled, userId, userName, finalUserColor]);

	const handleMouseLeave = useCallback(() => {
		setIsMouseInside(false);
		if (enabled && channelRef.current) {
			channelRef.current.send({
				type: "broadcast",
				event: "cursor_leave",
				payload: { userId },
			});
		}
	}, [enabled, userId]);

	// Set up real-time channel
	useEffect(() => {
		if (!enabled) return;

		const channel = supabase.channel(`cursors_${roomId}`, {
			config: {
				broadcast: { self: false }, // Don't receive our own broadcasts
			},
		});

		// Listen for cursor events
		channel
			.on("broadcast", { event: "cursor_move" }, (payload) => {
				const {
					userId: senderId,
					userName: senderName,
					userColor: senderColor,
					x,
					y,
					timestamp,
				} = payload.payload;

				if (senderId === userId) return; // Ignore our own cursor

				setCursors((prev) => {
					const updated = new Map(prev);
					updated.set(senderId, {
						userId: senderId,
						userName: senderName,
						userColor: senderColor,
						x,
						y,
						timestamp,
						isActive: true,
					});
					return updated;
				});
			})
			.on("broadcast", { event: "cursor_enter" }, (payload) => {
				const {
					userId: senderId,
					userName: senderName,
					userColor: senderColor,
				} = payload.payload;

				if (senderId === userId) return;

				setCursors((prev) => {
					const updated = new Map(prev);
					const existing = updated.get(senderId);
					updated.set(senderId, {
						...existing,
						userId: senderId,
						userName: senderName,
						userColor: senderColor,
						x: existing?.x || 50,
						y: existing?.y || 50,
						timestamp: Date.now(),
						isActive: true,
					});
					return updated;
				});
			})
			.on("broadcast", { event: "cursor_leave" }, (payload) => {
				const { userId: senderId } = payload.payload;

				setCursors((prev) => {
					const updated = new Map(prev);
					const cursor = updated.get(senderId);
					if (cursor) {
						updated.set(senderId, { ...cursor, isActive: false });
					}
					return updated;
				});
			})
			.subscribe();

		channelRef.current = channel;

		// Cleanup inactive cursors periodically
		const cleanupInterval = setInterval(() => {
			const now = Date.now();
			setCursors((prev) => {
				const updated = new Map();
				prev.forEach((cursor, id) => {
					// Keep cursor if it's active and recent (within 30 seconds)
					if (cursor.isActive && now - cursor.timestamp < 30000) {
						updated.set(id, cursor);
					}
				});
				return updated;
			});
		}, 5000);

		return () => {
			if (throttleTimeoutRef.current) {
				clearTimeout(throttleTimeoutRef.current);
			}
			clearInterval(cleanupInterval);
			supabase.removeChannel(channel);
			channelRef.current = null;
		};
	}, [enabled, roomId, userId, supabase]);

	if (!enabled) {
		return <div className={className}>{children}</div>;
	}

	return (
		<div
			ref={containerRef}
			className={cn("relative", className)}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}

			{/* Render other users' cursors */}
			{Array.from(cursors.values())
				.filter((cursor) => cursor.isActive)
				.map((cursor) => (
					<div
						key={cursor.userId}
						className="absolute pointer-events-none z-50 transition-all duration-100"
						style={{
							left: `${cursor.x}%`,
							top: `${cursor.y}%`,
							transform: "translate(-50%, -50%)",
						}}
					>
						{/* Cursor pointer */}
						<div
							className="relative"
							style={{ color: cursor.userColor }}
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
								className="drop-shadow-sm"
							>
								<path
									d="M3 3L17 10L10 11L8 17L3 3Z"
									fill="currentColor"
									stroke="white"
									strokeWidth="1"
								/>
							</svg>

							{/* User name label */}
							<div
								className="absolute top-5 left-2 px-2 py-1 text-xs font-medium text-white rounded shadow-lg whitespace-nowrap"
								style={{ backgroundColor: cursor.userColor }}
							>
								{cursor.userName}
							</div>
						</div>
					</div>
				))}
		</div>
	);
}

// Hook for managing collaborative cursors
export function useCollaborativeCursor(
	roomId: string,
	enabled: boolean = true
) {
	const [activeCursors, setActiveCursors] = useState<UserCursor[]>([]);

	useEffect(() => {
		if (!enabled) return;

		// This would integrate with the CollaborativeCursor component
		// For now, just return empty array
		setActiveCursors([]);
	}, [roomId, enabled]);

	return {
		activeCursors,
		cursorCount: activeCursors.length,
	};
}
