import { describe, it, expect } from "vitest";
import {
	validateRequestBody,
	validateQueryParams,
	webhookSchemas,
	standupSchemas,
	prSchemas,
} from "../validation";

describe("Validation Utilities", () => {
	describe("validateRequestBody", () => {
		it("should validate correct GitHub webhook payload", () => {
			const validPayload = {
				action: "opened",
				repository: {
					name: "test-repo",
					full_name: "owner/test-repo",
					owner: { login: "owner" },
				},
				pull_request: {
					number: 1,
					title: "Test PR",
					body: "Test description",
					state: "open",
					merged: false,
					additions: 10,
					deletions: 5,
					changed_files: 2,
					head: { ref: "feature", sha: "abc123" },
					base: { ref: "main", sha: "def456" },
					user: { login: "testuser", id: 123 },
				},
			};

			const result = validateRequestBody(webhookSchemas.github, validPayload);
			expect(result.action).toBe("opened");
			expect(result.pull_request?.number).toBe(1);
		});

		it("should reject invalid GitHub webhook payload", () => {
			const invalidPayload = {
				action: "opened",
				// Missing required repository field
			};

			expect(() => {
				validateRequestBody(webhookSchemas.github, invalidPayload);
			}).toThrow("Validation failed");
		});

		it("should validate standup generation request", () => {
			const validRequest = {
				member_id: "123e4567-e89b-12d3-a456-426614174000",
				date: "2024-01-01",
			};

			const result = validateRequestBody(standupSchemas.generate, validRequest);
			expect(result.member_id).toBe("123e4567-e89b-12d3-a456-426614174000");
			expect(result.date).toBe("2024-01-01");
		});
	});

	describe("validateQueryParams", () => {
		it("should validate PR list query parameters", () => {
			const queryParams = {
				status: "open",
				limit: "10",
				risk_min: "5",
			};

			const result = validateQueryParams(prSchemas.list, queryParams);
			expect(result.status).toBe("open");
			expect(result.limit).toBe(10);
			expect(result.risk_min).toBe(5);
		});

		it("should use default values for optional parameters", () => {
			const queryParams = {};

			const result = validateQueryParams(prSchemas.list, queryParams);
			expect(result.limit).toBe(20); // Default value
			expect(result.order_dir).toBe("desc"); // Default value
		});

		it("should handle array query parameters", () => {
			const queryParams = {
				status: ["open", "closed"], // Array - should take first value
				limit: "15",
			};

			const result = validateQueryParams(prSchemas.list, queryParams);
			expect(result.status).toBe("open");
			expect(result.limit).toBe(15);
		});

		it("should reject invalid query parameters", () => {
			const queryParams = {
				limit: "invalid-number",
			};

			expect(() => {
				validateQueryParams(prSchemas.list, queryParams);
			}).toThrow("Query parameter validation failed");
		});
	});
});
