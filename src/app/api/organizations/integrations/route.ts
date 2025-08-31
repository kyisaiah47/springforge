import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateIntegrationSchema = z.object({
	type: z.enum(["github", "slack"]),
	settings: z.record(z.string(), z.unknown()),
	access_token: z.string().optional(),
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

		// Get organization integrations (exclude access tokens for security)
		const { data: integrations, error: integrationsError } = await supabase
			.from("integrations")
			.select("id, type, settings, created_at")
			.eq("org_id", member.org_id)
			.eq("deleted_at", null)
			.order("created_at", { ascending: true });

		if (integrationsError) {
			console.error("Error fetching integrations:", integrationsError);
			return NextResponse.json(
				{ error: "Failed to fetch integrations" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			integrations,
			current_user_role: member.role,
		});
	} catch (error) {
		console.error("Error fetching integrations:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

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
			.eq("deleted_at", null)
			.single();

		if (memberError || !member) {
			return NextResponse.json({ error: "Member not found" }, { status: 404 });
		}

		// Only admins can create integrations
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = CreateIntegrationSchema.parse(body);

		// Check if integration of this type already exists
		const { data: existingIntegration } = await supabase
			.from("integrations")
			.select("id")
			.eq("org_id", member.org_id)
			.eq("type", validatedData.type)
			.eq("deleted_at", null)
			.single();

		if (existingIntegration) {
			return NextResponse.json(
				{ error: `${validatedData.type} integration already exists` },
				{ status: 409 }
			);
		}

		// Create new integration
		const { data: integration, error: createError } = await supabase
			.from("integrations")
			.insert({
				org_id: member.org_id,
				type: validatedData.type,
				settings: validatedData.settings,
				access_token: validatedData.access_token,
			})
			.select("id, type, settings, created_at")
			.single();

		if (createError) {
			console.error("Error creating integration:", createError);
			return NextResponse.json(
				{ error: "Failed to create integration" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ integration }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error creating integration:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
