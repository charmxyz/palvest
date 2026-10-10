import { z } from "zod";
import { draftProposal } from "@/lib/ai";
import { body, HttpError, route } from "@/lib/api";
import { getCreator } from "@/lib/data";
import { buildForecast, metricsSample } from "@/lib/finance";

const Input = z.object({
  creatorId: z.string().uuid(),
  idea: z.string().trim().min(15, "Describe the idea in at least a sentence").max(2000),
  budget: z.number().min(100).max(250_000),
});

/** AI drafts editable proposal fields and picks comparables; code computes the forecast. */
export const POST = route(async (req: Request) => {
  const { creatorId, idea, budget } = await body(req, Input);
  const creator = await getCreator(creatorId);
  if (!creator) throw new HttpError("Creator not found. Analyze the channel first.", 404);

  const draft = await draftProposal({
    idea,
    budget,
    channelTitle: creator.channelTitle,
    channelDescription: creator.description,
    videos: creator.videos,
  });

  const byId = new Map(creator.videos.map((v) => [v.videoId, v]));
  const forecast = buildForecast({
    sampleViews: metricsSample(creator.videos).map((v) => v.viewCount),
    comparableViews: draft.comparableVideoIds.map((id) => byId.get(id)!.viewCount),
    comparableVideoIds: draft.comparableVideoIds,
    rpm: creator.assumedRpm,
    sharePercent: draft.recommendedRevenueSharePercent,
    explanation: draft.forecastExplanation,
  });

  return Response.json({ draft, forecast });
});

// Allow time for slow upstream calls (Claude, PayPal Payouts, YouTube) on Vercel.
export const maxDuration = 60;
