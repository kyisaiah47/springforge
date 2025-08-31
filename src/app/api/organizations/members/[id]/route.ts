import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
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

		// Only admins can remove members
		if (member.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Get target member to verify they're in the same organization
		const { data: targetMember, error: targetError } = await supabase
			.from("members")
			.select("org_id, role")
			.eq("id", id)
			.eq("deleted_at", null)
			.single();

		if (targetError || !targetMember) {
			return NextResponse.json(
				{ error: "Target member not found" },
				{ status: 404 }
			);
		}

		if (targetMember.org_id !== member.org_id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Prevent removing self if it would leave no admins
		if (id === member.id) {
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

		// Soft delete the member
		const { error: deleteError } = await supabase
			.from("members")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", id)
			.eq("org_id", member.org_id);

		if (deleteError) {
			console.error("Error removing member:", deleteError);
			return NextResponse.json(
				{ error: "Failed to remove member" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error removing member:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
