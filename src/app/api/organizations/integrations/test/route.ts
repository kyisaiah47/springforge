import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TestIntegrationSchema = z.object({
	type: z.enum(["github", "slack"]),
	settings: z.record(z.string(), z.unknown()),
	access_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient();

		// Get authenticated user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user's organization and role
		const { data: member, error: memberError } = await supabase
			.from("members")
			.select("org_id, role")
			.eq("email", user.email!)
			.is("deleted_at", null)
			.single();

		if (memberError || !member) {
			console.error("Test API Member error:", memberError);
			return NextResponse.json({ error: "Member not found" }, { status: 404 });
		}

		// Only admins can test integrations
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = TestIntegrationSchema.parse(body);

		let testResult = { success: false, message: "", details: {} };

		if (validatedData.type === "slack") {
			// Test Slack webhook
			const webhookUrl = validatedData.settings.webhook_url as string;
			if (!webhookUrl) {
				return NextResponse.json(
					{ error: "Webhook URL is required for Slack integration" },
					{ status: 400 }
				);
			}

			try {
				const response = await fetch(webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						text: "🧪 SprintForge integration test - this message confirms your Slack webhook is working correctly!",
						username: "SprintForge",
						icon_emoji: ":rocket:",
					}),
				});

				if (response.ok) {
					testResult = {
						success: true,
						message: "Slack webhook test successful",
						details: { status: response.status },
					};
				} else {
					testResult = {
						success: false,
						message: "Slack webhook test failed",
						details: {
							status: response.status,
							statusText: response.statusText,
						},
					};
				}
			} catch (error) {
				testResult = {
					success: false,
					message: "Failed to connect to Slack webhook",
					details: {
						error: error instanceof Error ? error.message : "Unknown error",
					},
				};
			}
		} else if (validatedData.type === "github") {
			// Test GitHub API access
			const accessToken = validatedData.access_token;
			if (!accessToken) {
				return NextResponse.json(
					{ error: "Access token is required for GitHub integration" },
					{ status: 400 }
				);
			}

			try {
				const response = await fetch("https://api.github.com/user", {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"User-Agent": "SprintForge",
					},
				});

				if (response.ok) {
					const userData = await response.json();
					testResult = {
						success: true,
						message: "GitHub API test successful",
						details: {
							login: userData.login,
							name: userData.name,
							public_repos: userData.public_repos,
						},
					};
				} else {
					testResult = {
						success: false,
						message: "GitHub API test failed",
						details: {
							status: response.status,
							statusText: response.statusText,
						},
					};
				}
			} catch (error) {
				testResult = {
					success: false,
					message: "Failed to connect to GitHub API",
					details: {
						error: error instanceof Error ? error.message : "Unknown error",
					},
				};
			}
		}

		return NextResponse.json(testResult);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error testing integration:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
