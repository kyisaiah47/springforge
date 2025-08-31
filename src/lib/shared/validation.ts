import { z } from "zod";

/**
 * Common validation schemas used across API endpoints
 */

// Base pagination schema with enhanced validation
export const paginationSchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(20),
	cursor: z.string().max(255).optional(),
	order_by: z
		.string()
		.max(50)
		.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
		.optional(),
	order_dir: z.enum(["asc", "desc"]).default("desc"),
});

// Date range schema
export const dateRangeSchema = z.object({
	date_from: z.string().datetime().optional(),
	date_to: z.string().datetime().optional(),
});

// Organization and member schemas with enhanced validation
export const orgIdSchema = z.string().uuid("Invalid organization ID format");
export const memberIdSchema = z.string().uuid("Invalid member ID format");

// Common string validation schemas
export const safeStringSchema = z
	.string()
	.max(1000)
	.refine(
		(val) => !/<script|javascript:|on\w+=/i.test(val),
		"Invalid characters detected"
	);

export const urlSchema = z.string().url().max(2048);
export const emailSchema = z.string().email().max(254);

/**
 * AutoStand module validation schemas
 */
export const standupSchemas = {
	list: z.object({
		member_id: memberIdSchema.optional(),
		...dateRangeSchema.shape,
		...paginationSchema.shape,
	}),

	generate: z.object({
		member_id: memberIdSchema.optional(),
		date: z.string().date().optional(),
	}),

	postToSlack: z.object({
		standup_id: z.string().uuid(),
		channel: z.string().optional(),
	}),
};

/**
 * PR Radar module validation schemas
 */
export const prSchemas = {
	list: z.object({
		status: z.enum(["open", "merged", "closed"]).optional(),
		repo: z.string().optional(),
		author: z.string().optional(),
		risk_min: z.coerce.number().min(0).max(10).optional(),
		...paginationSchema.shape,
	}),

	score: z.object({
		repo: z.string().min(1),
		number: z.coerce.number().positive(),
	}),

	suggestions: z.object({
		pr_id: z.string().uuid(),
	}),
};

/**
 * Retro Arena module validation schemas
 */
export const retroSchemas = {
	list: z.object({
		status: z
			.enum(["planning", "active", "voting", "completed", "archived"])
			.optional(),
		created_by: memberIdSchema.optional(),
		...paginationSchema.shape,
	}),

	create: z.object({
		title: z.string().min(1).max(200),
		sprint: z.string().max(100).optional(),
	}),

	addNote: z.object({
		column_key: z.enum(["went_well", "went_poorly", "ideas", "action_items"]),
		text: z.string().min(1).max(500),
		color: z
			.string()
			.regex(/^#[0-9A-F]{6}$/i)
			.default("#FFE066"),
		is_anonymous: z.boolean().default(false),
	}),

	vote: z.object({
		note_id: z.string().uuid(),
	}),

	export: z.object({
		format: z.enum(["markdown", "json"]).default("markdown"),
	}),
};

/**
 * Debug Arcade module validation schemas
 */
export const arcadeSchemas = {
	listLevels: z.object({
		difficulty: z.enum(["easy", "medium", "hard"]).optional(),
		language: z.enum(["typescript", "python"]).optional(),
		...paginationSchema.shape,
	}),

	run: z.object({
		level_id: z.string().uuid(),
		submitted_code: z.string().min(1).max(10000),
	}),

	leaderboard: z.object({
		level_id: z.string().uuid().optional(),
		...paginationSchema.shape,
	}),
};

/**
 * Webhook validation schemas
 */
export const webhookSchemas = {
	github: z.object({
		action: z.string(),
		pull_request: z
			.object({
				number: z.number(),
				title: z.string(),
				body: z.string().nullable(),
				state: z.enum(["open", "closed"]),
				merged: z.boolean().optional(),
				additions: z.number(),
				deletions: z.number(),
				changed_files: z.number(),
				head: z.object({
					sha: z.string(),
					ref: z.string(),
				}),
				base: z.object({
					sha: z.string(),
					ref: z.string(),
				}),
				user: z.object({
					login: z.string(),
					id: z.number(),
				}),
			})
			.optional(),
		repository: z.object({
			name: z.string(),
			full_name: z.string(),
			owner: z.object({
				login: z.string(),
			}),
		}),
	}),

	slack: z.object({
		token: z.string(),
		team_id: z.string(),
		team_domain: z.string(),
		channel_id: z.string(),
		channel_name: z.string(),
		user_id: z.string(),
		user_name: z.string(),
		command: z.string(),
		text: z.string(),
		response_url: z.string().url(),
	}),
};

/**
 * Settings and integration schemas
 */
export const settingsSchemas = {
	updateOrg: z.object({
		name: z.string().min(1).max(100).optional(),
		settings: z
			.object({
				timezone: z.string().optional(),
				slack_webhook_url: z.string().url().optional(),
				github_org: z.string().optional(),
			})
			.optional(),
	}),

	createIntegration: z.object({
		type: z.enum(["github", "slack"]),
		access_token: z.string().optional(),
		settings: z.record(z.string(), z.any()).default({}),
	}),

	updateIntegration: z.object({
		access_token: z.string().optional(),
		settings: z.record(z.string(), z.any()).optional(),
		disabled: z.boolean().optional(),
	}),
};

/**
 * Utility function to validate request body with Zod schema
 */
export function validateRequestBody<T>(
	schema: z.ZodSchema<T>,
	body: unknown
): T {
	const result = schema.safeParse(body);

	if (!result.success) {
		const errors = result.error.issues.map((err: any) => ({
			field: err.path.join("."),
			message: err.message,
		}));

		throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
	}

	return result.data;
}

/**
 * Utility function to validate query parameters
 */
export function validateQueryParams<T>(
	schema: z.ZodSchema<T>,
	params: Record<string, string | string[]>
): T {
	// Convert query params to proper format for validation
	const processedParams: Record<string, any> = {};

	for (const [key, value] of Object.entries(params)) {
		if (Array.isArray(value)) {
			processedParams[key] = value[0]; // Take first value for arrays
		} else {
			processedParams[key] = value;
		}
	}

	const result = schema.safeParse(processedParams);

	if (!result.success) {
		const errors = result.error.issues.map((err: any) => ({
			field: err.path.join("."),
			message: err.message,
		}));

		throw new Error(
			`Query parameter validation failed: ${JSON.stringify(errors)}`
		);
	}

	return result.data;
}
