import { route } from "@/lib/api";
import { syncDistribution } from "@/lib/payouts";

/** Refresh payout batch status from PayPal. */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/paypal/payouts/[distributionId]">) => {
    const { distributionId } = await ctx.params;
    return Response.json(await syncDistribution(distributionId));
  },
);
