import "server-only";
import { ANALYZED_UPLOADS, deriveMetrics, selectLongForm } from "./finance";
import type { ChannelMetrics, ChannelSnapshot, VideoSnapshot } from "./types";

const API = "https://www.googleapis.com/youtube/v3";

export class YouTubeError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type ChannelLookup =
  | { kind: "handle"; value: string }
  | { kind: "id"; value: string }
  | { kind: "username"; value: string };

/** Accepts youtube.com/@handle, youtube.com/channel/UC…, youtube.com/user/name, or a bare @handle. */
export function parseChannelInput(raw: string): ChannelLookup {
  const input = raw.trim();
  if (!input) throw new YouTubeError("Paste a YouTube channel URL.");

  if (/^@[\w.-]{3,}$/.test(input)) return { kind: "handle", value: input };
  if (/^UC[\w-]{22}$/.test(input)) return { kind: "id", value: input };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    throw new YouTubeError("That doesn't look like a YouTube channel URL.");
  }
  if (!/(^|\.)youtube\.com$/i.test(url.hostname)) {
    throw new YouTubeError("Use a youtube.com channel URL, like youtube.com/@yourhandle.");
  }

  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (first?.startsWith("@")) return { kind: "handle", value: decodeURIComponent(first) };
  if (first === "channel" && second) return { kind: "id", value: second };
  if (first === "user" && second) return { kind: "username", value: second };

  throw new YouTubeError(
    "This URL format isn't supported. Open your channel and copy the youtube.com/@handle URL.",
  );
}

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new YouTubeError("YOUTUBE_API_KEY is not configured on the server.", 500);
  return key;
}

async function yt<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, key: apiKey() });
  const res = await fetch(`${API}/${path}?${qs}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch((err) => {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new YouTubeError("YouTube took too long to respond. Please try again.", 504);
    }
    throw err;
  });
  const body = await res.json();
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded") throw new YouTubeError("YouTube API quota exceeded.", 429);
    throw new YouTubeError(body?.error?.message ?? `YouTube API error ${res.status}`, 502);
  }
  return body as T;
}

type Thumbs = Record<string, { url: string } | undefined>;
const bestThumb = (t?: Thumbs) =>
  t?.maxres?.url ?? t?.standard?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null;

/** ISO 8601 duration (PT1H2M3S) to seconds. */
export function durationToSeconds(iso: string) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

type ChannelItem = {
  id: string;
  snippet: { title: string; description: string; customUrl?: string; thumbnails: Thumbs };
  statistics: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
  contentDetails: { relatedPlaylists: { uploads: string } };
};

type VideoItem = {
  id: string;
  snippet: { title: string; description: string; publishedAt: string; thumbnails: Thumbs };
  statistics: { viewCount?: string; likeCount?: string };
  contentDetails: { duration: string };
};

export async function fetchChannel(lookup: ChannelLookup): Promise<ChannelSnapshot> {
  const param: Record<string, string> =
    lookup.kind === "handle"
      ? { forHandle: lookup.value }
      : lookup.kind === "id"
        ? { id: lookup.value }
        : { forUsername: lookup.value };
  const data = await yt<{ items?: ChannelItem[] }>("channels", {
    part: "snippet,statistics,contentDetails",
    ...param,
  });
  const c = data.items?.[0];
  if (!c) throw new YouTubeError("We couldn't find that channel. Check the handle and try again.", 404);
  return {
    channelId: c.id,
    handle: c.snippet.customUrl ?? (lookup.kind === "handle" ? lookup.value : null),
    title: c.snippet.title,
    description: c.snippet.description,
    thumbnailUrl: bestThumb(c.snippet.thumbnails),
    subscriberCount: Number(c.statistics.subscriberCount ?? 0),
    totalViewCount: Number(c.statistics.viewCount ?? 0),
    publicVideoCount: Number(c.statistics.videoCount ?? 0),
    uploadsPlaylistId: c.contentDetails.relatedPlaylists.uploads,
  };
}

function toSnapshot(v: VideoItem): VideoSnapshot {
  const durationSeconds = durationToSeconds(v.contentDetails.duration);
  return {
    videoId: v.id,
    title: v.snippet.title,
    description: v.snippet.description?.slice(0, 280) ?? "",
    publishedAt: v.snippet.publishedAt,
    thumbnailUrl: bestThumb(v.snippet.thumbnails),
    duration: v.contentDetails.duration,
    durationSeconds,
    viewCount: Number(v.statistics.viewCount ?? 0),
    likeCount: v.statistics.likeCount != null ? Number(v.statistics.likeCount) : null,
  };
}

export async function fetchVideos(ids: string[]): Promise<VideoSnapshot[]> {
  const out: VideoSnapshot[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const data = await yt<{ items?: VideoItem[] }>("videos", {
      part: "snippet,statistics,contentDetails",
      id: ids.slice(i, i + 50).join(","),
    });
    out.push(...(data.items ?? []).map(toSnapshot));
  }
  return out;
}

async function uploadIdsPage(playlistId: string, pageToken?: string) {
  const data = await yt<{
    items?: { contentDetails: { videoId: string } }[];
    nextPageToken?: string;
  }>("playlistItems", {
    part: "contentDetails",
    playlistId,
    maxResults: "50",
    ...(pageToken ? { pageToken } : {}),
  });
  return {
    ids: (data.items ?? []).map((i) => i.contentDetails.videoId),
    next: data.nextPageToken,
  };
}

export type ChannelAnalysis = {
  channel: ChannelSnapshot;
  videos: VideoSnapshot[];
  metrics: ChannelMetrics;
};

const cache = new Map<string, { at: number; value: ChannelAnalysis }>();
const CACHE_MS = 10 * 60_000;

export async function analyzeChannel(input: string): Promise<ChannelAnalysis> {
  const lookup = parseChannelInput(input);
  const key = `${lookup.kind}:${lookup.value.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const channel = await fetchChannel(lookup);
  // Channels that post lots of Shorts need a second page to find 30 long-form uploads.
  const all: VideoSnapshot[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 2; page++) {
    const { ids, next } = await uploadIdsPage(channel.uploadsPlaylistId, pageToken);
    all.push(...(await fetchVideos(ids)));
    pageToken = next;
    if (!pageToken || selectLongForm(all).length >= ANALYZED_UPLOADS) break;
  }
  const videos = selectLongForm(all);
  if (videos.length === 0) {
    throw new YouTubeError("This channel has no public long-form videos to analyze yet.", 422);
  }
  const value = { channel, videos, metrics: deriveMetrics(videos) };
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function parseVideoId(raw: string): string | null {
  const input = raw.trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (url.hostname === "youtu.be") return url.pathname.slice(1, 12) || null;
    if (/(^|\.)youtube\.com$/.test(url.hostname)) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const m = /^\/(?:shorts|live|embed)\/([\w-]{11})/.exec(url.pathname);
      if (m) return m[1];
    }
  } catch {}
  return null;
}
