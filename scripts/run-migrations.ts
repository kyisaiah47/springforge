import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// Migration tracking table
const MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function runMigrations() {
	console.log("🚀 Database Migration Pipeline");

	// Check if we can connect to Supabase
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.log("⚠️  Environment variables not found. Running in manual mode.");
		return runManualMigrations();
	}

	try {
		const supabase = createClient(supabaseUrl, supabaseKey);

		// Create migrations tracking table
		console.log("📋 Setting up migration tracking...");
		const { error: tableError } = await supabase.rpc("exec_sql", {
			sql: MIGRATION_TABLE_SQL,
		});

		if (tableError) {
			console.log(
				"⚠️  Could not create migration table. Running in manual mode."
			);
			return runManualMigrations();
		}

		// Get executed migrations
		const { data: executedMigrations, error: queryError } = await supabase
			.from("_migrations")
			.select("filename");

		if (queryError) {
			console.log("⚠️  Could not query migrations. Running in manual mode.");
			return runManualMigrations();
		}

		const executedFiles = new Set(
			executedMigrations?.map((m) => m.filename) || []
		);

		// Read migration files
		const migrationsDir = join(process.cwd(), "supabase", "migrations");
		const migrationFiles = readdirSync(migrationsDir)
			.filter((file) => file.endsWith(".sql"))
			.sort();

		console.log(`\nFound ${migrationFiles.length} migration files`);

		let executed = 0;
		for (const file of migrationFiles) {
			if (executedFiles.has(file)) {
				console.log(`⏭️  Skipping ${file} (already executed)`);
				continue;
			}

			console.log(`🔄 Executing ${file}...`);
			const migrationPath = join(migrationsDir, file);
			const migrationSQL = readFileSync(migrationPath, "utf-8");

			const { error: execError } = await supabase.rpc("exec_sql", {
				sql: migrationSQL,
			});

			if (execError) {
				console.error(`❌ Failed to execute ${file}:`, execError);
				process.exit(1);
			}

			// Record migration as executed
			const { error: recordError } = await supabase
				.from("_migrations")
				.insert({ filename: file });

			if (recordError) {
				console.error(`⚠️  Migration executed but failed to record: ${file}`);
			}

			console.log(`✅ Executed ${file}`);
			executed++;
		}

		console.log(
			`\n🎉 Migration complete! Executed ${executed} new migrations.`
		);
	} catch (error) {
		console.error("❌ Migration error:", error);
		console.log("⚠️  Falling back to manual mode.");
		return runManualMigrations();
	}
}

async function runManualMigrations() {
	console.log("📋 Manual Migration Mode");
	console.log("   Copy and paste the SQL into your Supabase dashboard.");

	try {
		const migrationsDir = join(process.cwd(), "supabase", "migrations");
		const migrationFiles = readdirSync(migrationsDir)
			.filter((file) => file.endsWith(".sql"))
			.sort();

		console.log(`\nFound ${migrationFiles.length} migration files:\n`);

		// Generate combined migration file for deployment
		let combinedSQL = "-- SprintForge Database Migrations\n";
		combinedSQL += "-- Generated for deployment\n\n";
		combinedSQL += MIGRATION_TABLE_SQL + "\n";

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

			// Add to combined file
			combinedSQL += `-- Migration: ${file}\n`;
			combinedSQL += migrationSQL + "\n\n";
			combinedSQL += `INSERT INTO _migrations (filename) VALUES ('${file}') ON CONFLICT (filename) DO NOTHING;\n\n`;
		}

		// Write combined migration for deployment
		const deployPath = join(process.cwd(), "deploy-migrations.sql");
		writeFileSync(deployPath, combinedSQL);
		console.log(`📦 Combined migration written to: ${deployPath}`);

		console.log("\n🎯 Instructions:");
		console.log("1. Go to your Supabase project dashboard");
		console.log("2. Navigate to SQL Editor");
		console.log("3. Create a new query");
		console.log("4. Copy and paste each migration SQL above");
		console.log("5. Execute the queries in order");
		console.log(`6. Or use the combined file: ${deployPath}`);
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
