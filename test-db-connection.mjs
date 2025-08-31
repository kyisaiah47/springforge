import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Testing database connection...");
console.log("URL:", supabaseUrl);
console.log("Service Key exists:", !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from("organizations")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database error:", error);
      return;
    }

    console.log("✅ Database connection successful!");
    console.log("Organizations table accessible:", data !== null);

    // Test if tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc("get_schema_tables")
      .catch(() => null);

    if (!tablesError && tables) {
      console.log("✅ Schema tables found:", tables.length);
    } else {
      console.log(
        "⚠️  Could not fetch schema info, but basic connection works",
      );
    }
  } catch (err) {
    console.error("❌ Connection test failed:", err);
  }
}

testConnection();
