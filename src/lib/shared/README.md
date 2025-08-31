# API Foundation and Error Handling

This directory contains the core API infrastructure for SprintForge, providing standardized error handling, validation, authentication, and webhook verification.

## Components

### Error Handling (`api-error.ts`)

Standardized error handling with consistent API error responses:

```typescript
import { APIErrors, createAPIError } from "@/lib/shared";

// Throw standardized errors
throw APIErrors.unauthorized("Invalid token");
throw APIErrors.validation("Invalid input", { field: "email" });
throw APIErrors.notFound("User");

// Create custom errors
const error = createAPIError("CUSTOM_ERROR", "Something went wrong");
```

### Validation (`validation.ts`)

Zod schemas for request validation:

```typescript
import { validateRequestBody, standupSchemas } from "@/lib/shared";

// Validate request body
const validatedData = validateRequestBody(standupSchemas.create, requestBody);

// Validate query parameters
const validatedQuery = validateQueryParams(paginationSchema, queryParams);
```

### Middleware (`middleware.ts`)

Authentication, authorization, and rate limiting middleware:

```typescript
import { withMiddleware, createSuccessResponse } from "@/lib/shared";

export const GET = withMiddleware(
	async (context, validatedData) => {
		const { auth, supabase } = context;
		// Your API logic here
		return createSuccessResponse(data);
	},
	{
		requireAuth: true,
		requireRole: "admin",
		rateLimit: "api",
		validateQuery: mySchema,
	}
);
```

### Webhook Verification (`webhook-verification.ts`)

Secure webhook signature verification:

```typescript
import { withWebhookVerification } from "@/lib/shared";

export const POST = withWebhookVerification(
	async (req, body) => {
		// Process verified webhook
		const payload = JSON.parse(body);
		return new Response("OK");
	},
	"github" // or 'slack'
);
```

## Usage Examples

### Basic API Route

```typescript
// src/app/api/my-endpoint/route.ts
import { withMiddleware, createSuccessResponse } from "@/lib/shared";

export const GET = withMiddleware(
	async (context) => {
		const { auth, supabase } = context;

		const { data } = await supabase
			.from("my_table")
			.select("*")
			.eq("org_id", auth!.organization.id);

		return createSuccessResponse(data);
	},
	{ requireAuth: true, rateLimit: "api" }
);
```

### Webhook Handler

```typescript
// src/app/api/webhooks/github/route.ts
import { withWebhookVerification, webhookSchemas } from "@/lib/shared";

export const POST = withWebhookVerification(async (req, body) => {
	const payload = validateRequestBody(webhookSchemas.github, JSON.parse(body));

	// Process GitHub webhook
	console.log("Received:", payload.action);

	return new Response("OK");
}, "github");
```

### Error Handling

```typescript
import { APIErrors } from "@/lib/shared";

// In your API handler
if (!user) {
	throw APIErrors.notFound("User");
}

if (user.role !== "admin") {
	throw APIErrors.forbidden("Admin access required");
}

// Custom validation error
if (data.length > 1000) {
	throw APIErrors.validation("Data too large", {
		maxLength: 1000,
		actualLength: data.length,
	});
}
```

## Configuration

### Environment Variables

Required environment variables for the API foundation:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webhook Secrets
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

### Rate Limiting

Default rate limits are configured in `middleware.ts`:

- **auth**: 10 requests per 15 minutes
- **api**: 100 requests per minute
- **webhook**: 1000 requests per minute
- **cron**: 10 requests per minute

Custom rate limits can be applied per endpoint:

```typescript
export const POST = withMiddleware(handler, {
	rateLimit: { windowMs: 60000, maxRequests: 50 },
});
```

## Security Features

- **JWT Authentication**: Supabase Auth integration
- **Row Level Security**: Automatic RLS context setting
- **Rate Limiting**: Configurable per endpoint
- **Webhook Verification**: HMAC signature validation
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries only
- **Timing Attack Prevention**: Crypto.timingSafeEqual for signatures

## Error Response Format

All API errors follow a consistent format:

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Invalid input provided",
		"details": {
			"field": "email",
			"expected": "valid email address"
		}
	},
	"timestamp": "2024-01-01T12:00:00.000Z",
	"request_id": "req_1234567890_abc123"
}
```

## Success Response Format

Successful API responses use a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

For paginated responses:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "cursor": "next_page_token",
    "hasMore": true,
    "nextCursor": "next_token"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
