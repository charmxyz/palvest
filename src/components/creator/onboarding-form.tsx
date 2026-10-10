"use client";

import { useRouter } from "next/navigation";
import { creatorPath } from "@/lib/slug";
import { ChannelAnalyzer } from "./channel-analyzer";

export function OnboardingForm() {
  const router = useRouter();
  return <ChannelAnalyzer holdOnSuccess onAnalyzed={(_, slug) => router.push(creatorPath(slug))} />;
}
