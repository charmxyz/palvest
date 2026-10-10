import { z } from "zod";
import { body, HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";
import { sendDistribution } from "@/lib/payouts";

/** Send (or retry) an already-recorded distribution through PayPal Payouts. */
export const POST = route(async (req: Request) => {
  const { distributionId } = await body(req, z.object({ distributionId: z.string().uuid() }));
  const [dist] = await db()`
    select d.status, d.funding_capture_id, p.title from distributions d join proposals p on p.id = d.proposal_id
    where d.id = ${distributionId}`;
  if (!dist) throw new HttpError("Distribution not found", 404);
  const retryable =
    ["ledger_only", "pending"].includes(dist.status) || (dist.status === "failed" && dist.funding_capture_id);
  if (!retryable) throw new HttpError(`Distribution is ${dist.status}; nothing to send.`, 409);
  return Response.json(await sendDistribution(distributionId, dist.title));
});
