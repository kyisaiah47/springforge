import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import {
	RealtimeProvider,
	useRealtime,
	useRealtimeSubscription,
} from "../realtime-provider";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
	createClient: vi.fn(),
}));

describe("RealtimeProvider", () => {
	let mockSupabase: any;
	let mockChannel: any;
	let mockRealtime: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock channel
		mockChannel = {
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn((callback) => {
				// Simulate successful subscription
				setTimeout(() => callback("SUBSCRIBED"), 0);
				return mockChannel;
			}),
			unsubscribe: vi.fn(),
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

		(createClient as any).mockReturnValue(mockSupabase);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	it("provides realtime context", () => {
		const TestComponent = () => {
			const { connectionStatus, isConnected } = useRealtime();
			return (
				<div>
					<span data-testid="status">{connectionStatus}</span>
					<span data-testid="connected">{isConnected.toString()}</span>
				</div>
			);
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		expect(screen.getByTestId("status")).toBeInTheDocument();
		expect(screen.getByTestId("connected")).toBeInTheDocument();
	});

	it("handles connection status changes", async () => {
		let onOpenCallback: () => void;
		let onCloseCallback: () => void;

		mockRealtime.onOpen.mockImplementation((callback: () => void) => {
			onOpenCallback = callback;
		});

		mockRealtime.onClose.mockImplementation((callback: () => void) => {
			onCloseCallback = callback;
		});

		const TestComponent = () => {
			const { connectionStatus } = useRealtime();
			return <span data-testid="status">{connectionStatus}</span>;
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		// Initially connecting
		expect(screen.getByTestId("status")).toHaveTextContent("connecting");

		// Simulate connection open
		act(() => {
			onOpenCallback();
		});

		await waitFor(() => {
			expect(screen.getByTestId("status")).toHaveTextContent("connected");
		});

		// Simulate connection close
		act(() => {
			onCloseCallback();
		});

		await waitFor(() => {
			expect(screen.getByTestId("status")).toHaveTextContent("disconnected");
		});
	});

	it("manages subscriptions correctly", async () => {
		const TestComponent = () => {
			const { subscribe, unsubscribe, activeSubscriptions } = useRealtime();

			const handleSubscribe = () => {
				subscribe("test-channel", [
					{
						table: "retro_notes",
						event: "INSERT",
						callback: vi.fn(),
					},
				]);
			};

			return (
				<div>
					<button
						onClick={handleSubscribe}
						data-testid="subscribe"
					>
						Subscribe
					</button>
					<span data-testid="count">{activeSubscriptions}</span>
				</div>
			);
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		expect(screen.getByTestId("count")).toHaveTextContent("0");

		// Subscribe to a channel
		act(() => {
			screen.getByTestId("subscribe").click();
		});

		// Wait for subscription to be processed
		await waitFor(() => {
			expect(screen.getByTestId("count")).toHaveTextContent("1");
		});

		expect(mockSupabase.channel).toHaveBeenCalled();
		expect(mockChannel.on).toHaveBeenCalledWith(
			"postgres_changes",
			expect.objectContaining({
				event: "INSERT",
				schema: "public",
				table: "retro_notes",
			}),
			expect.any(Function)
		);
	});

	it("broadcasts events to listeners", () => {
		const mockListener = vi.fn();

		const TestComponent = () => {
			const { broadcast, addEventListener } = useRealtime();

			React.useEffect(() => {
				const removeListener = addEventListener(mockListener);
				return removeListener;
			}, [addEventListener]);

			const handleBroadcast = () => {
				broadcast({
					type: "retro_note_added",
					payload: { noteId: "123" },
					timestamp: new Date().toISOString(),
				});
			};

			return (
				<button
					onClick={handleBroadcast}
					data-testid="broadcast"
				>
					Broadcast
				</button>
			);
		};

		render(
			<RealtimeProvider>
				<TestComponent />
			</RealtimeProvider>
		);

		act(() => {
			screen.getByTestId("broadcast").click();
		});

		expect(mockListener).toHaveBeenCalledWith({
			type: "retro_note_added",
			payload: { noteId: "123" },
			timestamp: expect.any(String),
		});
	});

	it("throws error when useRealtime is used outside provider", () => {
		const TestComponent = () => {
			useRealtime();
			return null;
		};

		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(<TestComponent />)).toThrow(
			"useRealtime must be used within a RealtimeProvider"
		);

		consoleSpy.mockRestore();
	});
});

describe("useRealtimeSubscription", () => {
	let mockSupabase: any;
	let mockChannel: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockChannel = {
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn((callback) => {
				setTimeout(() => callback("SUBSCRIBED"), 0);
				return mockChannel;
			}),
		};

		mockSupabase = {
			channel: vi.fn(() => mockChannel),
			removeChannel: vi.fn(),
			realtime: {
				isConnected: vi.fn(() => true),
				connect: vi.fn(),
				disconnect: vi.fn(),
				onOpen: vi.fn(),
				onClose: vi.fn(),
				onError: vi.fn(),
			},
		};

		(createClient as unknown).mockReturnValue(mockSupabase);
	});

	it("subscribes and unsubscribes correctly", async () => {
		const mockCallback = vi.fn();

		const TestComponent = ({ enabled }: { enabled: boolean }) => {
			useRealtimeSubscription(
				"test-channel",
				[
					{
						table: "retro_notes",
						event: "INSERT",
						callback: mockCallback,
					},
				],
				enabled
			);

			return <div>Test</div>;
		};

		const { rerender, unmount } = render(
			<RealtimeProvider>
				<TestComponent enabled={true} />
			</RealtimeProvider>
		);

		await waitFor(() => {
			expect(mockSupabase.channel).toHaveBeenCalled();
		});

		// Disable subscription
		rerender(
			<RealtimeProvider>
				<TestComponent enabled={false} />
			</RealtimeProvider>
		);

		// Unmount component
		unmount();

		expect(mockSupabase.removeChannel).toHaveBeenCalled();
	});
});
