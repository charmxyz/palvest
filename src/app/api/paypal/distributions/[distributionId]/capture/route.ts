import { route } from "@/lib/api";
import { fundDistribution } from "@/lib/payouts";

/** Capture the creator's payment into the Pal pool, then send PayPal Payouts to every Pal. */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/paypal/distributions/[distributionId]/capture">) => {
    const { distributionId } = await ctx.params;
    return Response.json(await fundDistribution(distributionId));
  },
);

// Allow time for slow upstream calls (Claude, PayPal Payouts, YouTube) on Vercel.
export const maxDuration = 60;
