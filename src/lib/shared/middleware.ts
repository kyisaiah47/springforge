import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { APIErrors, APIErrorException } from "./api-error";
import { validateRequestBody, validateQueryParams } from "./validation";
import { logger } from "../monitoring/logger";
import {
	securityAuditor,
	logAuthFailure,
	logRateLimitViolation,
	logSuspiciousActivity,
} from "../monitoring/security-audit";
import { z } from "zod";

/**
 * Rate limiting store (in-memory for simplicity, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

/**
 * Default rate limit configurations by endpoint type
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
	auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes
	api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
	webhook: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
	cron: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
	strict: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute for sensitive endpoints
	public: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 requests per minute for public endpoints
};

/**
 * Authentication context interface
 */
export interface AuthContext {
	user: {
		id: string;
		email: string;
		github_login?: string;
	};
	member: {
		id: string;
		org_id: string;
		role: "admin" | "member";
	};
	organization: {
		id: string;
		name: string;
	};
}

/**
 * API handler context with authentication and validation
 */
export interface APIContext {
	req: NextRequest;
	auth?: AuthContext;
	supabase: any;
	requestId: string;
}

/**
 * Middleware options
 */
interface MiddlewareOptions {
	requireAuth?: boolean;
	requireRole?: "admin" | "member";
	rateLimit?: RateLimitConfig | keyof typeof DEFAULT_RATE_LIMITS;
	validateBody?: z.ZodSchema;
	validateQuery?: z.ZodSchema;
	allowedMethods?: string[];
	requireHTTPS?: boolean;
	logRequests?: boolean;
}

/**
 * Create Supabase client for API routes
 */
function createSupabaseClient(req: NextRequest) {
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			cookies: {
				get(name: string) {
					return req.cookies.get(name)?.value;
				},
				set() {
					// Not needed for API routes
				},
				remove() {
					// Not needed for API routes
				},
			},
		}
	);
}

/**
 * Rate limiting middleware
 */
function applyRateLimit(req: NextRequest, config: RateLimitConfig): void {
	const key = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req);
	const now = Date.now();

	// Clean up expired entries
	rateLimitStore.forEach((v, k) => {
		if (v.resetTime < now) {
			rateLimitStore.delete(k);
		}
	});

	const current = rateLimitStore.get(key);

	if (!current || current.resetTime < now) {
		// New window
		rateLimitStore.set(key, {
			count: 1,
			resetTime: now + config.windowMs,
		});
	} else {
		// Existing window
		if (current.count >= config.maxRequests) {
			logRateLimitViolation(key, req.nextUrl.pathname, {
				current_count: current.count,
				max_requests: config.maxRequests,
				window_ms: config.windowMs,
			});

			throw APIErrors.rateLimited(
				`Rate limit exceeded. Try again in ${Math.ceil(
					(current.resetTime - now) / 1000
				)} seconds.`
			);
		}
		current.count++;
	}
}

/**
 * Get client IP address for rate limiting
 */
function getClientIP(req: NextRequest): string {
	const forwarded = req.headers.get("x-forwarded-for");
	const realIP = req.headers.get("x-real-ip");

	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	if (realIP) {
		return realIP;
	}

	return "unknown";
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
function sanitizeInput(input: any): any {
	if (typeof input === "string") {
		// Remove potentially dangerous characters and patterns
		return input
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
			.replace(/javascript:/gi, "")
			.replace(/on\w+\s*=/gi, "")
			.replace(/data:text\/html/gi, "")
			.trim();
	}

	if (Array.isArray(input)) {
		return input.map(sanitizeInput);
	}

	if (input && typeof input === "object") {
		const sanitized: any = {};
		for (const [key, value] of Object.entries(input)) {
			sanitized[key] = sanitizeInput(value);
		}
		return sanitized;
	}

	return input;
}

/**
 * Validate request method
 */
function validateMethod(req: NextRequest, allowedMethods?: string[]): void {
	if (allowedMethods && !allowedMethods.includes(req.method)) {
		throw new APIErrorException(
			"METHOD_NOT_ALLOWED",
			`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(
				", "
			)}`,
			405
		);
	}
}

/**
 * Validate HTTPS requirement
 */
function validateHTTPS(req: NextRequest): void {
	const protocol = req.headers.get("x-forwarded-proto") || "http";
	if (process.env.NODE_ENV === "production" && protocol !== "https") {
		throw new APIErrorException(
			"HTTPS_REQUIRED",
			"HTTPS is required for this endpoint",
			400
		);
	}
}

/**
 * Detect suspicious request patterns
 */
function detectSuspiciousActivity(req: NextRequest): void {
	const userAgent = req.headers.get("user-agent") || "";
	const referer = req.headers.get("referer") || "";

	// Check for common bot patterns
	const suspiciousPatterns = [
		/sqlmap/i,
		/nikto/i,
		/nessus/i,
		/burp/i,
		/nmap/i,
		/masscan/i,
	];

	if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
		const ip = getClientIP(req);
		logSuspiciousActivity(ip, "suspicious_user_agent", {
			userAgent,
			url: req.url,
		});

		throw new APIErrorException(
			"SUSPICIOUS_ACTIVITY",
			"Request blocked due to suspicious activity",
			403
		);
	}

	// Check for path traversal attempts
	const url = req.nextUrl.pathname;
	if (url.includes("../") || url.includes("..\\") || url.includes("%2e%2e")) {
		const ip = getClientIP(req);
		logSuspiciousActivity(ip, "path_traversal_attempt", {
			url,
		});

		throw new APIErrorException(
			"PATH_TRAVERSAL_ATTEMPT",
			"Invalid path detected",
			400
		);
	}
}

/**
 * Authentication middleware
 */
async function authenticateRequest(
	req: NextRequest,
	supabase: any
): Promise<AuthContext> {
	const authHeader = req.headers.get("authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		logAuthFailure(getClientIP(req), {
			reason: "missing_or_invalid_auth_header",
			has_header: !!authHeader,
		});
		throw APIErrors.unauthorized("Missing or invalid authorization header");
	}

	const token = authHeader.substring(7);

	// Verify JWT token with Supabase
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token);

	if (error || !user) {
		logAuthFailure(getClientIP(req), {
			reason: "invalid_or_expired_token",
			error: error?.message,
		});
		throw APIErrors.unauthorized("Invalid or expired token");
	}

	// Get member and organization info
	const { data: member, error: memberError } = await supabase
		.from("members")
		.select(
			`
      id,
      org_id,
      role,
      organizations (
        id,
        name
      )
    `
		)
		.eq("email", user.email)
		.eq("deleted_at", null)
		.single();

	if (memberError || !member) {
		throw APIErrors.forbidden("User is not a member of any organization");
	}

	// Set RLS context
	await supabase.rpc("set_current_user_id", { user_id: user.id });
	await supabase.rpc("set_current_org_id", { org_id: member.org_id });

	return {
		user: {
			id: user.id,
			email: user.email!,
			github_login: user.user_metadata?.user_name,
		},
		member: {
			id: member.id,
			org_id: member.org_id,
			role: member.role,
		},
		organization: {
			id: member.organizations.id,
			name: member.organizations.name,
		},
	};
}

/**
 * Main API middleware wrapper
 */
export function withMiddleware(
	handler: (context: APIContext, validatedData?: any) => Promise<Response>,
	options: MiddlewareOptions = {}
) {
	return async (req: NextRequest): Promise<Response> => {
		const requestId = `req_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		const startTime = Date.now();

		try {
			// Log request if enabled
			if (options.logRequests !== false) {
				logger.info("API Request", {
					requestId,
					method: req.method,
					url: req.url,
					userAgent: req.headers.get("user-agent"),
					ip: getClientIP(req),
				});
			}

			// Validate HTTPS requirement
			if (options.requireHTTPS) {
				validateHTTPS(req);
			}

			// Validate HTTP method
			if (options.allowedMethods) {
				validateMethod(req, options.allowedMethods);
			}

			// Check if IP is blocked
			const clientIP = getClientIP(req);
			if (securityAuditor.isIPBlocked(clientIP)) {
				throw new APIErrorException(
					"IP_BLOCKED",
					"Your IP address has been blocked due to suspicious activity",
					403
				);
			}

			// Detect suspicious activity
			detectSuspiciousActivity(req);

			// Apply rate limiting
			if (options.rateLimit) {
				const rateLimitConfig =
					typeof options.rateLimit === "string"
						? DEFAULT_RATE_LIMITS[options.rateLimit]
						: options.rateLimit;

				if (rateLimitConfig) {
					applyRateLimit(req, rateLimitConfig);
				}
			}

			// Create Supabase client
			const supabase = createSupabaseClient(req);

			// Initialize context
			const context: APIContext = {
				req,
				supabase,
				requestId,
			};

			// Handle authentication
			if (options.requireAuth) {
				context.auth = await authenticateRequest(req, supabase);

				// Check role requirements
				if (
					options.requireRole &&
					context.auth.member.role !== options.requireRole &&
					context.auth.member.role !== "admin"
				) {
					throw APIErrors.forbidden(`Requires ${options.requireRole} role`);
				}
			}

			// Validate request data
			const validatedData: any = {};

			if (options.validateQuery) {
				const url = new URL(req.url);
				const queryParams = Object.fromEntries(url.searchParams.entries());
				const sanitizedParams = sanitizeInput(queryParams);
				validatedData.query = validateQueryParams(
					options.validateQuery,
					sanitizedParams
				);
			}

			if (
				options.validateBody &&
				(req.method === "POST" ||
					req.method === "PUT" ||
					req.method === "PATCH")
			) {
				const body = await req.json().catch(() => ({}));
				const sanitizedBody = sanitizeInput(body);
				validatedData.body = validateRequestBody(
					options.validateBody,
					sanitizedBody
				);
			}

			// Call the actual handler
			const response = await handler(context, validatedData);

			// Log successful response
			const duration = Date.now() - startTime;
			logger.info("API Response", {
				requestId,
				status: response.status,
				duration_ms: duration,
			});

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;

			logger.error(`API Error [${requestId}]`, error as Error, {
				requestId,
				method: req.method,
				url: req.url,
				duration_ms: duration,
				ip: getClientIP(req),
			});

			// Handle APIErrorException
			if (error instanceof APIErrorException) {
				return NextResponse.json(error.apiError, { status: error.statusCode });
			}

			// Handle validation errors
			if (
				error instanceof Error &&
				error.message.includes("Validation failed")
			) {
				const apiError = APIErrors.validation(error.message);
				return NextResponse.json(apiError.apiError, {
					status: apiError.statusCode,
				});
			}

			// Handle unknown errors
			const apiError = APIErrors.internal("An unexpected error occurred", {
				requestId,
				error: error instanceof Error ? error.message : "Unknown error",
			});

			return NextResponse.json(apiError.apiError, {
				status: apiError.statusCode,
			});
		}
	};
}

/**
 * Utility function for successful API responses
 */
export function createSuccessResponse(
	data: any,
	status: number = 200
): Response {
	return NextResponse.json(
		{
			success: true,
			data,
			timestamp: new Date().toISOString(),
		},
		{ status }
	);
}

/**
 * Utility function for paginated responses
 */
export function createPaginatedResponse(
	data: any[],
	pagination: {
		limit: number;
		cursor?: string;
		hasMore: boolean;
		nextCursor?: string;
	},
	status: number = 200
): Response {
	return NextResponse.json(
		{
			success: true,
			data,
			pagination,
			timestamp: new Date().toISOString(),
		},
		{ status }
	);
}
