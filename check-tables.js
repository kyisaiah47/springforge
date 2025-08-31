const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
	console.log("Checking database tables...");

	// Try to query information_schema to see what tables exist
	const { data, error } = await supabase
		.rpc("exec", {
			sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `,
		})
		.catch(async () => {
			// Fallback: try direct table access
			console.log("Trying direct table access...");
			return await supabase.from("organizations").select("id").limit(1);
		});

	if (error) {
		console.error("❌ Error:", error);
		console.log(
			"\n🔧 This suggests the database schema has not been applied yet."
		);
		console.log("Please make sure you:");
		console.log("1. Copied the entire deploy-migrations.sql content");
		console.log("2. Pasted it in Supabase Dashboard > SQL Editor");
		console.log("3. Executed the query successfully");
		return;
	}

	console.log("✅ Database accessible!");
	console.log("Data:", data);
}

checkTables();
