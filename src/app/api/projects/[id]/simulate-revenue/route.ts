import { HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";
import { getProposal, getPublishedVideo } from "@/lib/data";
import { revenueFor, round2, simulateTrajectory } from "@/lib/finance";

/** Demo control: simulate 90 days of performance around the proposal's forecast. */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/projects/[id]/simulate-revenue">) => {
    const { id } = await ctx.params;
    const proposal = await getProposal(id);
    if (!proposal) throw new HttpError("Project not found", 404);
    const video = await getPublishedVideo(id);
    if (!video) throw new HttpError("Publish the video first.", 409);

    // Land somewhere between the base and ~1.6x the high case, seeded by the project id.
    const seed = parseInt(id.replace(/-/g, "").slice(0, 8), 16) || 1;
    const t = (seed % 1000) / 1000;
    const { base, high } = proposal.forecast.views;
    const views = Math.round(base + (high * 1.6 - base) * t);
    const trajectory = simulateTrajectory(views, 90, seed);
    const revenue = round2(revenueFor(views, video.assumedRpm));

    await db()`
      update published_videos set current_views = ${views}, eligible_revenue = ${revenue},
        source = 'simulated', trajectory = ${db().json(trajectory)}, updated_at = now()
      where proposal_id = ${id}`;
    return Response.json({ views, revenue });
  },
);
