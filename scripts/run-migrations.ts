import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function runMigrations() {
	console.log("🚀 Database Migration Helper");
	console.log(
		"⚠️  Note: Supabase client cannot execute DDL statements directly."
	);
	console.log("   Please copy and paste the SQL into your Supabase dashboard.");

	try {
		const migrationsDir = join(process.cwd(), "supabase", "migrations");
		const migrationFiles = readdirSync(migrationsDir)
			.filter((file) => file.endsWith(".sql"))
			.sort();

		console.log(`\nFound ${migrationFiles.length} migration files:\n`);

		for (const file of migrationFiles) {
			console.log(`📄 Migration: ${file}`);
			console.log("─".repeat(50));

			const migrationPath = join(migrationsDir, file);
			const migrationSQL = readFileSync(migrationPath, "utf-8");

			console.log(migrationSQL);
			console.log("─".repeat(50));
			console.log(
				`✅ Please execute the above SQL in Supabase Dashboard > SQL Editor\n`
			);
		}

		console.log("🎯 Instructions:");
		console.log("1. Go to your Supabase project dashboard");
		console.log("2. Navigate to SQL Editor");
		console.log("3. Create a new query");
		console.log("4. Copy and paste each migration SQL above");
		console.log("5. Execute the queries in order");
	} catch (error) {
		console.error("❌ Error reading migrations:", error);
		process.exit(1);
	}
}

// Alternative function for manual SQL execution
async function executeSQLFile(filePath: string) {
	try {
		const sql = readFileSync(filePath, "utf-8");
		console.log(`Executing SQL from: ${filePath}`);

		console.log("SQL content:");
		console.log(sql);
		console.log(
			"\n⚠️  Please execute this SQL manually in your Supabase dashboard"
		);
		console.log("   Go to: Project Settings > SQL Editor > New Query");
	} catch (error) {
		console.error("Error reading SQL file:", error);
	}
}

// Run migrations if this file is executed directly
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length > 0 && args[0] === "--file") {
		const filePath = args[1];
		if (filePath) {
			executeSQLFile(filePath);
		} else {
			console.error("Please provide a file path: --file path/to/migration.sql");
		}
	} else {
		runMigrations();
	}
}
