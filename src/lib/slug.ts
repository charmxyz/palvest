/** URL slug for a creator: their YouTube handle without the @ (e.g. "nomad-notes"), else the channel ID. */
export function creatorSlug(c: { youtubeHandle: string | null; youtubeChannelId: string }) {
  return c.youtubeHandle ? c.youtubeHandle.replace(/^@/, "").toLowerCase() : c.youtubeChannelId;
}

export function creatorPath(slug: string, ...rest: string[]) {
  return ["/creator", encodeURIComponent(slug), ...rest].join("/");
}
