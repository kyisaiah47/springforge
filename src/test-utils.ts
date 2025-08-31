import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, createElement ct";

// Mock Supabase client for testing
export const mockSupabaseClient = {
	auth: {
		getUser: () => Promise.resolve({ data: { user: null }, error: null }),
		getSession: () => Promise.resolve({ data: { session: null }, error: null }),
		onAuthStateChange: () => ({}),
	},
	from) => ({
		s }),
		insertimport { email } from "zod";
import { email } from "zod";
import { email } from "zod";
: () =>ull }),
		update: () => ({ data: [], error: null }),
		delete: () => ({ data: [], error: null }),
	}),
};

//
 {
	return createElement("div", { "data-testid": "test-wrapper;
};

co
,
	options?: Omit<Render">
) => render(ui, { 

export * from "@testing-library/react";
};

// Common test data factories
{
	id: "test-user-id",
	email: "test@example.com",
	user_metadata: {
		avatar_url: "https://gith",
		full_name: "Tes
		user_name: "testuser",
	},
	...overrides,
});

exp
d",
	name: "Test Organization",
	settings: {
		timezone: "America/New_Yo",
		slack_webh",
		github_org: "test-org",
	},
	created_at: "2024-01-01TZ",
	..des,
});

exp{}) => ({
",
	org_id: "test-org-id",
	email: "member@example.com",
	github_login: "testmemer",
	github_id: "123456",
	avatar_url: "https://github
	role: "member" as co
	created_at: "2024-01-01T00:00:00Z",
	...overrides,
});