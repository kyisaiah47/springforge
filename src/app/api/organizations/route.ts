import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateOrganizationSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	settings: z
		.object({
			timezone: z.string().optional(),
			slack_webhook_url: z.string().url().optional().or(z.literal("")),
			github_org: z.string().optional(),
			feature_flags: z
				.object({
					notion_export: z.boolean().optional(),
					jira_integration: z.boolean().optional(),
					advanced_pr_scoring: z.boolean().optional(),
				})
				.optional(),
		})
		.optional(),
});

export async function GET() {
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

		// Get user's organization
		const { data: member, error: memberError } = await supabase
			.from("members")
			.select("org_id, role")
			.eq("email", user.email!)
			.eq("deleted_at", null)
			.single();

		if (memberError || !member) {
			return NextResponse.json({ error: "Member not found" }, { status: 404 });
		}

		// Get organization details
		const { data: organization, error: orgError } = await supabase
			.from("organizations")
			.select("*")
			.eq("id", member.org_id)
			.eq("deleted_at", null)
			.single();

		if (orgError || !organization) {
			return NextResponse.json(
				{ error: "Organization not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			organization,
			member_role: member.role,
		});
	} catch (error) {
		console.error("Error fetching organization:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
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
			.eq("deleted_at", null)
			.single();

		if (memberError || !member) {
			return NextResponse.json({ error: "Member not found" }, { status: 404 });
		}

		// Only admins can update organization settings
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = UpdateOrganizationSchema.parse(body);

		// Update organization
		const { data: organization, error: updateError } = await supabase
			.from("organizations")
			.update(validatedData)
			.eq("id", member.org_id)
			.eq("deleted_at", null)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating organization:", updateError);
			return NextResponse.json(
				{ error: "Failed to update organization" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ organization });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error updating organization:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
