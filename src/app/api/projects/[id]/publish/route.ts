import { z } from "zod";
import { body, HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";
import { getProposal } from "@/lib/data";
import { revenueFor, round2 } from "@/lib/finance";
import { fetchVideos, parseVideoId } from "@/lib/youtube";

const Input = z.object({ youtubeUrl: z.string().trim().max(300).optional() });

/** Mark a funded project as published, optionally linking the real YouTube video. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) => {
  const { id } = await ctx.params;
  const { youtubeUrl } = await body(req, Input);
  const proposal = await getProposal(id);
  if (!proposal) throw new HttpError("Project not found", 404);
  if (proposal.status === "published") throw new HttpError("Already published.", 409);
  if (proposal.amountFunded <= 0) throw new HttpError("Raise funding before publishing.", 409);

  const rpm = proposal.forecast.rpm ?? proposal.creator.assumedRpm;
  let video = null;
  if (youtubeUrl) {
    const videoId = parseVideoId(youtubeUrl);
    if (!videoId) throw new HttpError("That doesn't look like a YouTube video URL.");
    [video] = await fetchVideos([videoId]);
    if (!video) throw new HttpError("Video not found or not public.", 404);
  }

  const sql = db();
  await sql.begin(async (tx) => {
    await tx`
      insert into published_videos ${tx({
        proposal_id: id,
        youtube_video_id: video?.videoId ?? null,
        title: video?.title ?? proposal.title,
        thumbnail_url: video?.thumbnailUrl ?? null,
        published_at: video ? new Date(video.publishedAt) : new Date(),
        current_views: video?.viewCount ?? 0,
        assumed_rpm: rpm,
        eligible_revenue: video ? round2(revenueFor(video.viewCount, rpm)) : 0,
        source: video ? "youtube" : "none",
        trajectory: tx.json(video ? [{ day: 0, views: video.viewCount }] : []),
      })}
      on conflict (proposal_id) do nothing`;
    await tx`update proposals set status = 'published', published_at = now() where id = ${id}`;
  });
  return Response.json({ ok: true });
});
