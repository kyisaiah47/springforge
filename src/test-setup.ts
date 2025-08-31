import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
}));

// Mock Next.js headers
vi.mock("next/headers", () => ({
	cookies: () => ({
		getAll: () => [],
		get: () => undefined,
		set: vi.fn(),
		delete: vi.fn(),
	}),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
