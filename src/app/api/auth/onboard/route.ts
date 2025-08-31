import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from("members")
      .select("*")
      .eq("email", user.email!)
      .eq("deleted_at", null)
      .single();

    if (existingMember) {
      // Update existing member with latest GitHub data
      const { data: updatedMember, error: updateError } = await supabase
        .from("members")
        .update({
          github_login: user.user_metadata?.user_name,
          github_id: user.user_metadata?.provider_id,
          avatar_url: user.user_metadata?.avatar_url,
        })
        .eq("id", existingMember.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating member:", updateError);
        return NextResponse.json(
          { error: "Failed to update member" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        member: updatedMember,
        isNewUser: false,
      });
    }

    // Use service role client to bypass RLS for onboarding
    const serviceSupabase = await createClient(true); // Pass true for service role

    // Create new organization for first-time users
    const { data: org, error: orgError } = await serviceSupabase
      .from("organizations")
      .insert({
        name: `${user.user_metadata?.full_name || user.email}'s Team`,
        settings: {
          timezone: "America/New_York",
        },
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 },
      );
    }

    // Create member record
    const { data: newMember, error: memberError } = await serviceSupabase
      .from("members")
      .insert({
        org_id: org.id,
        email: user.email!,
        github_login: user.user_metadata?.user_name,
        github_id: user.user_metadata?.provider_id,
        avatar_url: user.user_metadata?.avatar_url,
        role: "admin", // First user is admin
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error creating member:", memberError);
      return NextResponse.json(
        { error: "Failed to create member" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      member: newMember,
      organization: org,
      isNewUser: true,
    });
  } catch (error) {
    console.error("Error in onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
