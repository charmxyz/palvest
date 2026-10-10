import { z } from "zod";
import { body, route } from "@/lib/api";
import { db } from "@/lib/db";
import { mapCreator } from "@/lib/data";
import { creatorSlug } from "@/lib/slug";
import { analyzeChannel } from "@/lib/youtube";

const Input = z.object({ url: z.string().min(1).max(300) });

export const POST = route(async (req: Request) => {
  const { url } = await body(req, Input);
  const { channel, videos, metrics } = await analyzeChannel(url);
  const sql = db();
  const [row] = await sql`
    insert into creator_profiles ${sql({
      youtube_channel_id: channel.channelId,
      youtube_handle: channel.handle,
      channel_title: channel.title,
      description: channel.description,
      thumbnail_url: channel.thumbnailUrl,
      subscriber_count: channel.subscriberCount,
      total_view_count: channel.totalViewCount,
      public_video_count: channel.publicVideoCount,
      uploads_playlist_id: channel.uploadsPlaylistId,
      videos: sql.json(videos),
      metrics: sql.json(metrics),
      analyzed_at: new Date(),
    })}
    on conflict (youtube_channel_id) do update set
      youtube_handle = excluded.youtube_handle,
      channel_title = excluded.channel_title,
      description = excluded.description,
      thumbnail_url = excluded.thumbnail_url,
      subscriber_count = excluded.subscriber_count,
      total_view_count = excluded.total_view_count,
      public_video_count = excluded.public_video_count,
      uploads_playlist_id = excluded.uploads_playlist_id,
      videos = excluded.videos,
      metrics = excluded.metrics,
      analyzed_at = excluded.analyzed_at
    returning *`;
  const creator = mapCreator(row);
  return Response.json({ creator, slug: creatorSlug(creator) });
});

// Allow time for slow upstream calls (Claude, PayPal Payouts, YouTube) on Vercel.
export const maxDuration = 60;
