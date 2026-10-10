import { connection } from "next/server";
import { HttpError, route } from "@/lib/api";
import { getDistributions, getProposal, getPublishedVideo, settlement } from "@/lib/data";

export const GET = route(async (_req: Request, ctx: RouteContext<"/api/proposals/[id]">) => {
  await connection();
  const { id } = await ctx.params;
  const proposal = await getProposal(id);
  if (!proposal) throw new HttpError("Proposal not found", 404);
  const [video, distributions] = await Promise.all([getPublishedVideo(id), getDistributions(id)]);
  return Response.json({
    proposal,
    publishedVideo: video,
    settlement: settlement(proposal, video, distributions),
  });
});
