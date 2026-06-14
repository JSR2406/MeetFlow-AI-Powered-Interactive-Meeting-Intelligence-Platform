/**
 * MeetFlow Migration Runner
 * Runs the SQL migration directly against Supabase using the REST API
 * Usage: npx tsx scripts/run-migration.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  console.log("🚀 MeetFlow Migration Runner\n");

  if (!SUPABASE_URL || SUPABASE_URL.includes("your_")) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL not configured in .env.local");
    process.exit(1);
  }

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes("your_")) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
    console.error(
      "\nGet it from: Supabase Dashboard → Settings → API → service_role key"
    );
    console.error("Then add to .env.local: SUPABASE_SERVICE_ROLE_KEY=eyJ...\n");
    process.exit(1);
  }

  // Read the migration SQL file
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "0001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log(`📂 Migration file: ${sqlPath}`);
  console.log(`📊 SQL size: ${sql.length} bytes`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}\n`);

  // Split into individual statements for better error reporting
  // Run via Supabase REST API's /rest/v1/rpc won't work for DDL
  // Use the pg endpoint directly
  const pgUrl = SUPABASE_URL.replace("https://", "https://db.").replace(
    ".supabase.co",
    ".supabase.co"
  );

  console.log("📤 Sending migration via Supabase REST API...");

  // Use Supabase's SQL execution via the pg meta API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // Try the pg meta endpoint instead
    console.log("⚠️  RPC endpoint not available, trying pg meta API...");
    
    const metaResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!metaResponse.ok) {
      const error = await metaResponse.text();
      console.error("❌ Migration failed:", error);
      
      // Try statement by statement
      console.log("\n🔄 Retrying statement by statement...\n");
      await runStatementByStatement(sql, SUPABASE_URL, SERVICE_ROLE_KEY);
      return;
    }

    const result = await metaResponse.json();
    console.log("✅ Migration succeeded!", result);
    return;
  }

  const result = await response.json();
  console.log("✅ Migration succeeded!", result);
}

async function runStatementByStatement(
  sql: string,
  supabaseUrl: string,
  serviceKey: string
) {
  // Split SQL into individual statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Running ${statements.length} statements...\n`);

  let passed = 0;
  let skipped = 0;
  let failed = 0;

  for (const stmt of statements) {
    const preview = stmt.substring(0, 60).replace(/\n/g, " ");
    
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
          },
          body: JSON.stringify({ query: stmt + ";" }),
        }
      );

      if (response.ok) {
        console.log(`  ✅ ${preview}...`);
        passed++;
      } else {
        const err = await response.text();
        // Skip "already exists" errors (idempotent re-runs)
        if (
          err.includes("already exists") ||
          err.includes("duplicate key") ||
          err.includes("42710") ||
          err.includes("42P07")
        ) {
          console.log(`  ⏭️  SKIP (exists): ${preview}...`);
          skipped++;
        } else {
          console.log(`  ❌ FAIL: ${preview}...`);
          console.log(`     Error: ${err.substring(0, 120)}`);
          failed++;
        }
      }
    } catch (e) {
      console.log(`  ❌ ERROR: ${preview}...`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${skipped} skipped, ${failed} failed`);
  
  if (failed === 0) {
    console.log("🎉 Migration complete!");
  } else {
    console.log(`\n⚠️  ${failed} statements failed. This usually means:`);
    console.log("  1. The tables already exist (safe to ignore)");
    console.log("  2. A real error — check the errors above");
  }
}

runMigration().catch(console.error);
