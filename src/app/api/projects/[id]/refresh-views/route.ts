import { HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";
import { getPublishedVideo } from "@/lib/data";
import { revenueFor, round2 } from "@/lib/finance";
import { fetchVideos } from "@/lib/youtube";

/** Real public mode: pull the current public view count from YouTube. */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/projects/[id]/refresh-views">) => {
    const { id } = await ctx.params;
    const pv = await getPublishedVideo(id);
    if (!pv?.youtubeVideoId) throw new HttpError("No YouTube video is linked to this project.", 409);
    const [video] = await fetchVideos([pv.youtubeVideoId]);
    if (!video) throw new HttpError("Video not found or no longer public.", 404);

    const day = pv.publishedAt
      ? Math.max(0, Math.floor((Date.now() - +new Date(pv.publishedAt)) / 86_400_000))
      : 0;
    const trajectory = [...pv.trajectory.filter((p) => p.day !== day), { day, views: video.viewCount }]
      .sort((a, b) => a.day - b.day);
    const revenue = round2(revenueFor(video.viewCount, pv.assumedRpm));
    await db()`
      update published_videos set current_views = ${video.viewCount}, eligible_revenue = ${revenue},
        source = 'youtube', trajectory = ${db().json(trajectory)}, updated_at = now()
      where proposal_id = ${id}`;
    return Response.json({ views: video.viewCount, revenue });
  },
);
