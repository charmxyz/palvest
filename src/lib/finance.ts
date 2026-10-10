// Pure, deterministic math shared by the client, the API and the seed script.
// The LLM never produces these numbers; it only picks comparable videos.
import type {
  ChannelMetrics,
  ForecastRange,
  ProposalForecast,
  VideoSnapshot,
} from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export const median = (values: number[]) => percentile(values, 0.5);

export const revenueFor = (views: number, rpm: number) => (views / 1000) * rpm;

/** Videos at or under this length are treated as Shorts. */
const SHORTS_MAX_SECONDS = 60;
/** Videos younger than this have immature view counts and skew the median low. */
const MIN_AGE_DAYS = 7;
export const METRICS_SAMPLE = 20;
export const ANALYZED_UPLOADS = 30;

export function isLikelyShort(v: Pick<VideoSnapshot, "durationSeconds" | "title" | "description">) {
  if (v.durationSeconds > 0 && v.durationSeconds <= SHORTS_MAX_SECONDS) return true;
  const text = `${v.title} ${v.description ?? ""}`.toLowerCase();
  return v.durationSeconds <= 180 && text.includes("#shorts");
}

/** Newest-first long-form uploads, capped at ANALYZED_UPLOADS. */
export function selectLongForm(videos: VideoSnapshot[]): VideoSnapshot[] {
  return videos
    .filter((v) => !isLikelyShort(v))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, ANALYZED_UPLOADS);
}

/** Videos used for the performance profile: mature, newest METRICS_SAMPLE long-form uploads. */
export function metricsSample(videos: VideoSnapshot[], now = Date.now()): VideoSnapshot[] {
  const cutoff = now - MIN_AGE_DAYS * 86_400_000;
  const mature = videos.filter((v) => +new Date(v.publishedAt) <= cutoff);
  return (mature.length >= 5 ? mature : videos).slice(0, METRICS_SAMPLE);
}

export function deriveMetrics(longForm: VideoSnapshot[], now = Date.now()): ChannelMetrics {
  const sample = metricsSample(longForm, now);
  const views = sample.map((v) => v.viewCount);
  const likes = sample.map((v) => v.likeCount).filter((l): l is number => l != null);
  const top = [...sample].sort((a, b) => b.viewCount - a.viewCount)[0];

  let uploadsPerMonth = 0;
  if (longForm.length >= 2) {
    const times = longForm.map((v) => +new Date(v.publishedAt));
    const spanDays = (Math.max(...times) - Math.min(...times)) / 86_400_000;
    uploadsPerMonth = spanDays > 0 ? ((longForm.length - 1) / spanDays) * 30.44 : 0;
  }

  return {
    sampleSize: sample.length,
    uploadsAnalyzed: longForm.length,
    medianViews: Math.round(median(views)),
    averageViews: views.length ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0,
    p25Views: Math.round(percentile(views, 0.25)),
    p75Views: Math.round(percentile(views, 0.75)),
    topVideo: top ? { videoId: top.videoId, title: top.title, viewCount: top.viewCount } : null,
    uploadsPerMonth: Math.round(uploadsPerMonth * 10) / 10,
    medianLikes: likes.length ? Math.round(median(likes)) : null,
  };
}

const SIMILAR_WEIGHT = 0.65;

/**
 * Expected-views range for a new video.
 * Without comparables: p25 / median / p75 of recent long-form uploads.
 * With comparables: base = 0.65·median(similar) + 0.35·median(all), and the
 * range keeps the channel's own p25/median and p75/median spread around that base.
 */
export function forecastViews(
  sampleViews: number[],
  comparableViews: number[],
): { method: ProposalForecast["method"]; views: ForecastRange } {
  const med = median(sampleViews);
  const p25 = percentile(sampleViews, 0.25);
  const p75 = percentile(sampleViews, 0.75);
  if (comparableViews.length === 0 || med === 0) {
    return {
      method: "percentile",
      views: { low: Math.round(p25), base: Math.round(med), high: Math.round(p75) },
    };
  }
  const base = SIMILAR_WEIGHT * median(comparableViews) + (1 - SIMILAR_WEIGHT) * med;
  return {
    method: "similarity",
    views: {
      low: Math.round(base * (p25 / med)),
      base: Math.round(base),
      high: Math.round(base * (p75 / med)),
    },
  };
}

const mapRange = (r: ForecastRange, f: (n: number) => number): ForecastRange => ({
  low: round2(f(r.low)),
  base: round2(f(r.base)),
  high: round2(f(r.high)),
});

export function buildForecast(input: {
  sampleViews: number[];
  comparableViews: number[];
  comparableVideoIds: string[];
  rpm: number;
  sharePercent: number;
  explanation?: string | null;
}): ProposalForecast {
  const { method, views } = forecastViews(input.sampleViews, input.comparableViews);
  const revenue = mapRange(views, (v) => revenueFor(v, input.rpm));
  const share = input.sharePercent / 100;
  return {
    method,
    rpm: input.rpm,
    views,
    revenue,
    palPool: mapRange(revenue, (r) => r * share),
    creatorKeeps: mapRange(revenue, (r) => r * (1 - share)),
    comparableVideoIds: method === "similarity" ? input.comparableVideoIds : [],
    explanation: input.explanation ?? null,
  };
}

/** Re-price an existing forecast's view range with new terms (RPM / share). */
export function repriceForecast(
  f: ProposalForecast,
  rpm: number,
  sharePercent: number,
): ProposalForecast {
  const revenue = mapRange(f.views, (v) => revenueFor(v, rpm));
  const share = sharePercent / 100;
  return {
    ...f,
    rpm,
    revenue,
    palPool: mapRange(revenue, (r) => r * share),
    creatorKeeps: mapRange(revenue, (r) => r * (1 - share)),
  };
}

/** A Pal's slice of the pool: their contribution over the larger of target and amount raised. */
export function palShareOf(contribution: number, fundingTarget: number, amountFunded: number) {
  const denom = Math.max(fundingTarget, amountFunded);
  return denom > 0 ? contribution / denom : 0;
}

export function estimatedReturn(
  contribution: number,
  fundingTarget: number,
  palPool: ForecastRange,
): ForecastRange {
  const s = fundingTarget > 0 ? contribution / fundingTarget : 0;
  return mapRange(palPool, (p) => p * s);
}

/**
 * Total owed to Pals for a published video. The share is scaled down when the
 * campaign raised less than its target, since Pals only bought that fraction.
 */
export function backerPoolOwed(
  eligibleRevenue: number,
  sharePercent: number,
  fundingTarget: number,
  amountFunded: number,
) {
  const fundedRatio = fundingTarget > 0 ? Math.min(1, amountFunded / fundingTarget) : 0;
  return round2(eligibleRevenue * (sharePercent / 100) * fundedRatio);
}

/**
 * Split a pool across contributors pro rata, in whole cents, using the
 * largest-remainder method so the items sum exactly to the pool.
 */
export function splitPool<T extends { amount: number }>(
  pool: number,
  contributions: T[],
): (T & { payout: number })[] {
  const total = contributions.reduce((a, c) => a + c.amount, 0);
  const poolCents = Math.round(pool * 100);
  if (total <= 0 || poolCents <= 0) return contributions.map((c) => ({ ...c, payout: 0 }));
  const raw = contributions.map((c) => (c.amount / total) * poolCents);
  const floors = raw.map(Math.floor);
  let remainder = poolCents - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i] += 1;
    remainder -= 1;
  }
  return contributions.map((c, i) => ({ ...c, payout: floors[i] / 100 }));
}

/**
 * Deterministic 90-day cumulative view curve that front-loads like a real
 * YouTube upload (fast first week, long tail) and ends at `totalViews`.
 */
export function simulateTrajectory(totalViews: number, days = 90, seed = 1) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  // 75% arrives on a fast exponential launch curve, 25% as a steady long tail.
  const curve = (d: number) => 0.75 * (1 - Math.exp(-0.12 * d)) + 0.25 * (d / days);
  // Jitter each day's increment (not the running total) so the line stays smooth.
  const increments = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    return (curve(d) - curve(d - 1)) * (0.7 + rand() * 0.6);
  });
  const sum = increments.reduce((a, b) => a + b, 0);
  const points: { day: number; views: number }[] = [];
  let acc = 0;
  increments.forEach((inc, i) => {
    acc += inc;
    points.push({ day: i + 1, views: i === days - 1 ? totalViews : Math.round((acc / sum) * totalViews) });
  });
  return points;
}
