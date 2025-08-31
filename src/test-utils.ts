import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Mock Supabase client for testing
export const mockSupabaseClient = {
	auth: {
		getUser: () => Promise.resolve({ data: { user: null }, error: null }),
		getSession: () => Promise.resolve({ data: { session: null }, error: null }),
		onAuthStateChange: () => ({}),
	},
	from: () => ({
		select: () => ({ data: [], error: null }),
		insert: () => ({ data: [], error: null }),
		update: () => ({ data: [], error: null }),
		delete: () => ({ data: [], error: null }),
	}),
};

// Custom render function for tests
export const renderWithProviders = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">
) => render(ui, { ...options });

export * from "@testing-library/react";

// Common test data factories
export const createMockUser = (overrides = {}) => ({
	id: "test-user-id",
	email: "test@example.com",
	user_metadata: {
		avatar_url: "https://github.com/testuser.png",
		full_name: "Test User",
		user_name: "testuser",
	},
	...overrides,
});

export const createMockOrganization = (overrides = {}) => ({
	id: "test-org-id",
	name: "Test Organization",
	settings: {
		timezone: "America/New_York",
		slack_webhook_url: "https://hooks.slack.com/test",
		github_org: "test-org",
	},
	created_at: "2024-01-01T00:00:00Z",
	...overrides,
});

export const createMockMember = (overrides = {}) => ({
	id: "test-member-id",
	org_id: "test-org-id",
	email: "member@example.com",
	github_login: "testmember",
	github_id: "123456",
	avatar_url: "https://github.com/testmember.png",
	role: "member" as const,
	created_at: "2024-01-01T00:00:00Z",
	...overrides,
});