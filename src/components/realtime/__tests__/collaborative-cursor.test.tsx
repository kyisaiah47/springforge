import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
	CollaborativeCursor,
	useCollaborativeCursor,
} from "../collaborative-cursor";
import { RealtimeProvider } from "@/lib/realtime/realtime-provider";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
	createClient: vi.fn(),
}));

describe("CollaborativeCursor", () => {
	let mockSupabase: any;
	let mockChannel: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockChannel = {
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn(),
			send: vi.fn(),
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

		(createClient as any).mockReturnValue(mockSupabase);
	});

	it("renders children correctly", () => {
		render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
				>
					<div>Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("sets up channel subscription when enabled", () => {
		render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
					enabled={true}
				>
					<div>Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		expect(mockSupabase.channel).toHaveBeenCalledWith(
			"cursors_test-room",
			expect.objectContaining({
				config: { broadcast: { self: false } },
			})
		);

		expect(mockChannel.on).toHaveBeenCalledWith(
			"broadcast",
			{ event: "cursor_move" },
			expect.any(Function)
		);

		expect(mockChannel.subscribe).toHaveBeenCalled();
	});

	it("does not set up subscription when disabled", () => {
		render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
					enabled={false}
				>
					<div>Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		expect(mockSupabase.channel).not.toHaveBeenCalled();
	});

	it("broadcasts cursor enter on mouse enter", () => {
		render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
				>
					<div data-testid="container">Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		const container = screen.getByTestId("container").parentElement;
		fireEvent.mouseEnter(container!);

		expect(mockChannel.send).toHaveBeenCalledWith({
			type: "broadcast",
			event: "cursor_enter",
			payload: {
				userId: "user1",
				userName: "Test User",
				userColor: expect.any(String),
			},
		});
	});

	it("broadcasts cursor leave on mouse leave", () => {
		render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
				>
					<div data-testid="container">Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		const container = screen.getByTestId("container").parentElement;
		fireEvent.mouseLeave(container!);

		expect(mockChannel.send).toHaveBeenCalledWith({
			type: "broadcast",
			event: "cursor_leave",
			payload: { userId: "user1" },
		});
	});

	it("generates consistent colors for user IDs", () => {
		const { rerender } = render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
				>
					<div>Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		// Get the first color
		const container1 = screen.getByText("Test Content").parentElement;
		fireEvent.mouseEnter(container1!);
		const firstCall = mockChannel.send.mock.calls[0][0];
		const firstColor = firstCall.payload.userColor;

		// Clear mocks and re-render with same user ID
		vi.clearAllMocks();
		rerender(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
				>
					<div>Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		const container2 = screen.getByText("Test Content").parentElement;
		fireEvent.mouseEnter(container2!);
		const secondCall = mockChannel.send.mock.calls[0][0];
		const secondColor = secondCall.payload.userColor;

		expect(firstColor).toBe(secondColor);
	});

	it("cleans up on unmount", () => {
		const { unmount } = render(
			<RealtimeProvider>
				<CollaborativeCursor
					roomId="test-room"
					userId="user1"
					userName="Test User"
				>
					<div>Test Content</div>
				</CollaborativeCursor>
			</RealtimeProvider>
		);

		unmount();

		expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
	});
});

describe("useCollaborativeCursor", () => {
	it("returns empty cursors when disabled", () => {
		const TestComponent = () => {
			const { activeCursors, cursorCount } = useCollaborativeCursor(
				"test-room",
				false
			);
			return (
				<div>
					<span data-testid="count">{cursorCount}</span>
					<span data-testid="cursors">{activeCursors.length}</span>
				</div>
			);
		};

		render(<TestComponent />);

		expect(screen.getByTestId("count")).toHaveTextContent("0");
		expect(screen.getByTestId("cursors")).toHaveTextContent("0");
	});

	it("returns empty cursors when enabled (no active cursors)", () => {
		const TestComponent = () => {
			const { activeCursors, cursorCount } = useCollaborativeCursor(
				"test-room",
				true
			);
			return (
				<div>
					<span data-testid="count">{cursorCount}</span>
					<span data-testid="cursors">{activeCursors.length}</span>
				</div>
			);
		};

		render(<TestComponent />);

		expect(screen.getByTestId("count")).toHaveTextContent("0");
		expect(screen.getByTestId("cursors")).toHaveTextContent("0");
	});
});
