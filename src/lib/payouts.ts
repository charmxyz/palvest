import "server-only";
import { db, transaction } from "./db";
import { getBackings, getDistributions, getProposal, getPublishedVideo, settlement } from "./data";
import { round2, splitPool } from "./finance";
import { HttpError } from "./api";
import {
  captureOrReadOrder,
  completedCapture,
  createOrder,
  createPayout,
  getPayout,
  PayPalError,
  paypalConfigured,
} from "./paypal";

/** Record the ledger for everything currently owed to Pals, before any money moves. */
export async function createDistribution(proposalId: string, status: "awaiting_funding" | "pending") {
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new HttpError("Project not found", 404);
  const [video, dists, backings] = await Promise.all([
    getPublishedVideo(proposalId),
    getDistributions(proposalId),
    getBackings(proposalId),
  ]);
  if (!video) throw new HttpError("Publish the video before distributing revenue.", 409);
  const { outstanding } = settlement(proposal, video, dists);
  if (outstanding < 0.01) throw new HttpError("Nothing new to distribute yet.", 409);

  // One payout line per Pal, even if they backed more than once.
  const byPal = new Map<string, { email: string | null; name: string | null; amount: number }>();
  for (const b of backings) {
    const key = b.backerEmail?.toLowerCase() ?? `anon:${b.id}`;
    const cur = byPal.get(key);
    if (cur) cur.amount += b.amount;
    else byPal.set(key, { email: b.backerEmail?.toLowerCase() ?? null, name: b.backerName, amount: b.amount });
  }
  const lines = splitPool(outstanding, [...byPal.values()]).filter(
    (l): l is typeof l & { email: string } => l.email !== null && l.payout >= 0.01,
  );
  const pool = round2(lines.reduce((a, l) => a + l.payout, 0));

  return transaction(async (tx) => {
    // An abandoned checkout from a previous click is superseded by this one.
    await tx`delete from distributions where proposal_id = ${proposalId} and status = 'awaiting_funding'`;
    const [dist] = await tx`
      insert into distributions ${tx({
        proposal_id: proposalId,
        gross_eligible_revenue: video.eligibleRevenue,
        backer_pool_amount: pool,
        status,
      })}
      returning id`;
    if (lines.length) {
      await tx`
        insert into distribution_items ${tx(
          lines.map((l) => ({
            distribution_id: dist.id,
            backer_email: l.email,
            backer_name: l.name,
            contributed: l.amount,
            amount: l.payout,
          })),
        )}`;
    }
    return { id: dist.id as string, pool, lines: lines.length, title: proposal.title };
  });
}

/**
 * Step 1: the creator pays the Pal pool into Palvest with PayPal checkout.
 * Without PayPal credentials the ledger is recorded and nothing is charged.
 */
export async function startDistribution(
  proposalId: string,
  urls: { success: (distributionId: string) => string; cancel: string },
) {
  if (!paypalConfigured()) {
    const dist = await createDistribution(proposalId, "pending");
    await db()`update distributions set status = 'ledger_only' where id = ${dist.id}`;
    return { distributionId: dist.id, pool: dist.pool, pals: dist.lines, orderId: null, approveUrl: null };
  }
  const dist = await createDistribution(proposalId, "awaiting_funding");
  const order = await createOrder({
    referenceId: dist.id,
    description: `Palvest revenue share for ${dist.lines} Pals: ${dist.title}`,
    itemName: `Pal revenue share: ${dist.title}`,
    amount: dist.pool,
    returnUrl: urls.success(dist.id),
    cancelUrl: urls.cancel,
  });
  await db()`update distributions set funding_order_id = ${order.id} where id = ${dist.id}`;
  return { distributionId: dist.id, pool: dist.pool, pals: dist.lines, orderId: order.id, approveUrl: order.approveUrl };
}

/**
 * Step 2: confirm the creator's payment server-side, then pay every Pal via
 * PayPal Payouts. Idempotent: repeated calls return the current status.
 */
export async function fundDistribution(distributionId: string) {
  const sql = db();
  const [dist] = await sql`
    select d.*, p.title from distributions d join proposals p on p.id = d.proposal_id
    where d.id = ${distributionId}`;
  if (!dist) throw new HttpError("Distribution not found", 404);
  if (dist.status !== "awaiting_funding") return { status: dist.status as string };
  if (!dist.funding_order_id) throw new HttpError("No PayPal order for this distribution.", 409);

  const capture = completedCapture(await captureOrReadOrder(dist.funding_order_id));
  if (!capture) throw new HttpError("The PayPal payment was not completed.", 402);
  if (capture.amount !== dist.backer_pool_amount || capture.referenceId !== dist.id) {
    throw new HttpError("Captured payment does not match this distribution.", 409);
  }

  const claimed = await sql`
    update distributions set status = 'pending', funding_capture_id = ${capture.id}, funded_at = now()
    where id = ${distributionId} and status = 'awaiting_funding'
    returning id`;
  if (!claimed.length) {
    const [cur] = await sql`select status from distributions where id = ${distributionId}`;
    return { status: cur.status as string };
  }
  try {
    return await sendDistribution(distributionId, dist.title);
  } catch {
    // The creator has paid; a Payouts failure is recorded on the ledger and can be retried.
    return { status: "failed" as const };
  }
}

/** Step 3: send a recorded distribution through PayPal Payouts (Sandbox). */
export async function sendDistribution(distributionId: string, title: string) {
  const sql = db();
  if (!paypalConfigured()) {
    await sql`update distributions set status = 'ledger_only' where id = ${distributionId}`;
    return { status: "ledger_only" as const };
  }
  const items = await sql`
    select id, backer_email, amount from distribution_items where distribution_id = ${distributionId}`;
  try {
    const batch = await createPayout({
      senderBatchId: distributionId,
      subject: "You earned revenue share on Palvest",
      message: `Your share of "${title}" revenue has arrived.`,
      items: items.map((i) => ({
        id: i.id,
        email: i.backer_email,
        amount: i.amount,
        note: `Palvest revenue share: ${title}`.slice(0, 4000),
      })),
    });
    await sql`
      update distributions set paypal_batch_id = ${batch.batch_header.payout_batch_id},
        status = 'processing', error = null
      where id = ${distributionId}`;
    return { status: "processing" as const, batchId: batch.batch_header.payout_batch_id };
  } catch (err) {
    const message = err instanceof PayPalError ? err.message : "PayPal payout failed";
    await sql`update distributions set status = 'failed', error = ${message} where id = ${distributionId}`;
    throw err;
  }
}

const BATCH_STATUS: Record<string, string> = {
  SUCCESS: "success",
  DENIED: "failed",
  CANCELED: "failed",
  PENDING: "processing",
  PROCESSING: "processing",
  NEW: "processing",
};

/** Pull the latest batch + item statuses from PayPal into the ledger. */
export async function syncDistribution(distributionId: string) {
  const sql = db();
  const [dist] = await sql`select * from distributions where id = ${distributionId}`;
  if (!dist) throw new HttpError("Distribution not found", 404);
  // Nothing to ask PayPal once a batch has finished (or was never sent).
  if (!dist.paypal_batch_id || dist.status === "success" || dist.status === "failed") {
    return { status: dist.status as string };
  }
  const batch = await getPayout(dist.paypal_batch_id);
  const status = BATCH_STATUS[batch.batch_header.batch_status] ?? "processing";
  // One statement for every item (a per-row loop is dozens of round trips to Supabase).
  const rows = (batch.items ?? [])
    .filter((i) => i.payout_item.sender_item_id)
    .map((i) => [i.payout_item.sender_item_id!, i.payout_item_id, i.transaction_status]);
  if (rows.length) {
    await sql`
      update distribution_items as di
      set paypal_item_id = v.item_id, transaction_status = v.status
      from (values ${sql(rows)}) as v(id, item_id, status)
      where di.id = v.id::uuid`;
  }
  await sql`update distributions set status = ${status} where id = ${distributionId}`;
  return { status, batchStatus: batch.batch_header.batch_status };
}
