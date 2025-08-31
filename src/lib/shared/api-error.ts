/**
 * Standardized API error interface for consistent error handling across Orbit
 */
export interface APIError {
	error: {
		code: string;
		message: string;
		details?: any;
	};
	timestamp: string;
	request_id: string;
}

/**
 * Standard error codes used throughout the application
 */
export const ERROR_CODES = {
	// Authentication & Authorization
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	INVALID_TOKEN: "INVALID_TOKEN",

	// Validation
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_INPUT: "INVALID_INPUT",

	// Resources
	NOT_FOUND: "NOT_FOUND",
	RESOURCE_EXISTS: "RESOURCE_EXISTS",

	// External Services
	GITHUB_API_ERROR: "GITHUB_API_ERROR",
	SLACK_API_ERROR: "SLACK_API_ERROR",
	WEBHOOK_VERIFICATION_FAILED: "WEBHOOK_VERIFICATION_FAILED",

	// Rate Limiting
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

	// Internal
	INTERNAL_ERROR: "INTERNAL_ERROR",
	DATABASE_ERROR: "DATABASE_ERROR",
} as const;

/**
 * Create a standardized API error response
 */
export function createAPIError(
	code: string,
	message: string,
	details?: any,
	requestId?: string
): APIError {
	return {
		error: {
			code,
			message,
			details,
		},
		timestamp: new Date().toISOString(),
		request_id: requestId || generateRequestId(),
	};
}

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Custom error class for API errors
 */
export class APIErrorException extends Error {
	public readonly apiError: APIError;
	public readonly statusCode: number;

	constructor(
		code: string,
		message: string,
		statusCode: number = 500,
		details?: any,
		requestId?: string
	) {
		super(message);
		this.name = "APIErrorException";
		this.statusCode = statusCode;
		this.apiError = createAPIError(code, message, details, requestId);
	}
}

/**
 * Helper functions for common error scenarios
 */
export const APIErrors = {
	unauthorized: (message = "Authentication required") =>
		new APIErrorException(ERROR_CODES.UNAUTHORIZED, message, 401),

	forbidden: (message = "Insufficient permissions") =>
		new APIErrorException(ERROR_CODES.FORBIDDEN, message, 403),

	notFound: (resource = "Resource", message?: string) =>
		new APIErrorException(
			ERROR_CODES.NOT_FOUND,
			message || `${resource} not found`,
			404
		),

	validation: (message: string, details?: any) =>
		new APIErrorException(ERROR_CODES.VALIDATION_ERROR, message, 400, details),

	rateLimited: (message = "Rate limit exceeded") =>
		new APIErrorException(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, 429),

	internal: (message = "Internal server error", details?: any) =>
		new APIErrorException(ERROR_CODES.INTERNAL_ERROR, message, 500, details),

	githubAPI: (message: string, details?: any) =>
		new APIErrorException(ERROR_CODES.GITHUB_API_ERROR, message, 502, details),

	slackAPI: (message: string, details?: any) =>
		new APIErrorException(ERROR_CODES.SLACK_API_ERROR, message, 502, details),

	webhookVerification: (message = "Webhook signature verification failed") =>
		new APIErrorException(
			ERROR_CODES.WEBHOOK_VERIFICATION_FAILED,
			message,
			401
		),
};
