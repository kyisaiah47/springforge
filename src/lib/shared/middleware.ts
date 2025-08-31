import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { APIErrors, APIErrorException } from "./api-error";
import { validateRequestBody, validateQueryParams } from "./validation";
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
 * Authentication middleware
 */
async function authenticateRequest(
	req: NextRequest,
	supabase: any
): Promise<AuthContext> {
	const authHeader = req.headers.get("authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw APIErrors.unauthorized("Missing or invalid authorization header");
	}

	const token = authHeader.substring(7);

	// Verify JWT token with Supabase
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token);

	if (error || !user) {
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

		try {
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
				validatedData.query = validateQueryParams(
					options.validateQuery,
					queryParams
				);
			}

			if (
				options.validateBody &&
				(req.method === "POST" ||
					req.method === "PUT" ||
					req.method === "PATCH")
			) {
				const body = await req.json().catch(() => ({}));
				validatedData.body = validateRequestBody(options.validateBody, body);
			}

			// Call the actual handler
			return await handler(context, validatedData);
		} catch (error) {
			console.error(`API Error [${requestId}]:`, error);

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
