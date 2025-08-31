import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPRRadarService } from "@/lib/modules/pr-radar/service";
import { createAPIError } from "@/lib/shared/api-error";
import { WebhookVerificationFactory } from "@/lib/shared/webhook-verification";
import type { GitHubPRData } from "@/lib/modules/pr-radar/types";

// GitHub webhook event types we handle
const githubEventSchema = z.object({
	action: z.string(),
	number: z.number().optional(),
	pull_request: z
		.object({
			id: z.number(),
			number: z.number(),
			title: z.string(),
			body: z.string().nullable(),
			state: z.enum(["open", "closed"]),
			merged: z.boolean(),
			additions: z.number(),
			deletions: z.number(),
			changed_files: z.number(),
			commits: z.number(),
			user: z.object({
				login: z.string(),
				id: z.number(),
			}),
			base: z.object({
				ref: z.string(),
				repo: z.object({
					name: z.string(),
					full_name: z.string(),
				}),
			}),
			head: z.object({
				ref: z.string(),
			}),
			created_at: z.string(),
			updated_at: z.string(),
			merged_at: z.string().nullable(),
		})
		.optional(),
	repository: z.object({
		name: z.string(),
		full_name: z.string(),
		owner: z.object({
			login: z.string(),
		}),
	}),
});

type GitHubWebhookEvent = z.infer<typeof githubEventSchema>;

/**
 * Convert GitHub webhook PR data to our internal format
 */
function convertWebhookPRToGitHubPRData(
	event: GitHubWebhookEvent,
	files?: Array<{
		filename: string;
		status: "added" | "removed" | "modified" | "renamed";
		additions: number;
		deletions: number;
		changes: number;
		patch?: string;
	}>
): GitHubPRData {
	if (!event.pull_request) {
		throw new Error("Pull request data not found in webhook event");
	}

	const pr = event.pull_request;

	return {
		number: pr.number,
		title: pr.title,
		body: pr.body || "",
		state: pr.state,
		merged: pr.merged,
		additions: pr.additions,
		deletions: pr.deletions,
		changed_files: pr.changed_files,
		commits: pr.commits,
		author: {
			login: pr.user.login,
			id: pr.user.id,
		},
		base: {
			ref: pr.base.ref,
			repo: {
				name: pr.base.repo.name,
				full_name: pr.base.repo.full_name,
			},
		},
		head: {
			ref: pr.head.ref,
		},
		created_at: pr.created_at,
		updated_at: pr.updated_at,
		merged_at: pr.merged_at,
		files: files || [],
	};
}

/**
 * Find organization by repository name
 */
async function findOrganizationByRepo(
	supabase: Awaited<ReturnType<typeof createClient>>,
	_repoFullName: string
): Promise<string | null> {
	// Try to find organization by checking GitHub integrations
	// that have access to this repository
	const { data: integrations, error } = await supabase
		.from("integrations")
		.select("org_id, settings")
		.eq("type", "github");

	if (error || !integrations) {
		return null;
	}

	// For now, we'll use a simple approach - return the first GitHub integration
	// In a real implementation, you'd want to check which org has access to this specific repo
	// This could be done by storing repo access in the integration settings
	// or by making a GitHub API call to check permissions

	// Simple fallback: return first GitHub integration's org
	if (integrations.length > 0) {
		return integrations[0].org_id;
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		// Get raw body for signature verification
		const body = await request.text();

		// Verify webhook signature
		const verifier = WebhookVerificationFactory.createGitHubVerifier();
		verifier.verifyRequest(body, request.headers);

		// Parse the webhook payload
		const event: GitHubWebhookEvent = JSON.parse(body);

		// Validate the event structure
		const validatedEvent = githubEventSchema.parse(event);

		// Get event type from headers
		const eventType = request.headers.get("x-github-event");

		// Only handle pull request events
		if (eventType !== "pull_request") {
			return NextResponse.json(
				{ message: "Event type not handled" },
				{ status: 200 }
			);
		}

		// Only handle specific PR actions
		const handledActions = ["opened", "synchronize", "closed", "reopened"];
		if (!handledActions.includes(validatedEvent.action)) {
			return NextResponse.json(
				{ message: "Action not handled" },
				{ status: 200 }
			);
		}

		if (!validatedEvent.pull_request) {
			return NextResponse.json(
				{ message: "No pull request data" },
				{ status: 200 }
			);
		}

		const supabase = await createClient();

		// Find the organization that should handle this webhook
		const orgId = await findOrganizationByRepo(
			supabase,
			validatedEvent.repository.full_name
		);

		if (!orgId) {
			console.warn(
				`No organization found for repository: ${validatedEvent.repository.full_name}`
			);
			return NextResponse.json(
				{ message: "Organization not found" },
				{ status: 200 }
			);
		}

		// Get GitHub integration for this organization to fetch file details
		const { data: integration, error: integrationError } = await supabase
			.from("integrations")
			.select("*")
			.eq("org_id", orgId)
			.eq("type", "github")
			.single();

		if (integrationError || !integration) {
			console.warn(`No GitHub integration found for org: ${orgId}`);
			return NextResponse.json(
				{ message: "GitHub integration not found" },
				{ status: 200 }
			);
		}

		// For PR events, we need to fetch file changes from GitHub API
		// since webhook payload doesn't include file details
		let files: Array<{
			filename: string;
			status: "added" | "removed" | "modified" | "renamed";
			additions: number;
			deletions: number;
			changes: number;
			patch?: string;
		}> = [];

		try {
			// Fetch file changes from GitHub API
			const response = await fetch(
				`https://api.github.com/repos/${validatedEvent.repository.full_name}/pulls/${validatedEvent.pull_request.number}/files`,
				{
					headers: {
						Authorization: `Bearer ${integration.access_token}`,
						Accept: "application/vnd.github.v3+json",
						"User-Agent": "SprintForge/1.0",
					},
				}
			);

			if (response.ok) {
				files = await response.json();
			} else {
				console.warn(
					`Failed to fetch PR files: ${response.status} ${response.statusText}`
				);
			}
		} catch (error) {
			console.warn("Error fetching PR files:", error);
		}

		// Convert webhook data to our internal format
		const githubPRData = convertWebhookPRToGitHubPRData(validatedEvent, files);

		// Create or update PR insight
		const prRadarService = createPRRadarService();
		const result = await prRadarService.createPRInsight(orgId, {
			repo: validatedEvent.repository.full_name,
			number: validatedEvent.pull_request.number,
			github_data: githubPRData,
		});

		console.log(
			`Processed PR webhook for ${validatedEvent.repository.full_name}#${validatedEvent.pull_request.number}: ${validatedEvent.action}`
		);

		return NextResponse.json({
			message: "Webhook processed successfully",
			pr_insight_id: result.pr_insight.id,
			created: result.created,
		});
	} catch (error) {
		console.error("GitHub webhook processing error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				createAPIError(
					"VALIDATION_ERROR",
					"Invalid webhook payload",
					error.issues
				),
				{ status: 400 }
			);
		}

		if (error instanceof Error) {
			// Don't expose internal errors to webhook sender
			if (error.message.includes("webhook")) {
				return NextResponse.json(
					createAPIError("WEBHOOK_ERROR", error.message),
					{ status: 400 }
				);
			}

			// Log internal errors but return generic message
			console.error("Internal webhook error:", error);
			return NextResponse.json(
				createAPIError("INTERNAL_ERROR", "Webhook processing failed"),
				{ status: 500 }
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
}
