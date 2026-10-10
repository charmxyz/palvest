import { connection } from "next/server";
import { z } from "zod";
import { appUrl, body, route } from "@/lib/api";
import { getDistributions } from "@/lib/data";
import { startDistribution } from "@/lib/payouts";

export const GET = route(
  async (_req: Request, ctx: RouteContext<"/api/projects/[id]/distributions">) => {
    await connection();
    const { id } = await ctx.params;
    return Response.json({ distributions: await getDistributions(id) });
  },
);

const Input = z.object({ basePath: z.string().regex(/^\/creator\/[^/?#]+$/) });

/** Record the Pal ledger for what's owed and open a PayPal checkout for the creator to fund it. */
export const POST = route(
  async (req: Request, ctx: RouteContext<"/api/projects/[id]/distributions">) => {
    const { id } = await ctx.params;
    const { basePath } = await body(req, Input);
    const project = `${appUrl(req)}${basePath}/projects/${id}`;
    const result = await startDistribution(id, {
      success: (distributionId) => `${project}/success/${distributionId}`,
      cancel: project,
    });
    return Response.json(result);
  },
);
