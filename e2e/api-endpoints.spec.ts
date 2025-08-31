import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
	test("health check should return ok status", async ({ request }) => {
		const response = await request.get("/api/health");

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty("status", "healthy");
		expect(data).toHaveProperty("timestamp");
	});

	test("protected API routes should require authentication", async ({
		request,
	}) => {
		const protectedEndpoints = [
			"/api/standups",
			"/api/prs",
			"/api/retro",
			"/api/organizations",
		];

		for (const endpoint of protectedEndpoints) {
			const response = await request.get(endpoint);

			// Should return 401 Unauthorized or redirect to auth
			expect([401, 302, 403]).toContain(response.status());
		}
	});

	test("API routes should handle invalid methods", async ({ request }) => {
		// Test that endpoints properly handle unsupported HTTP methods
		const response = await request.patch("/api/health");

		// Should return 405 Method Not Allowed or 404
		expect([404, 405]).toContain(response.status());
	});

	test("API routes should validate input", async ({ request }) => {
		// Test POST endpoints with invalid data
		const response = await request.post("/api/standups", {
			data: { invalid: "data" },
		});

		// Should return 400 Bad Request or 401 Unauthorized
		expect([400, 401, 403]).toContain(response.status());
	});

	test("webhook endpoints should exist", async ({ request }) => {
		const webhookEndpoints = ["/api/webhooks/github"];

		for (const endpoint of webhookEndpoints) {
			const response = await request.post(endpoint, {
				data: {},
			});

			// Should not return 404 (endpoint exists)
			expect(response.status()).not.toBe(404);
		}
	});
});
