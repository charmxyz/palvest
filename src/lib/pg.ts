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
    // Vercel Fluid compute serves many requests from one instance, so a single
    // connection made every request wait behind the slowest query.
    max: 5,
    // Never pipeline a second query onto a busy connection: Supabase's transaction
    // pooler stalls the connection when it does, which hung pages until the 20s
    // query timeout. Extra queries wait for a free connection instead.
    // (Supported at runtime but missing from postgres.js's types, hence the spread.)
    ...{ max_pipeline: 0 },
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connect_timeout: 10,
    onnotice: () => {},
    types: {
      numeric: { to: 1700, from: [1700], serialize: String, parse: Number.parseFloat },
      bigint: { to: 20, from: [20], serialize: String, parse: Number },
    },
    transform: { undefined: null },
  });
}
