import { createClient } from "@supabase/supabase-js";
import { Database } from "../src/lib/types/database";

// This script tests the demo seeding functionality
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("❌ Missing Supabase configuration");
	console.log("Please ensure you have:");
	console.log("- NEXT_PUBLIC_SUPABASE_URL in your .env.local");
	console.log("- SUPABASE_SERVICE_ROLE_KEY in your .env.local");
	process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function testDemoSeed() {
	console.log("🧪 Testing demo seed functionality...");

	try {
		// Test database connection
		const { data, error } = await supabase
			.from("organizations")
			.select("count")
			.limit(1);

		if (error) {
			console.error("❌ Database connection failed:", error.message);
			return;
		}

		console.log("✅ Database connection successful");

		// Check if demo data already exists
		const { data: existingOrg } = await supabase
			.from("organizations")
			.select("id, name")
			.eq("name", "Demo Team")
			.single();

		if (existingOrg) {
			console.log("⚠️  Demo organization already exists:", existingOrg.name);
			console.log("   Organization ID:", existingOrg.id);

			// Count existing demo data
			const { data: members } = await supabase
				.from("members")
				.select("count")
				.eq("org_id", existingOrg.id);

			const { data: standups } = await supabase
				.from("standups")
				.select("count")
				.eq("org_id", existingOrg.id);

			const { data: prs } = await supabase
				.from("pr_insights")
				.select("count")
				.eq("org_id", existingOrg.id);

			console.log("   Demo data counts:");
			console.log(`   - Members: ${members?.[0]?.count || 0}`);
			console.log(`   - Standups: ${standups?.[0]?.count || 0}`);
			console.log(`   - PR Insights: ${prs?.[0]?.count || 0}`);
		} else {
			console.log("✅ No existing demo data found - ready for seeding");
		}

		console.log("\n🎯 To seed demo data:");
		console.log("1. Run: npm run db:seed");
		console.log("2. Or use the onboarding flow in the app");
		console.log("3. Or call the API: POST /api/onboarding/seed-demo");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Run the test if this file is executed directly
if (require.main === module) {
	testDemoSeed();
}

export { testDemoSeed };
