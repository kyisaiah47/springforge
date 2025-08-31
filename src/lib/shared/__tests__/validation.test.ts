import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
	validateRequestBody,
	validateQueryParams,
	paginationSchema,
} from "../validation";

describe("Validation Utilities", () => {
	it("should validate request body successfully", () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const validData = { name: "John", age: 30 };
		const result = validateRequestBody(schema, validData);

		expect(result).toEqual(validData);
	});

	it("should throw error for invalid request body", () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const invalidData = { name: "John", age: "thirty" };

		expect(() => validateRequestBody(schema, invalidData)).toThrow(
			"Validation failed"
		);
	});

	it("should validate query parameters with defaults", () => {
		const queryParams = { limit: "10", order_dir: "asc" };
		const result = validateQueryParams(paginationSchema, queryParams);

		expect(result.limit).toBe(10);
		expect(result.order_dir).toBe("asc");
		expect(result.order_by).toBeUndefined();
	});

	it("should apply default values for missing query parameters", () => {
		const queryParams = {};
		const result = validateQueryParams(paginationSchema, queryParams);

		expect(result.limit).toBe(20); // default value
		expect(result.order_dir).toBe("desc"); // default value
	});

	it("should handle array query parameters", () => {
		const queryParams = { limit: ["15", "20"], order_dir: ["asc"] };
		const result = validateQueryParams(paginationSchema, queryParams);

		expect(result.limit).toBe(15); // takes first value
		expect(result.order_dir).toBe("asc");
	});
});
