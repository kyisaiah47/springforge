import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const InviteMemberSchema = z.object({
	email: z.string().email(),
	role: z.enum(["admin", "member"]).default("member"),
});

const UpdateMemberRoleSchema = z.object({
	member_id: z.string().uuid(),
	role: z.enum(["admin", "member"]),
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
			.is("deleted_at", null)
			.single();

		if (memberError || !member) {
			console.error("Member error:", memberError);
			return NextResponse.json({ error: "Member not found" }, { status: 404 });
		}

		// Get all organization members
		const { data: members, error: membersError } = await supabase
			.from("members")
			.select("*")
			.eq("org_id", member.org_id)
			.is("deleted_at", null)
			.order("created_at", { ascending: true });

		if (membersError) {
			console.error("Error fetching members:", membersError);
			return NextResponse.json(
				{ error: "Failed to fetch members" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			members,
			current_user_role: member.role,
		});
	} catch (error) {
		console.error("Error fetching members:", error);
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

		// Only admins can invite members
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = InviteMemberSchema.parse(body);

		// Check if member already exists
		const { data: existingMember } = await supabase
			.from("members")
			.select("id")
			.eq("email", validatedData.email)
			.eq("org_id", member.org_id)
			.eq("deleted_at", null)
			.single();

		if (existingMember) {
			return NextResponse.json(
				{ error: "Member already exists in organization" },
				{ status: 409 }
			);
		}

		// Create new member
		const { data: newMember, error: createError } = await supabase
			.from("members")
			.insert({
				org_id: member.org_id,
				email: validatedData.email,
				role: validatedData.role,
			})
			.select()
			.single();

		if (createError) {
			console.error("Error creating member:", createError);
			return NextResponse.json(
				{ error: "Failed to create member" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ member: newMember }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error inviting member:", error);
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
			.select("org_id, role, id")
			.eq("email", user.email!)
			.eq("deleted_at", null)
			.single();

		if (memberError || !member) {
			return NextResponse.json({ error: "Member not found" }, { status: 404 });
		}

		// Only admins can update member roles
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = UpdateMemberRoleSchema.parse(body);

		// Prevent self-demotion if it would leave no admins
		if (
			validatedData.member_id === member.id &&
			validatedData.role === "member"
		) {
			const { data: adminCount } = await supabase
				.from("members")
				.select("id", { count: "exact" })
				.eq("org_id", member.org_id)
				.eq("role", "admin")
				.eq("deleted_at", null);

			if (adminCount && adminCount.length <= 1) {
				return NextResponse.json(
					{ error: "Cannot remove the last admin from organization" },
					{ status: 400 }
				);
			}
		}

		// Update member role
		const { data: updatedMember, error: updateError } = await supabase
			.from("members")
			.update({ role: validatedData.role })
			.eq("id", validatedData.member_id)
			.eq("org_id", member.org_id)
			.eq("deleted_at", null)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating member role:", updateError);
			return NextResponse.json(
				{ error: "Failed to update member role" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ member: updatedMember });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error updating member role:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
