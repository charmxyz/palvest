import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { VideoSnapshot } from "./types";

const MODEL = "claude-opus-5-5";

const ProposalDraftSchema = z.object({
  title: z.string().describe("Punchy YouTube-style video title, under 70 characters"),
  summary: z.string().describe("2-3 sentence description of the finished video for Pals"),
  creatorPitch: z
    .string()
    .describe("First-person note from the creator on why this video needs funding"),
  fundingTarget: z.number().describe("Funding target in USD, whole dollars"),
  recommendedRevenueSharePercent: z
    .number()
    .describe("Share of eligible YouTube revenue offered to Pals, 5-40"),
  revenueShareMonths: z.number().describe("Months after publication the share applies, 6-24"),
  budget: z
    .array(z.object({ label: z.string(), amount: z.number() }))
    .describe("3-6 budget lines in USD that sum exactly to fundingTarget"),
  risks: z.array(z.string()).describe("2-3 short, honest production risks"),
  comparableVideoIds: z
    .array(z.string())
    .describe("IDs of 2-6 past uploads most similar in topic and format to the new idea"),
  forecastExplanation: z
    .string()
    .describe(
      "2 sentences explaining which past videos the forecast leans on and why. No numbers.",
    ),
});

export type ProposalDraft = z.infer<typeof ProposalDraftSchema>;

export class AIError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

const SYSTEM = `You help YouTube creators turn a video idea into a crowdfunding proposal on Palvest, where fans ("Pals") fund a video before it's made in exchange for a share of that video's eligible YouTube revenue for a fixed term.

Write like a creator, not a marketer: concrete, specific, no hype or emoji. Pals are backers, not owners — never describe the deal as equity or ownership.

Choose the revenue share so Pals get a fair, credible deal given the budget; 15-25% for a 12-month term is typical. Budget lines must be realistic for the idea and sum exactly to the funding target. Keep the creator's rough budget unless it is clearly unrealistic.

For comparableVideoIds, pick only IDs from the provided upload list whose topic and format best match the new idea. Do not estimate view counts or revenue; Palvest computes the forecast from the comparables you choose.`;

export async function draftProposal(input: {
  idea: string;
  budget: number;
  channelTitle: string;
  channelDescription: string | null;
  videos: VideoSnapshot[];
}): Promise<ProposalDraft> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIError("ANTHROPIC_API_KEY is not configured on the server.", 500);
  }
  const client = new Anthropic();

  const uploads = input.videos
    .map(
      (v) =>
        `- id=${v.videoId} | "${v.title}" | ${v.viewCount.toLocaleString("en-US")} views | ${v.publishedAt.slice(0, 10)}`,
    )
    .join("\n");

  const message = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(ProposalDraftSchema) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Channel: ${input.channelTitle}
About: ${input.channelDescription?.slice(0, 400) || "n/a"}

Recent long-form uploads:
${uploads}

New video idea:
${input.idea}

Creator's rough budget: $${input.budget}`,
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    throw new AIError("The model declined to draft this proposal. Try rephrasing the idea.", 422);
  }
  if (message.stop_reason === "max_tokens" || !message.parsed_output) {
    throw new AIError("The model returned an incomplete proposal. Please try again.");
  }
  return normalizeDraft(message.parsed_output, input.budget, new Set(input.videos.map((v) => v.videoId)));
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Enforce the constraints the schema can't express. */
function normalizeDraft(d: ProposalDraft, fallbackBudget: number, knownIds: Set<string>): ProposalDraft {
  const fundingTarget = Math.round(d.fundingTarget > 0 ? d.fundingTarget : fallbackBudget);
  const budget = d.budget
    .filter((b) => b.label.trim() && b.amount > 0)
    .map((b) => ({ label: b.label.trim(), amount: Math.round(b.amount) }));
  const sum = budget.reduce((a, b) => a + b.amount, 0);
  if (budget.length && sum !== fundingTarget) {
    // Absorb rounding drift into the largest line.
    const largest = budget.reduce((a, b) => (b.amount > a.amount ? b : a));
    largest.amount += fundingTarget - sum;
  }
  return {
    ...d,
    fundingTarget,
    recommendedRevenueSharePercent: Math.round(clamp(d.recommendedRevenueSharePercent, 5, 50)),
    revenueShareMonths: Math.round(clamp(d.revenueShareMonths, 3, 36)),
    budget,
    comparableVideoIds: [...new Set(d.comparableVideoIds)].filter((id) => knownIds.has(id)).slice(0, 8),
  };
}
