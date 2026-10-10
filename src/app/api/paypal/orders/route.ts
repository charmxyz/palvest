import { z } from "zod";
import { appUrl, body, HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";
import { getProposal } from "@/lib/data";
import { round2 } from "@/lib/finance";
import { createOrder } from "@/lib/paypal";

const Input = z.object({
  proposalId: z.string().uuid(),
  amount: z.number().min(1, "Minimum backing is $1").max(10_000, "Maximum backing is $10,000"),
});

/** Create a PayPal Sandbox order and a pending backing that capture will confirm. */
export const POST = route(async (req: Request) => {
  const input = await body(req, Input);
  const amount = round2(input.amount);
  const proposal = await getProposal(input.proposalId);
  if (!proposal) throw new HttpError("Proposal not found", 404);
  if (proposal.status !== "funding") throw new HttpError("This video is no longer raising.", 409);
  const remaining = round2(proposal.fundingTarget - proposal.amountFunded);
  if (amount > remaining) {
    throw new HttpError(`Only $${remaining.toFixed(2)} left to raise — try a smaller amount.`, 409);
  }

  const base = appUrl(req);
  const order = await createOrder({
    referenceId: proposal.id,
    description: `Palvest backing: ${proposal.title}`,
    itemName: `Back "${proposal.title}"`,
    amount,
    returnUrl: `${base}/pals/${proposal.id}?checkout=return`,
    cancelUrl: `${base}/pals/${proposal.id}?checkout=cancel`,
  });

  await db()`
    insert into backings ${db()({
      proposal_id: proposal.id,
      amount,
      paypal_order_id: order.id,
      status: "pending",
    })}`;

  return Response.json({ orderId: order.id, approveUrl: order.approveUrl });
});
