const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Testing Supabase connection...");
console.log("URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
	try {
		console.log("Attempting to query organizations table...");
		const { data, error } = await supabase
			.from("organizations")
			.select("id, name")
			.limit(1);

		if (error) {
			console.error("❌ Database error:", error);

			if (error.code === "PGRST002") {
				console.log("\n🔧 SOLUTION:");
				console.log("The database schema has not been applied yet.");
				console.log(
					"Please go to your Supabase Dashboard and run the migrations:"
				);
				console.log(
					"1. Go to: https://supabase.com/dashboard/projects/elzvuygkbzmglmsafegt"
				);
				console.log('2. Click "SQL Editor" in the left sidebar');
				console.log("3. Create a new query");
				console.log(
					"4. Copy and paste the entire content from deploy-migrations.sql"
				);
				console.log('5. Click "Run" to execute the migration');
			}
			return;
		}

		console.log("✅ Database connection successful!");
		console.log("Organizations table exists and is accessible");
		console.log("Data:", data);
	} catch (err) {
		console.error("❌ Unexpected error:", err);
	}
}

testDatabase();
