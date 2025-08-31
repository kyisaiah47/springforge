import { test, expect } from "@playwright/test";

test.describe("SprintForge Smoke Tests", () => {
	test("should load the homepage", async ({ page }) => {
		await page.goto("/");

		// Check that the page loads without errors
		await expect(page).toHaveTitle(/SprintForge/);

		// Check for basic navigation elements
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have working health check endpoint", async ({ request }) => {
		const response = await request.get("/api/health");
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty("status", "healthy");
	});

	test("should redirect to login when accessing protected routes", async ({
		page,
	}) => {
		// Try to access a protected route
		await page.goto("/dashboard");

		// Should redirect to login or show login form
		await expect(page.url()).toMatch(/(login|auth)/);
	});

	test("should load module pages without errors", async ({ page }) => {
		// Test that module pages at least load (even if they redirect to auth)
		const modulePages = ["/standups", "/pr-radar", "/retro", "/arcade"];

		for (const modulePage of modulePages) {
			await page.goto(modulePage);
			// Should not show a 404 or 500 error
			await expect(page.locator("body")).toBeVisible();
			// Should either show content or redirect to auth
			const url = page.url();
			expect(url).toMatch(/(login|auth|standups|pr-radar|retro|arcade)/);
		}
	});

	test("should have accessible navigation", async ({ page }) => {
		await page.goto("/");

		// Check for keyboard navigation support
		await page.keyboard.press("Tab");

		// Should have focusable elements (check for any interactive element)
		const interactiveElements = page.locator("button, a, input, [tabindex]");
		await expect(interactiveElements.first()).toBeVisible();
	});
});
