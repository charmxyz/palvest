import postgres from "postgres";

export function createSql(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Use your Supabase Postgres connection string (see README).",
    );
  }
  const isLocal = /localhost|127\.0\.0\.1|host=\//.test(url);
  return postgres(url, {
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
    ssl: isLocal ? false : "require",
    max: process.env.VERCEL ? 1 : 5,
    idle_timeout: 20,
    onnotice: () => {},
    types: {
      numeric: { to: 1700, from: [1700], serialize: String, parse: Number.parseFloat },
      bigint: { to: 20, from: [20], serialize: String, parse: Number },
    },
    transform: { undefined: null },
  });
}
