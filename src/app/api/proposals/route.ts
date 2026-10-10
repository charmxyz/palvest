import { connection } from "next/server";
import { z } from "zod";
import { body, HttpError, route } from "@/lib/api";
import { db } from "@/lib/db";
import { getCreator, listProposals } from "@/lib/data";
import { buildForecast, metricsSample } from "@/lib/finance";

export const GET = route(async () => {
  await connection();
  return Response.json({ proposals: await listProposals() });
});

const Input = z.object({
  creatorId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
  creatorPitch: z.string().trim().max(2000).default(""),
  coverImageUrl: z.string().trim().max(500).nullable().default(null),
  fundingTarget: z.number().min(100).max(250_000),
  revenueSharePercent: z.number().min(1).max(100),
  revenueShareMonths: z.number().int().min(1).max(60),
  assumedRpm: z.number().min(0.1).max(100),
  budget: z
    .array(z.object({ label: z.string().trim().min(1).max(80), amount: z.number().min(0) }))
    .max(20),
  risks: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
  comparableVideoIds: z.array(z.string()).max(12).default([]),
  forecastExplanation: z.string().max(1000).nullable().default(null),
});

/** Publish a proposal to the Pals marketplace. The forecast is recomputed server side. */
export const POST = route(async (req: Request) => {
  const input = await body(req, Input);
  const creator = await getCreator(input.creatorId);
  if (!creator) throw new HttpError("Creator not found. Analyze the channel first.", 404);

  const byId = new Map(creator.videos.map((v) => [v.videoId, v]));
  const comparables = input.comparableVideoIds.filter((id) => byId.has(id));
  const forecast = buildForecast({
    sampleViews: metricsSample(creator.videos).map((v) => v.viewCount),
    comparableViews: comparables.map((id) => byId.get(id)!.viewCount),
    comparableVideoIds: comparables,
    rpm: input.assumedRpm,
    sharePercent: input.revenueSharePercent,
    explanation: input.forecastExplanation,
  });

  const sql = db();
  const [row] = await sql.begin(async (tx) => {
    await tx`update creator_profiles set assumed_rpm = ${input.assumedRpm} where id = ${creator.id}`;
    return tx`
      insert into proposals ${tx({
        creator_profile_id: creator.id,
        title: input.title,
        description: input.description,
        creator_pitch: input.creatorPitch,
        cover_image_url: input.coverImageUrl,
        funding_target: input.fundingTarget,
        revenue_share_percent: input.revenueSharePercent,
        revenue_share_months: input.revenueShareMonths,
        budget: tx.json(input.budget.filter((b) => b.amount > 0)),
        forecast: tx.json(forecast),
        risks: tx.json(input.risks),
        status: "funding",
      })}
      returning id`;
  });
  return Response.json({ id: row.id }, { status: 201 });
});
