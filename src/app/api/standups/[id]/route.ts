import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAutoStandService } from "@/lib/modules/autostand/service";
import { createAPIError } from "@/lib/shared/api-error";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = await createClient();

		// Check authentication
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				createAPIError("UNAUTHORIZED", "Authentication required"),
				{ status: 401 }
			);
		}

		// Get user's organization
		const { data: member, error: memberError } = await supabase
			.from("members")
			.select("org_id")
			.eq("email", user.email!)
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Get standup by ID
		const autoStandService = createAutoStandService();
		const standup = await autoStandService.getStandupById(
			member.org_id,
			params.id
		);

		return NextResponse.json({ standup });
	} catch (error) {
		console.error("Get standup by ID error:", error);

		if (error instanceof Error) {
			if (error.message.includes("not found")) {
				return NextResponse.json(
					createAPIError("NOT_FOUND", "Standup not found"),
					{ status: 404 }
				);
			}

			return NextResponse.json(
				createAPIError("INTERNAL_ERROR", error.message),
				{
					status: 500,
				}
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
}
