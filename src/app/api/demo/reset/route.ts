import { cookies } from "next/headers";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { seedDatabase, setupSchema } from "@/lib/seed";
import { PAL_COOKIE } from "@/lib/session";

/** Demo control: wipe everything and reload the seed data. */
export const POST = route(async () => {
  const sql = db();
  await setupSchema(sql);
  await seedDatabase(sql);
  (await cookies()).delete(PAL_COOKIE);
  return Response.json({ ok: true });
});
