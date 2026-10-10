import { z } from "zod";
import { body, HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";

export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/creators/[id]">) => {
  const { id } = await ctx.params;
  const { assumedRpm } = await body(req, z.object({ assumedRpm: z.number().min(0.1).max(100) }));
  const [row] = await db()`
    update creator_profiles set assumed_rpm = ${assumedRpm} where id = ${id} returning id`;
  if (!row) throw new HttpError("Creator not found", 404);
  return Response.json({ ok: true });
});
