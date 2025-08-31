/**
 * Shared API utilities for SprintForge
 *
 * This module exports all the core API infrastructure components:
 * - Error handling and standardized API responses
 * - Request validation with Zod schemas
 * - Authentication and authorization middleware
 * - Rate limiting and security middleware
 * - Webhook signature verification
 */

// Error handling
export type { APIError } from "./api-error";
export {
	APIErrorException,
	APIErrors,
	ERROR_CODES,
	createAPIError,
} from "./api-error";

// Validation schemas and utilities
export {
	paginationSchema,
	dateRangeSchema,
	orgIdSchema,
	memberIdSchema,
	standupSchemas,
	prSchemas,
	retroSchemas,
	arcadeSchemas,
	webhookSchemas,
	settingsSchemas,
	validateRequestBody,
	validateQueryParams,
} from "./validation";

// Middleware and authentication
export type { AuthContext, APIContext } from "./middleware";
export {
	withMiddleware,
	createSuccessResponse,
	createPaginatedResponse,
} from "./middleware";

// Webhook verification
export {
	GitHubWebhookVerifier,
	SlackWebhookVerifier,
	GenericWebhookVerifier,
	WebhookVerificationFactory,
	withWebhookVerification,
	getRawBody,
} from "./webhook-verification";

/**
 * Common HTTP status codes for API responses
 */
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common MIME types for API responses
 */
export const MIME_TYPES = {
	JSON: "application/json",
	TEXT: "text/plain",
	HTML: "text/html",
	CSV: "text/csv",
	PDF: "application/pdf",
} as const;
