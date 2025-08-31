# SprintForge API Documentation

This document provides comprehensive API documentation for SprintForge, including authentication, endpoints, request/response formats, and examples.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Authentication

SprintForge uses Supabase Auth with GitHub OAuth. All API endpoints require authentication unless otherwise specified.

### Authentication Flow

1. **Login**: Redirect to `/auth/login` for GitHub OAuth
2. **Token**: Supabase automatically manages JWT tokens via cookies
3. **Organization**: User must belong to an organization to access resources

### Headers

```http
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json
```

## Error Handling

All API endpoints return standardized error responses:

```typescript
interface APIError {
	error: {
		code: string;
		message: string;
		details?: any;
	};
	timestamp: string;
	request_id: string;
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Example Error Response

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Invalid request parameters",
		"details": [
			{
				"field": "limit",
				"message": "Must be between 1 and 100"
			}
		]
	},
	"timestamp": "2024-01-15T10:30:00Z",
	"request_id": "req_abc123"
}
```

## Pagination

List endpoints support cursor-based pagination:

### Query Parameters

- `limit` (number, 1-100, default: 20) - Number of items to return
- `cursor` (string, optional) - Pagination cursor for next page
- `order_by` (string) - Field to sort by
- `order_dir` (enum: "asc" | "desc", default: "desc") - Sort direction

### Response Format

```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "has_more": true,
    "next_cursor": "eyJpZCI6IjEyMyJ9"
  }
}
```

## Health Check

### GET /health

Check system health and dependencies.

**Response:**

```json
{
	"status": "healthy",
	"timestamp": "2024-01-15T10:30:00Z",
	"checks": {
		"database": { "status": "healthy", "response_time": 45 },
		"github_api": { "status": "healthy", "response_time": 120 },
		"slack_api": { "status": "degraded", "response_time": 2500 }
	},
	"version": "1.0.0"
}
```

## AutoStand Module

### GET /standups

Retrieve team standups with filtering and pagination.

**Query Parameters:**

- `member_id` (uuid, optional) - Filter by specific team member
- `date_from` (date, optional) - Start date (YYYY-MM-DD)
- `date_to` (date, optional) - End date (YYYY-MM-DD)
- `limit` (number, 1-100, default: 20)
- `cursor` (string, optional)
- `order_by` (enum: "date" | "created_at", default: "date")
- `order_dir` (enum: "asc" | "desc", default: "desc")

**Example Request:**

```bash
curl -X GET "https://api.sprintforge.com/standups?date_from=2024-01-01&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
	"standups": [
		{
			"id": "standup_123",
			"member_id": "member_456",
			"date": "2024-01-15",
			"yesterday": [
				"Completed user authentication flow",
				"Fixed bug in PR scoring algorithm"
			],
			"today": [
				"Implement real-time notifications",
				"Review pending pull requests"
			],
			"blockers": ["Waiting for API key from external service"],
			"member": {
				"id": "member_456",
				"github_login": "johndoe",
				"avatar_url": "https://github.com/johndoe.png"
			},
			"created_at": "2024-01-15T09:00:00Z"
		}
	],
	"pagination": {
		"limit": 10,
		"has_more": false,
		"next_cursor": null
	}
}
```

### POST /standups/generate

Generate standup for a specific member or all team members.

**Request Body:**

```json
{
	"member_id": "member_456", // optional, generates for all if omitted
	"date": "2024-01-15", // optional, defaults to today
	"post_to_slack": true // optional, defaults to false
}
```

**Example Response:**

```json
{
	"generated": [
		{
			"member_id": "member_456",
			"standup_id": "standup_789",
			"posted_to_slack": true
		}
	],
	"errors": []
}
```

### GET /standups/{id}

Retrieve a specific standup by ID.

**Example Response:**

```json
{
  "id": "standup_123",
  "member_id": "member_456",
  "date": "2024-01-15",
  "yesterday": ["Completed feature X"],
  "today": ["Work on feature Y"],
  "blockers": [],
  "raw_github_data": {
    "commits": [...],
    "prs": [...],
    "issues": [...]
  },
  "created_at": "2024-01-15T09:00:00Z"
}
```

## PR Radar Module

### GET /prs

Retrieve PR insights with filtering and pagination.

**Query Parameters:**

- `status` (enum: "open" | "merged" | "closed", optional)
- `repo` (string, optional) - Filter by repository name
- `author_member_id` (uuid, optional) - Filter by PR author
- `risk_min` (number, 0-10, optional) - Minimum risk score
- `risk_max` (number, 0-10, optional) - Maximum risk score
- `limit` (number, 1-100, default: 20)
- `cursor` (string, optional)
- `order_by` (enum: "opened_at" | "updated_at" | "risk_score" | "size_score", default: "updated_at")
- `order_dir` (enum: "asc" | "desc", default: "desc")

**Example Request:**

```bash
curl -X GET "https://api.sprintforge.com/prs?status=open&risk_min=7" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
	"pr_insights": [
		{
			"id": "pr_insight_123",
			"repo": "sprintforge/backend",
			"number": 42,
			"title": "Add new authentication system",
			"author_member_id": "member_456",
			"additions": 1250,
			"deletions": 340,
			"files_changed": 15,
			"tests_changed": 8,
			"touched_paths": ["src/auth/", "src/middleware/", "tests/auth/"],
			"size_score": 8.5,
			"risk_score": 7.2,
			"suggested_reviewers": [
				{
					"member_id": "member_789",
					"github_login": "janedoe",
					"reasoning": "Code ownership in auth module",
					"confidence": 0.9
				}
			],
			"status": "open",
			"opened_at": "2024-01-14T15:30:00Z",
			"updated_at": "2024-01-15T10:15:00Z"
		}
	],
	"pagination": {
		"limit": 20,
		"has_more": true,
		"next_cursor": "eyJpZCI6IjEyMyJ9"
	}
}
```

### POST /prs

Create or update a PR insight from GitHub webhook data.

**Request Body:**

```json
{
	"repo": "sprintforge/backend",
	"number": 42,
	"github_data": {
		"number": 42,
		"title": "Add new authentication system",
		"body": "This PR implements...",
		"state": "open",
		"merged": false,
		"additions": 1250,
		"deletions": 340,
		"changed_files": 15,
		"commits": 8,
		"author": {
			"login": "johndoe",
			"id": 12345
		},
		"base": {
			"ref": "main",
			"repo": {
				"name": "backend",
				"full_name": "sprintforge/backend"
			}
		},
		"head": {
			"ref": "feature/auth-system"
		},
		"created_at": "2024-01-14T15:30:00Z",
		"updated_at": "2024-01-15T10:15:00Z",
		"merged_at": null,
		"files": [
			{
				"filename": "src/auth/service.ts",
				"status": "added",
				"additions": 150,
				"deletions": 0,
				"changes": 150
			}
		]
	}
}
```

**Example Response:**

```json
{
  "pr_insight": {
    "id": "pr_insight_123",
    "repo": "sprintforge/backend",
    "number": 42,
    "size_score": 8.5,
    "risk_score": 7.2,
    "suggested_reviewers": [...]
  },
  "created": true
}
```

### POST /prs/score

Calculate risk and size scores for a PR.

**Request Body:**

```json
{
	"additions": 1250,
	"deletions": 340,
	"files_changed": 15,
	"touched_paths": ["src/auth/", "src/middleware/"],
	"tests_changed": 8
}
```

**Example Response:**

```json
{
	"size_score": 8.5,
	"risk_score": 7.2,
	"factors": {
		"size_factor": 0.8,
		"complexity_factor": 0.7,
		"test_coverage_factor": 0.6,
		"critical_path_factor": 0.9
	}
}
```

### GET /prs/suggestions/{pr_id}

Get reviewer suggestions for a specific PR.

**Example Response:**

```json
{
	"suggestions": [
		{
			"member_id": "member_789",
			"github_login": "janedoe",
			"reasoning": "Code ownership in auth module (85% of changes)",
			"confidence": 0.9,
			"expertise_areas": ["authentication", "security"]
		},
		{
			"member_id": "member_101",
			"github_login": "bobsmith",
			"reasoning": "Recent commits in similar areas",
			"confidence": 0.7,
			"expertise_areas": ["middleware", "api"]
		}
	]
}
```

## Retro Arena Module

### GET /retros

Retrieve retrospectives with filtering and pagination.

**Query Parameters:**

- `status` (enum: "planning" | "active" | "voting" | "completed" | "archived", optional)
- `created_by` (uuid, optional) - Filter by creator
- `limit` (number, 1-100, default: 20)
- `cursor` (string, optional)
- `order_by` (enum: "created_at" | "updated_at", default: "created_at")
- `order_dir` (enum: "asc" | "desc", default: "desc")

**Example Response:**

```json
{
	"retros": [
		{
			"id": "retro_123",
			"title": "Sprint 15 Retrospective",
			"sprint": "Sprint 15",
			"status": "active",
			"created_by": "member_456",
			"created_at": "2024-01-15T09:00:00Z",
			"notes_count": 12,
			"participants_count": 5
		}
	],
	"pagination": {
		"limit": 20,
		"has_more": false,
		"next_cursor": null
	}
}
```

### POST /retros

Create a new retrospective.

**Request Body:**

```json
{
	"title": "Sprint 15 Retrospective",
	"sprint": "Sprint 15", // optional
	"template": "standard" // optional: "standard" | "mad_sad_glad" | "start_stop_continue"
}
```

**Example Response:**

```json
{
	"retro": {
		"id": "retro_123",
		"title": "Sprint 15 Retrospective",
		"sprint": "Sprint 15",
		"status": "planning",
		"created_by": "member_456",
		"created_at": "2024-01-15T09:00:00Z"
	}
}
```

### POST /retros/{id}/notes

Add a note to a retrospective.

**Request Body:**

```json
{
	"column_key": "went_well",
	"text": "Great team collaboration this sprint",
	"color": "green",
	"is_anonymous": false
}
```

**Example Response:**

```json
{
	"note": {
		"id": "note_456",
		"retro_id": "retro_123",
		"author_member_id": "member_456",
		"column_key": "went_well",
		"text": "Great team collaboration this sprint",
		"color": "green",
		"votes": 0,
		"is_anonymous": false,
		"created_at": "2024-01-15T10:30:00Z"
	}
}
```

### PUT /retros/{id}/notes/{note_id}/vote

Vote on a retrospective note.

**Request Body:**

```json
{
	"action": "add" // or "remove"
}
```

**Example Response:**

```json
{
	"note": {
		"id": "note_456",
		"votes": 3,
		"updated_at": "2024-01-15T11:00:00Z"
	}
}
```

### POST /retros/{id}/export

Export retrospective results.

**Request Body:**

```json
{
	"format": "markdown", // or "json"
	"include_votes": true,
	"include_anonymous": false
}
```

**Example Response:**

```json
{
	"export": {
		"format": "markdown",
		"content": "# Sprint 15 Retrospective\n\n## What Went Well\n...",
		"file_name": "sprint-15-retrospective.md",
		"created_at": "2024-01-15T12:00:00Z"
	}
}
```

## Debug Arcade Module

### GET /arcade/levels

Retrieve coding challenges with filtering and pagination.

**Query Parameters:**

- `difficulty` (enum: "easy" | "medium" | "hard", optional)
- `language` (enum: "typescript" | "python", optional)
- `completed` (boolean, optional) - Filter by user completion status
- `limit` (number, 1-100, default: 20)
- `cursor` (string, optional)
- `order_by` (enum: "created_at" | "difficulty" | "completion_rate", default: "created_at")
- `order_dir` (enum: "asc" | "desc", default: "asc")

**Example Response:**

```json
{
	"levels": [
		{
			"id": "level_123",
			"slug": "array-sum-bug",
			"title": "Array Sum Bug Fix",
			"description": "Find and fix the bug in this array summation function",
			"language": "typescript",
			"difficulty": "easy",
			"points": 100,
			"completion_rate": 0.85,
			"user_completed": false,
			"user_best_time": null,
			"created_at": "2024-01-10T00:00:00Z"
		}
	],
	"pagination": {
		"limit": 20,
		"has_more": true,
		"next_cursor": "eyJpZCI6IjEyMyJ9"
	}
}
```

### GET /arcade/levels/{id}

Get detailed information about a specific challenge.

**Example Response:**

```json
{
	"level": {
		"id": "level_123",
		"slug": "array-sum-bug",
		"title": "Array Sum Bug Fix",
		"description": "Find and fix the bug in this array summation function. The function should return the sum of all numbers in the array.",
		"language": "typescript",
		"difficulty": "easy",
		"starter_code": "function sumArray(numbers: number[]): number {\n  let sum = 0;\n  for (let i = 0; i <= numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum;\n}",
		"test_cases": "// Test cases will be run against your solution\nexpect(sumArray([1, 2, 3])).toBe(6);\nexpect(sumArray([])).toBe(0);",
		"points": 100,
		"hints": [
			"Check the loop condition carefully",
			"What happens when you access an array index that doesn't exist?"
		],
		"created_at": "2024-01-10T00:00:00Z"
	}
}
```

### POST /arcade/run

Submit and run code for a challenge.

**Request Body:**

```json
{
	"level_id": "level_123",
	"submitted_code": "function sumArray(numbers: number[]): number {\n  let sum = 0;\n  for (let i = 0; i < numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum;\n}"
}
```

**Example Response:**

```json
{
	"run": {
		"id": "run_456",
		"level_id": "level_123",
		"member_id": "member_456",
		"passed": true,
		"duration_ms": 1250,
		"points_awarded": 100,
		"test_output": "✅ All tests passed!\n\nTest Results:\n- sumArray([1, 2, 3]) → 6 ✅\n- sumArray([]) → 0 ✅\n- sumArray([5, -2, 10]) → 13 ✅",
		"created_at": "2024-01-15T14:30:00Z"
	},
	"leaderboard_position": 15,
	"personal_best": true
}
```

### GET /arcade/leaderboard

Get the global or level-specific leaderboard.

**Query Parameters:**

- `level_id` (uuid, optional) - Specific level leaderboard
- `timeframe` (enum: "all_time" | "monthly" | "weekly", default: "all_time")
- `limit` (number, 1-100, default: 20)
- `cursor` (string, optional)

**Example Response:**

```json
{
	"leaderboard": [
		{
			"rank": 1,
			"member_id": "member_789",
			"github_login": "codewizard",
			"avatar_url": "https://github.com/codewizard.png",
			"total_points": 2500,
			"levels_completed": 25,
			"average_time": 1850,
			"best_streak": 12
		}
	],
	"user_position": {
		"rank": 15,
		"total_points": 800,
		"levels_completed": 8
	},
	"pagination": {
		"limit": 20,
		"has_more": true,
		"next_cursor": "eyJyYW5rIjoyMH0="
	}
}
```

## Webhooks

### POST /webhooks/github

Handle GitHub webhook events for PR updates.

**Headers:**

```http
X-GitHub-Event: pull_request
X-Hub-Signature-256: sha256=<signature>
Content-Type: application/json
```

**Request Body:** GitHub webhook payload (varies by event type)

**Example Response:**

```json
{
	"processed": true,
	"event_type": "pull_request",
	"action": "opened",
	"pr_insight_id": "pr_insight_123"
}
```

### POST /webhooks/slack

Handle Slack webhook events and interactive components.

**Request Body:** Slack webhook payload

**Example Response:**

```json
{
	"processed": true,
	"response_type": "ephemeral",
	"text": "Command processed successfully"
}
```

## Cron Jobs

### POST /cron/daily-standups

Trigger daily standup generation (called by Vercel Cron).

**Headers:**

```http
Authorization: Bearer <cron-secret>
```

**Example Response:**

```json
{
	"processed": true,
	"standups_generated": 15,
	"slack_posts": 15,
	"errors": []
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour per user
- **Webhook endpoints**: 100 requests per minute per IP
- **Public endpoints**: 60 requests per hour per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
```

## SDK and Client Libraries

### JavaScript/TypeScript

```typescript
import { SprintForgeClient } from '@sprintforge/sdk';

const client = new SprintForgeClient({
  baseUrl: 'https://api.sprintforge.com',
  apiKey: 'your-api-key'
});

// Get standups
const standups = await client.standups.list({
  date_from: '2024-01-01',
  limit: 10
});

// Create PR insight
const prInsight = await client.prs.create({
  repo: 'my-org/my-repo',
  number: 42,
  github_data: {...}
});
```

### cURL Examples

```bash
# Get health status
curl -X GET "https://api.sprintforge.com/health"

# List standups
curl -X GET "https://api.sprintforge.com/standups?limit=5" \
  -H "Authorization: Bearer <token>"

# Generate standup
curl -X POST "https://api.sprintforge.com/standups/generate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"post_to_slack": true}'

# Get PR insights
curl -X GET "https://api.sprintforge.com/prs?status=open&risk_min=7" \
  -H "Authorization: Bearer <token>"
```

## Changelog

### v1.0.0 (2024-01-15)

- Initial API release
- AutoStand, PR Radar, Retro Arena, and Debug Arcade modules
- GitHub and Slack integrations
- Real-time collaboration features
- Comprehensive authentication and authorization

---

For additional support or questions, please refer to the [main documentation](./README.md) or open an issue in the repository.
