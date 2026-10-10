// Usage: pnpm db:setup          create tables (idempotent) and load demo seed data
//        pnpm db:setup --schema create tables only
//        pnpm db:sql            write db/schema.sql for the Supabase SQL editor
import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { SCHEMA_SQL } from "../src/lib/schema";

config({ path: ".env.local" });
config();

async function main() {
  if (process.argv.includes("--print")) {
    writeFileSync("db/schema.sql", SCHEMA_SQL.trimStart());
    console.log("Wrote db/schema.sql");
    return;
  }
  const { createSql } = await import("../src/lib/pg");
  const { setupSchema, seedDatabase } = await import("../src/lib/seed");
  const sql = createSql();
  try {
    await setupSchema(sql);
    console.log("✓ Schema ready");
    if (!process.argv.includes("--schema")) {
      await seedDatabase(sql);
      const [{ count }] = await sql`select count(*) from proposals`;
      console.log(`✓ Seeded ${count} proposals`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  if (err?.code === "55P03" || err?.code === "57014") {
    console.error(
      "\n✗ The database is busy: another connection is using these tables.\n" +
        "  Stop `pnpm dev` (and any other app pointing at this database), then run this again.\n",
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
