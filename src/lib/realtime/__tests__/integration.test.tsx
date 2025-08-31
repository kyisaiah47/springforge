import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { RealtimeProvider, useRealtime } from "../realtime-provider";
import { LiveUpdates } from "@/components/realtime/live-updates";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
	createClient: vi.fn(),
}));

describe("Real-time Integration Tests", () => {
	let mockSupabase: any;
	let mockChannel: any;
	let mockRealtime: any;
	let postgresCallbacks: Map<string, Function>;

	beforeEach(() => {
		vi.clearAllMocks();
		postgresCallbacks = new Map();

		// Mock channel with postgres_changes callback tracking
		mockChannel = {
			on: vi.fn((type, config, callback) => {
				if (type === "postgres_changes") {
					const key = `${config.table}_${config.event}_${config.filter || ""}`;
					postgresCallbacks.set(key, callback);
				}
				return mockChannel;
			}),
			subscribe: vi.fn((callback) => {
				setTimeout(() => callback("SUBSCRIBED"), 0);
				return mockChannel;
			}),
			send: vi.fn(),
		};

		// Mock realtime
		mockRealtime = {
			isConnected: vi.fn(() => true),
			connect: vi.fn(),
			disconnect: vi.fn(),
			onOpen: vi.fn(),
			onClose: vi.fn(),
			onError: vi.fn(),
		};

		// Mock Supabase client
		mockSupabase = {
			channel: vi.fn(() => mockChannel),
			removeChannel: vi.fn(),
			realtime: mockRealtime,
		};

		(createClient as unknown).mockReturnValue(mockSupabase);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	it("handles retro note events end-to-end", async () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				// Subscribe to retro notes like the retro board would
				subscribe("retro_test", [
					{
						table: "retro_notes",
						event: "INSERT",
						filter: "retro_id=eq.test-retro",
						callback: vi.fn(),
					},
					{
						table: "retro_notes",
						event: "UPDATE",
						filter: "retro_id=eq.test-retro",
						callback: vi.fn(),
					},
				]);
			}, [subscribe]);

			return <LiveUpdates />;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		// Wait for subscription to be set up
		await waitFor(() => {
			expect(screen.getByText(/1 active subscription/)).toBeInTheDocument();
		});

		// Verify postgres_changes listeners were set up correctly
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({
				event: "INSERT",
				schema: "public",
				table: "retro_notes",
				filter: "retro_id=eq.test-retro",
			}),
			expect.any(Function)
		);

		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({
				event: "UPDATE",
				schema: "public",
				table: "retro_notes",
				filter: "retro_id=eq.test-retro",
			}),
			expect.any(Function)
		);

		// Simulate a retro note INSERT event
		const insertCallback = postgresCallbacks.get(
			"retro_notes_INSERT_retro_id=eq.test-retro"
		);
		if (insertCallback) {
			act(() => {
				insertCallback({
					eventType: "INSERT",
					new: {
						id: "note-123",
						retro_id: "test-retro",
						text: "Test note",
						column_key: "went_well",
						votes: 0,
					},
					old: null,
					schema: "public",
					table: "retro_notes",
				});
			});
		}

		// Simulate a retro note UPDATE event (vote cast)
		const updateCallback = postgresCallbacks.get(
			"retro_notes_UPDATE_retro_id=eq.test-retro"
		);
		if (updateCallback) {
			act(() => {
				updateCallback({
					eventType: "UPDATE",
					new: {
						id: "note-123",
						retro_id: "test-retro",
						text: "Test note",
						column_key: "went_well",
						votes: 1,
					},
					old: {
						id: "note-123",
						retro_id: "test-retro",
						text: "Test note",
						column_key: "went_well",
						votes: 0,
					},
					schema: "public",
					table: "retro_notes",
				});
			});
		}
	});

	it("handles PR events for PR Radar module", async () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				// Subscribe to PR insights like PR Radar would
				subscribe("pr_radar", [
					{
						table: "pr_insights",
						event: "*", // All events
						callback: vi.fn(),
					},
				]);
			}, [subscribe]);

			return <LiveUpdates />;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		await waitFor(() => {
			expect(screen.getByText(/1 active subscription/)).toBeInTheDocument();
		});

		// Verify PR insights subscription
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({
				event: "*",
				schema: "public",
				table: "pr_insights",
			}),
			expect.any(Function)
		);
	});

	it("handles standup events for AutoStand module", async () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				// Subscribe to standups like AutoStand would
				subscribe("autostand", [
					{
						table: "standups",
						event: "INSERT",
						callback: vi.fn(),
					},
				]);
			}, [subscribe]);

			return <LiveUpdates />;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		await waitFor(() => {
			expect(screen.getByText(/1 active subscription/)).toBeInTheDocument();
		});

		// Verify standups subscription
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({
				event: "INSERT",
				schema: "public",
				table: "standups",
			}),
			expect.any(Function)
		);
	});

	it("handles arcade events for Debug Arcade module", async () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				// Subscribe to arcade runs like Debug Arcade would
				subscribe("arcade", [
					{
						table: "arcade_runs",
						event: "INSERT",
						callback: vi.fn(),
					},
				]);
			}, [subscribe]);

			return <LiveUpdates />;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		await waitFor(() => {
			expect(screen.getByText(/1 active subscription/)).toBeInTheDocument();
		});

		// Verify arcade runs subscription
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({
				event: "INSERT",
				schema: "public",
				table: "arcade_runs",
			}),
			expect.any(Function)
		);
	});

	it("handles multiple module subscriptions simultaneously", async () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				// Subscribe to multiple modules like a dashboard would
				subscribe("retro", [
					{
						table: "retro_notes",
						event: "INSERT",
						callback: vi.fn(),
					},
				]);

				subscribe("pr_radar", [
					{
						table: "pr_insights",
						event: "UPDATE",
						callback: vi.fn(),
					},
				]);

				subscribe("autostand", [
					{
						table: "standups",
						event: "INSERT",
						callback: vi.fn(),
					},
				]);
			}, [subscribe]);

			return <LiveUpdates />;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		await waitFor(() => {
			expect(screen.getByText(/3 active subscriptions/)).toBeInTheDocument();
		});

		// Verify all subscriptions were created
		expect(mockSupabase.channel).toHaveBeenCalledTimes(3);
		expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);
	});

	it("handles connection failures gracefully", async () => {
		// Mock connection failure
		mockRealtime.isConnected.mockReturnValue(false);

		let onCloseCallback: () => void;
		mockRealtime.onClose.mockImplementation((callback: () => void) => {
			onCloseCallback = callback;
		});

		const TestComponent = () => {
			return <LiveUpdates />;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		// Simulate connection close
		act(() => {
			onCloseCallback();
		});

		await waitFor(() => {
			expect(screen.getByText("Disconnected")).toBeInTheDocument();
		});

		// Should show reconnect button
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("cleans up subscriptions on unmount", () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				subscribe("test", [
					{
						table: "retro_notes",
						event: "INSERT",
						callback: vi.fn(),
					},
				]);
			}, [subscribe]);

			return <div>Test</div>;
		};

		const { unmount } = render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		unmount();

		// Should clean up channels
		expect(mockSupabase.removeChannel).toHaveBeenCalled();
		expect(mockRealtime.disconnect).toHaveBeenCalled();
	});
});
