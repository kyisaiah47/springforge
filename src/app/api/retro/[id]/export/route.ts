import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRetroService } from "@/lib/modules/retro";
import { RetroExportService } from "@/lib/modules/retro/export-service";
import { createAPIError } from "@/lib/shared/api-error";
import { logger, withMonitoring, generateRequestId } from "@/lib/monitoring";

const exportSchema = z.object({
	format: z.enum(["markdown", "notion"]).default("markdown"),
	options: z
		.object({
			includeVotes: z.boolean().default(true),
			includeAuthor: z.boolean().default(false),
			includeTimestamps: z.boolean().default(false),
			groupByColumn: z.boolean().default(true),
		})
		.optional(),
	notionOptions: z
		.object({
			pageId: z.string().optional(),
			databaseId: z.string().optional(),
			token: z.string().optional(),
		})
		.optional(),
});

export const POST = withMonitoring(async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const requestId = generateRequestId();
	logger.info("POST /api/retro/[id]/export", { requestId, retroId: id });

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
			.select("org_id, id")
			.eq("email", user.email!)
			.single();

		if (memberError || !member) {
			return NextResponse.json(
				createAPIError("FORBIDDEN", "User not found in any organization"),
				{ status: 403 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const {
			format,
			options = {},
			notionOptions = {},
		} = exportSchema.parse(body);

		// Get retro and verify organization access
		const retroService = createRetroService(supabase);
		const retro = await retroService.getRetro(id);

		if (!retro) {
			return NextResponse.json(createAPIError("NOT_FOUND", "Retro not found"), {
				status: 404,
			});
		}

		if (retro.org_id !== member.org_id) {
			return NextResponse.json(
				createAPIError(
					"FORBIDDEN",
					"Cannot access retro from different organization"
				),
				{ status: 403 }
			);
		}

		// Get retro notes
		const notes = await retroService.getRetroNotes(id);

		// Check organization settings for feature flags
		const { data: org, error: orgError } = await supabase
			.from("organizations")
			.select("settings")
			.eq("id", member.org_id)
			.single();

		if (orgError) {
			logger.warn("Could not fetch organization settings", {
				requestId,
				orgId: member.org_id,
				error: orgError.message,
			});
		}

		const orgSettings = org?.settings || {};
		const notionEnabled = orgSettings.notion_export_enabled === true;

		if (format === "markdown") {
			// Export to Markdown
			const markdown = RetroExportService.exportToMarkdown(
				retro,
				notes,
				options
			);

			logger.info("Retro exported to Markdown", {
				requestId,
				retroId: id,
				orgId: member.org_id,
				notesCount: notes.length,
			});

			return NextResponse.json({
				format: "markdown",
				content: markdown,
				filename: `retro-${retro.title
					.replace(/[^a-zA-Z0-9]/g, "-")
					.toLowerCase()}-${new Date().toISOString().split("T")[0]}.md`,
			});
		} else if (format === "notion") {
			// Check if Notion export is enabled
			if (!notionEnabled) {
				return NextResponse.json(
					createAPIError(
						"FEATURE_DISABLED",
						"Notion export is not enabled for this organization"
					),
					{ status: 403 }
				);
			}

			// Export to Notion
			const notionToken = notionOptions.token || orgSettings.notion_token;

			if (!notionToken) {
				return NextResponse.json(
					createAPIError(
						"CONFIGURATION_ERROR",
						"Notion token is required for Notion export"
					),
					{ status: 400 }
				);
			}

			const result = await RetroExportService.exportToNotion(
				retro,
				notes,
				notionToken,
				notionOptions
			);

			if (!result.success) {
				return NextResponse.json(
					createAPIError(
						"EXPORT_ERROR",
						result.error || "Failed to export to Notion"
					),
					{ status: 500 }
				);
			}

			logger.info("Retro exported to Notion", {
				requestId,
				retroId: id,
				orgId: member.org_id,
				pageUrl: result.pageUrl,
			});

			return NextResponse.json({
				format: "notion",
				success: true,
				pageUrl: result.pageUrl,
			});
		}

		return NextResponse.json(
			createAPIError("INVALID_FORMAT", "Unsupported export format"),
			{ status: 400 }
		);
	} catch (error) {
		logger.error("Export retro error", error as Error, {
			requestId,
			retroId: id,
		});

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				createAPIError(
					"VALIDATION_ERROR",
					"Invalid request data",
					error.issues
				),
				{ status: 400 }
			);
		}

		if (error instanceof Error) {
			return NextResponse.json(
				createAPIError("INTERNAL_ERROR", error.message),
				{ status: 500 }
			);
		}

		return NextResponse.json(
			createAPIError("INTERNAL_ERROR", "An unexpected error occurred"),
			{ status: 500 }
		);
	}
},
"POST /api/retro/[id]/export");
