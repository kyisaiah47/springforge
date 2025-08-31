import { describe, it, expect } from "vitest";
import { APIErrors, createAPIError, ERROR_CODES } from "../api-error";

describe("API Error Handling", () => {
	it("should create standardized API errors", () => {
		const error = createAPIError(
			ERROR_CODES.VALIDATION_ERROR,
			"Invalid input",
			{ field: "email" }
		);

		expect(error.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
		expect(error.error.message).toBe("Invalid input");
		expect(error.error.details).toEqual({ field: "email" });
		expect(error.timestamp).toBeDefined();
		expect(error.request_id).toBeDefined();
	});

	it("should create unauthorized error", () => {
		const error = APIErrors.unauthorized("Custom message");

		expect(error.statusCode).toBe(401);
		expect(error.apiError.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
		expect(error.apiError.error.message).toBe("Custom message");
	});

	it("should create validation error with details", () => {
		const details = { field: "email", expected: "valid email" };
		const error = APIErrors.validation("Invalid email", details);

		expect(error.statusCode).toBe(400);
		expect(error.apiError.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
		expect(error.apiError.error.details).toEqual(details);
	});

	it("should create not found error", () => {
		const error = APIErrors.notFound("User");

		expect(error.statusCode).toBe(404);
		expect(error.apiError.error.code).toBe(ERROR_CODES.NOT_FOUND);
		expect(error.apiError.error.message).toBe("User not found");
	});
});
