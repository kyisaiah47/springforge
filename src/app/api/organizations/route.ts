import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateOrganizationSchema = z.object({
  name: z.string().min(1),
  settings: z.record(z.string(), z.unknown()),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.email);

    // Get user's organization and role
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("org_id, role")
      .eq("email", user.email!)
      .is("deleted_at", null)
      .single();

    if (memberError || !member) {
      console.error("Member query error:", memberError);
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    // Get the organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", member.org_id)
      .is("deleted_at", null)
      .single();

    if (orgError || !organization) {
      console.error("Organization query error:", orgError);
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      organization: organization,
      member_role: member.role,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
    const { data: member } = await supabase
      .from("members")
      .select("org_id, role")
      .eq("email", user.email!)
      .eq("deleted_at", null)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    // Only admins can update organization settings
    if (member.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateOrganizationSchema.parse(body);

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from("organizations")
      .update({
        name: validatedData.name,
        settings: validatedData.settings,
      })
      .eq("id", member.org_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating organization:", updateError);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      organization: updatedOrg,
      member_role: member.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
