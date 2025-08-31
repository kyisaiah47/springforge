import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateIntegrationSchema = z.object({
	settings: z.record(z.string(), z.unknown()).optional(),
	access_token: z.string().optional(),
});

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
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

		// Only admins can update integrations
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Verify integration belongs to user's organization
		const { data: existingIntegration, error: integrationError } =
			await supabase
				.from("integrations")
				.select("org_id")
				.eq("id", id)
				.eq("deleted_at", null)
				.single();

		if (integrationError || !existingIntegration) {
			return NextResponse.json(
				{ error: "Integration not found" },
				{ status: 404 }
			);
		}

		if (existingIntegration.org_id !== member.org_id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = UpdateIntegrationSchema.parse(body);

		// Update integration
		const { data: integration, error: updateError } = await supabase
			.from("integrations")
			.update(validatedData)
			.eq("id", id)
			.select("id, type, settings, created_at")
			.single();

		if (updateError) {
			console.error("Error updating integration:", updateError);
			return NextResponse.json(
				{ error: "Failed to update integration" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ integration });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error updating integration:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
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

		// Only admins can delete integrations
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Verify integration belongs to user's organization
		const { data: existingIntegration, error: integrationError } =
			await supabase
				.from("integrations")
				.select("org_id")
				.eq("id", id)
				.eq("deleted_at", null)
				.single();

		if (integrationError || !existingIntegration) {
			return NextResponse.json(
				{ error: "Integration not found" },
				{ status: 404 }
			);
		}

		if (existingIntegration.org_id !== member.org_id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Soft delete the integration
		const { error: deleteError } = await supabase
			.from("integrations")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", id);

		if (deleteError) {
			console.error("Error deleting integration:", deleteError);
			return NextResponse.json(
				{ error: "Failed to delete integration" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting integration:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
