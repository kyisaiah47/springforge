import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LiveUpdates, ConnectionStatus } from "../live-updates";
import {
	RealtimeProvider,
	useRealtime,
} from "@/lib/realtime/realtime-provider";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
	createClient: vi.fn(),
}));

describe("LiveUpdates", () => {
	let mockSupabase: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockSupabase = {
			channel: vi.fn(() => ({
				on: vi.fn().mockReturnThis(),
				subscribe: vi.fn(),
			})),
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

	it("renders connection status", () => {
		render(
			<RealtimeProvider>
				<LiveUpdates />
			</RealtimeProvider>
		);

		expect(screen.getByText("Live Updates")).toBeInTheDocument();
		expect(screen.getByText("Connected")).toBeInTheDocument();
	});

	it("shows no events message when no events", () => {
		render(
			<RealtimeProvider>
				<LiveUpdates />
			</RealtimeProvider>
		);

		expect(screen.getByText("No recent events")).toBeInTheDocument();
	});

	it("can hide connection status", () => {
		render(
			<RealtimeProvider>
				<LiveUpdates showConnectionStatus={false} />
			</RealtimeProvider>
		);

		expect(screen.queryByText("Connected")).not.toBeInTheDocument();
	});

	it("can hide event history", () => {
		render(
			<RealtimeProvider>
				<LiveUpdates showEventHistory={false} />
			</RealtimeProvider>
		);

		expect(screen.queryByText("No recent events")).not.toBeInTheDocument();
	});

	it("displays active subscriptions count", async () => {
		const TestComponent = () => {
			const { subscribe } = useRealtime();

			React.useEffect(() => {
				subscribe("test", [{ table: "retro_notes", callback: vi.fn() }]);
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
	});
});

describe("ConnectionStatus", () => {
	let mockSupabase: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockSupabase = {
			channel: vi.fn(() => ({
				on: vi.fn().mockReturnThis(),
				subscribe: vi.fn(),
			})),
			removeChannel: vi.fn(),
			realtime: {
				isConnected: vi.fn(() => false), // Start disconnected
				connect: vi.fn(),
				disconnect: vi.fn(),
				onOpen: vi.fn(),
				onClose: vi.fn(),
				onError: vi.fn(),
			},
		};

		(createClient as any).mockReturnValue(mockSupabase);
	});

	it("shows offline status and reconnect button", () => {
		render(
			<RealtimeProvider>
				<ConnectionStatus />
			</RealtimeProvider>
		);

		expect(screen.getByText("Offline")).toBeInTheDocument();

		const reconnectButton = screen.getByRole("button");
		expect(reconnectButton).toBeInTheDocument();
	});

	it("calls reconnect when button clicked", () => {
		render(
			<RealtimeProvider>
				<ConnectionStatus />
			</RealtimeProvider>
		);

		const reconnectButton = screen.getByRole("button");
		fireEvent.click(reconnectButton);

		expect(mockSupabase.realtime.connect).toHaveBeenCalled();
	});

	it("shows live status when connected", () => {
		mockSupabase.realtime.isConnected.mockReturnValue(true);

		render(
			<RealtimeProvider>
				<ConnectionStatus />
			</RealtimeProvider>
		);

		expect(screen.getByText("Live")).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
