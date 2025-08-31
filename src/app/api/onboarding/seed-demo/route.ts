import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database";

// This endpoint requires SUPABASE_SERVICE_ROLE_KEY to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error("Missing Supabase configuration for demo seeding");
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
	try {
		console.log("🌱 Starting demo data seeding via API...");

		// Create demo organization
		const { data: org, error: orgError } = await supabase
			.from("organizations")
			.insert({
				name: "Demo Team",
				settings: {
					timezone: "America/New_York",
					slack_webhook_url:
						"https://hooks.slack.com/services/demo/webhook/url",
				},
			})
			.select()
			.single();

		if (orgError) {
			console.error("Organization creation error:", orgError);
			throw orgError;
		}
		console.log("✅ Created demo organization:", org.name);

		// Create demo members
		const members = [
			{
				org_id: org.id,
				email: "alice@demo.com",
				github_login: "alice-dev",
				github_id: "12345",
				avatar_url: "https://github.com/alice-dev.png",
				role: "admin" as const,
			},
			{
				org_id: org.id,
				email: "bob@demo.com",
				github_login: "bob-coder",
				github_id: "67890",
				avatar_url: "https://github.com/bob-coder.png",
				role: "member" as const,
			},
			{
				org_id: org.id,
				email: "charlie@demo.com",
				github_login: "charlie-dev",
				github_id: "11111",
				avatar_url: "https://github.com/charlie-dev.png",
				role: "member" as const,
			},
		];

		const { data: createdMembers, error: membersError } = await supabase
			.from("members")
			.insert(members)
			.select();

		if (membersError) {
			console.error("Members creation error:", membersError);
			throw membersError;
		}
		console.log("✅ Created demo members:", createdMembers.length);

		// Create demo integrations
		const integrations = [
			{
				org_id: org.id,
				type: "github" as const,
				settings: {
					repositories: [
						"demo-org/frontend",
						"demo-org/backend",
						"demo-org/mobile",
					],
				},
			},
			{
				org_id: org.id,
				type: "slack" as const,
				settings: {
					channel: "#dev-team",
					webhook_url: "https://hooks.slack.com/services/demo/webhook/url",
				},
			},
		];

		const { error: integrationsError } = await supabase
			.from("integrations")
			.insert(integrations);

		if (integrationsError) {
			console.error("Integrations creation error:", integrationsError);
			throw integrationsError;
		}
		console.log("✅ Created demo integrations");

		// Create demo standups
		const today = new Date().toISOString().split("T")[0];

		const standups = createdMembers.map((member, index) => ({
			org_id: org.id,
			member_id: member.id,
			date: today,
			yesterday: [
				`Completed feature ${index + 1} implementation`,
				`Fixed bug in ${["authentication", "API", "UI"][index]} module`,
				"Reviewed 2 pull requests",
			],
			today: [
				`Working on ${
					["dashboard", "integration", "testing"][index]
				} improvements`,
				"Planning sprint retrospective",
				"Code review session at 2pm",
			],
			blockers: index === 1 ? ["Waiting for API documentation"] : [],
			raw_github_data: {
				commits: Math.floor(Math.random() * 5) + 1,
				prs_opened: Math.floor(Math.random() * 2),
				prs_merged: Math.floor(Math.random() * 3),
				issues_closed: Math.floor(Math.random() * 2),
			},
		}));

		const { error: standupsError } = await supabase
			.from("standups")
			.insert(standups);

		if (standupsError) {
			console.error("Standups creation error:", standupsError);
			throw standupsError;
		}
		console.log("✅ Created demo standups");

		// Create demo PR insights
		const prInsights = [
			{
				org_id: org.id,
				repo: "demo-org/frontend",
				number: 123,
				author_member_id: createdMembers[0].id,
				additions: 245,
				deletions: 67,
				files_changed: 8,
				tests_changed: 3,
				touched_paths: [
					"src/components/Dashboard.tsx",
					"src/pages/api/auth.ts",
				],
				size_score: 6.5,
				risk_score: 4.2,
				suggested_reviewers: ["bob-coder", "charlie-dev"],
				status: "open" as const,
				opened_at: new Date().toISOString(),
			},
			{
				org_id: org.id,
				repo: "demo-org/backend",
				number: 456,
				author_member_id: createdMembers[1].id,
				additions: 89,
				deletions: 23,
				files_changed: 4,
				tests_changed: 2,
				touched_paths: [
					"src/services/auth.service.ts",
					"src/controllers/user.controller.ts",
				],
				size_score: 3.8,
				risk_score: 2.1,
				suggested_reviewers: ["alice-dev"],
				status: "open" as const,
				opened_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			},
			{
				org_id: org.id,
				repo: "demo-org/mobile",
				number: 789,
				author_member_id: createdMembers[2].id,
				additions: 156,
				deletions: 34,
				files_changed: 6,
				tests_changed: 1,
				touched_paths: [
					"src/screens/LoginScreen.tsx",
					"src/navigation/AppNavigator.tsx",
				],
				size_score: 4.9,
				risk_score: 7.8,
				suggested_reviewers: ["alice-dev", "bob-coder"],
				status: "open" as const,
				opened_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
			},
		];

		const { error: prError } = await supabase
			.from("pr_insights")
			.insert(prInsights);

		if (prError) {
			console.error("PR insights creation error:", prError);
			throw prError;
		}
		console.log("✅ Created demo PR insights");

		// Create demo retro
		const { data: retro, error: retroError } = await supabase
			.from("retros")
			.insert({
				org_id: org.id,
				title: "Sprint 23 Retrospective",
				sprint: "Sprint 23",
				status: "active",
				created_by: createdMembers[0].id,
			})
			.select()
			.single();

		if (retroError) {
			console.error("Retro creation error:", retroError);
			throw retroError;
		}

		// Create demo retro notes
		const retroNotes = [
			{
				retro_id: retro.id,
				author_member_id: createdMembers[0].id,
				column_key: "went_well" as const,
				text: "Great collaboration on the new feature",
				color: "#10b981",
				votes: 3,
			},
			{
				retro_id: retro.id,
				author_member_id: createdMembers[1].id,
				column_key: "went_well" as const,
				text: "Improved our testing coverage significantly",
				color: "#3b82f6",
				votes: 2,
			},
			{
				retro_id: retro.id,
				author_member_id: createdMembers[2].id,
				column_key: "went_poorly" as const,
				text: "Communication gaps during deployment",
				color: "#ef4444",
				votes: 1,
			},
			{
				retro_id: retro.id,
				author_member_id: createdMembers[0].id,
				column_key: "ideas" as const,
				text: "Implement automated deployment pipeline",
				color: "#8b5cf6",
				votes: 4,
			},
			{
				retro_id: retro.id,
				author_member_id: createdMembers[1].id,
				column_key: "action_items" as const,
				text: "Set up weekly code review sessions",
				color: "#f59e0b",
				votes: 2,
			},
		];

		const { error: notesError } = await supabase
			.from("retro_notes")
			.insert(retroNotes);

		if (notesError) {
			console.error("Retro notes creation error:", notesError);
			throw notesError;
		}
		console.log("✅ Created demo retro and notes");

		// Create demo arcade levels
		const arcadeLevels = [
			{
				slug: "array-sum-bug",
				title: "Array Sum Bug",
				description: "Fix the off-by-one error in this array sum function",
				language: "typescript" as const,
				difficulty: "easy" as const,
				starter_code: `function sumArray(numbers: number[]): number {
  let sum = 0;
  for (let i = 0; i <= numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}`,
				test_cases: `// Test cases
console.assert(sumArray([1, 2, 3]) === 6);
console.assert(sumArray([]) === 0);
console.assert(sumArray([-1, 1]) === 0);`,
				solution: `function sumArray(numbers: number[]): number {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}`,
			},
			{
				slug: "string-reverse",
				title: "String Reverse Challenge",
				description:
					"Fix the string reversal function that's missing characters",
				language: "typescript" as const,
				difficulty: "medium" as const,
				starter_code: `function reverseString(str: string): string {
  let reversed = "";
  for (let i = str.length; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
				test_cases: `// Test cases
console.assert(reverseString("hello") === "olleh");
console.assert(reverseString("") === "");
console.assert(reverseString("a") === "a");`,
				solution: `function reverseString(str: string): string {
  let reversed = "";
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
			},
			{
				slug: "fibonacci-bug",
				title: "Fibonacci Sequence Bug",
				description: "Debug this recursive Fibonacci implementation",
				language: "typescript" as const,
				difficulty: "hard" as const,
				starter_code: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 3);
}`,
				test_cases: `// Test cases
console.assert(fibonacci(0) === 0);
console.assert(fibonacci(1) === 1);
console.assert(fibonacci(5) === 5);
console.assert(fibonacci(10) === 55);`,
				solution: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
			},
		];

		const { data: levels, error: levelsError } = await supabase
			.from("arcade_levels")
			.insert(arcadeLevels)
			.select();

		if (levelsError) {
			console.error("Arcade levels creation error:", levelsError);
			throw levelsError;
		}
		console.log("✅ Created demo arcade levels");

		// Create demo arcade runs
		const arcadeRuns = [
			{
				level_id: levels[0].id,
				member_id: createdMembers[0].id,
				submitted_code: levels[0].solution,
				passed: true,
				duration_ms: 45000,
				points_awarded: 100,
				test_output: "All tests passed! Great job fixing the off-by-one error.",
			},
			{
				level_id: levels[0].id,
				member_id: createdMembers[1].id,
				submitted_code: levels[0].starter_code,
				passed: false,
				duration_ms: 30000,
				points_awarded: 0,
				test_output: "Test failed: sumArray([1, 2, 3]) expected 6 but got NaN",
			},
			{
				level_id: levels[1].id,
				member_id: createdMembers[0].id,
				submitted_code: levels[1].solution,
				passed: true,
				duration_ms: 62000,
				points_awarded: 150,
				test_output: "Excellent! String reversal working perfectly.",
			},
		];

		const { error: runsError } = await supabase
			.from("arcade_runs")
			.insert(arcadeRuns);

		if (runsError) {
			console.error("Arcade runs creation error:", runsError);
			throw runsError;
		}
		console.log("✅ Created demo arcade runs");

		console.log("🎉 Demo data seeding completed successfully!");

		return NextResponse.json({
			success: true,
			message: "Demo data created successfully",
			organization: {
				id: org.id,
				name: org.name,
			},
			stats: {
				members: createdMembers.length,
				standups: standups.length,
				prInsights: prInsights.length,
				retroNotes: retroNotes.length,
				arcadeLevels: levels.length,
				arcadeRuns: arcadeRuns.length,
			},
		});
	} catch (error) {
		console.error("❌ Error seeding demo data:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to seed demo data",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
