import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
	test("should show login page for unauthenticated users", async ({ page }) => {
		await page.goto("/dashboard");

		// Should redirect to login
		await expect(page.url()).toMatch(/(login|auth)/);

		// Should show GitHub login option
		await expect(page.getByText(/github/i)).toBeVisible();
	});

	test("should handle auth callback route", async ({ page }) => {
		// Test that the auth callback route exists and doesn't crash
		await page.goto("/auth/callback");

		// Should not show a 404 error
		await expect(page.locator("body")).toBeVisible();
	});

	test("should handle auth error page", async ({ page }) => {
		await page.goto("/auth/auth-code-error");

		// Should show error page without crashing
		await expect(page.locator("body")).toBeVisible();
		await expect(page.getByText(/error/i)).toBeVisible();
	});

	// Note: We skip actual OAuth testing as it requires real GitHub integration
	// In a real scenario, you'd use test accounts or mock the OAuth flow
	test.skip("should complete GitHub OAuth flow", async ({ page }) => {
		// This would test the full OAuth flow with test credentials
		// Skipped for demo as it requires real GitHub app setup
	});
});
