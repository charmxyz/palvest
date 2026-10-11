import { HttpError, route } from "@/lib/api";
import { db, transaction } from "@/lib/db";
import { getProposal } from "@/lib/data";
import { captureOrder, getOrder, PayPalError, type CaptureResult } from "@/lib/paypal";
import { setActivePal } from "@/lib/session";

/**
 * Capture an approved order. A backing only counts once PayPal reports the
 * capture COMPLETED for the expected amount; repeated calls are idempotent.
 */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/paypal/orders/[orderId]/capture">) => {
    const { orderId } = await ctx.params;
    const sql = db();
    const [backing] = await sql`select * from backings where paypal_order_id = ${orderId}`;
    if (!backing) throw new HttpError("Unknown order", 404);

    if (backing.status !== "completed") {
      let result: CaptureResult;
      try {
        result = await captureOrder(orderId);
      } catch (err) {
        // Already captured (e.g. a retried request): read the order instead.
        if (err instanceof PayPalError && /ORDER_ALREADY_CAPTURED/.test(err.message)) {
          result = await getOrder(orderId);
        } else {
          throw err;
        }
      }

      const unit = result.purchase_units[0];
      const capture = unit?.payments?.captures?.[0];
      if (result.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
        await sql`update backings set status = 'failed' where id = ${backing.id} and status = 'pending'`;
        throw new HttpError(`Payment was not completed (status: ${capture?.status ?? result.status}).`, 402);
      }
      if (Number(capture.amount.value) !== backing.amount || unit.reference_id !== backing.proposal_id) {
        throw new HttpError("Captured payment does not match this backing.", 409);
      }

      const name = [result.payer?.name?.given_name, result.payer?.name?.surname]
        .filter(Boolean)
        .join(" ");
      const email = result.payer?.email_address ?? null;

      await transaction(async (tx) => {
        const updated = await tx`
          update backings set
            status = 'completed',
            paypal_capture_id = ${capture.id},
            paypal_payer_id = ${result.payer?.payer_id ?? null},
            backer_name = ${name || null},
            backer_email = ${email},
            completed_at = now()
          where id = ${backing.id} and status <> 'completed'
          returning amount`;
        if (updated.length) {
          await tx`
            update proposals set
              amount_funded = amount_funded + ${backing.amount},
              status = case when status = 'funding' and amount_funded + ${backing.amount} >= funding_target
                            then 'funded' else status end
            where id = ${backing.proposal_id}`;
        }
      });
      if (email) await setActivePal(email);
    }

    const [final] = await sql`select * from backings where id = ${backing.id}`;
    const proposal = await getProposal(backing.proposal_id);
    return Response.json({
      backing: {
        id: final.id,
        amount: final.amount,
        captureId: final.paypal_capture_id,
        backerName: final.backer_name,
        backerEmail: final.backer_email,
      },
      proposal: proposal && {
        amountFunded: proposal.amountFunded,
        palCount: proposal.palCount,
        status: proposal.status,
      },
    });
  },
);
