"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowUpRightIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { ViewsChart } from "@/components/charts/views-chart";
import { CreatorAvatar } from "@/components/creator-avatar";
import { NumberField } from "@/components/number-field";
import { Stat } from "@/components/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/client";
import { compactNumber, integer, money } from "@/lib/format";
import { revenueFor } from "@/lib/finance";
import type { CreatorProfile } from "@/lib/types";
import { FundingSimulator } from "./funding-simulator";

export function CreatorStudio({ creator: initial, basePath }: { creator: CreatorProfile; basePath: string }) {
  const router = useRouter();
  const [creator, setCreator] = useState(initial);
  const [rpm, setRpm] = useState(initial.assumedRpm);
  const [refreshing, startRefresh] = useTransition();

  // Follow fresh server data (after a refresh or switching creators).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setCreator(initial);
    setRpm(initial.assumedRpm);
  }

  const saveRpm = async (n: number) => {
    if (n === creator.assumedRpm) return;
    try {
      await api(`/api/creators/${creator.id}`, { assumedRpm: n }, "PATCH");
      setCreator({ ...creator, assumedRpm: n });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const refresh = () =>
    startRefresh(async () => {
      try {
        const { creator: c } = await api<{ creator: CreatorProfile }>("/api/youtube/analyze", {
          url: creator.youtubeHandle ?? creator.youtubeChannelId,
        });
        setCreator(c);
        toast.success("Refreshed from YouTube", { description: `${c.metrics.uploadsAnalyzed} long-form uploads` });
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  const m = creator.metrics;
  const sample = creator.videos.slice(0, m.sampleSize);
  const channelUrl = creator.youtubeHandle
    ? `https://youtube.com/${creator.youtubeHandle.startsWith("@") ? creator.youtubeHandle : `@${creator.youtubeHandle}`}`
    : `https://youtube.com/channel/${creator.youtubeChannelId}`;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <CreatorAvatar name={creator.channelTitle} src={creator.thumbnailUrl} className="size-14" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-medium tracking-tight">{creator.channelTitle}</h2>
                  {creator.isSeed ? null : (
                    <Badge variant="outline" className="gap-1 font-mono text-[10px] uppercase">
                      <span className="size-1.5 rounded-full bg-positive" /> Live YouTube data
                    </Badge>
                  )}
                </div>
                <a
                  href={creator.isSeed ? undefined : channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  {creator.youtubeHandle ?? creator.youtubeChannelId}
                  {creator.isSeed ? null : <ArrowUpRightIcon className="size-3" />}
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 md:gap-10">
              <Stat label="Subscribers" value={compactNumber(creator.subscriberCount)} />
              <Stat label="Channel views" value={compactNumber(creator.totalViewCount)} />
              <Stat label="Public videos" value={integer(creator.publicVideoCount)} />
            </div>
          </div>
          {creator.isSeed ? null : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
              <span className="font-mono">
                Analyzed {new Date(creator.analyzedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
                {refreshing ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
                Refresh from YouTube
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Median views", value: compactNumber(m.medianViews), sub: `Last ${m.sampleSize} long-form uploads` },
          { label: "Average views", value: compactNumber(m.averageViews), sub: `p25 ${compactNumber(m.p25Views)} · p75 ${compactNumber(m.p75Views)}` },
          { label: "Top recent video", value: compactNumber(m.topVideo?.viewCount ?? 0), sub: m.topVideo?.title },
          { label: "Uploads analyzed", value: integer(m.uploadsAnalyzed), sub: `${m.uploadsPerMonth} per month · Shorts excluded` },
        ].map((s) => (
          <Card key={s.label} size="sm">
            <CardContent>
              <Stat
                label={s.label}
                value={s.value}
                sub={<span className="line-clamp-1">{s.sub}</span>}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent long-form performance</CardTitle>
            <CardDescription>Views per upload, oldest to newest. Hover a bar for details.</CardDescription>
          </CardHeader>
          <CardContent>
            <ViewsChart videos={creator.videos} median={m.medianViews} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimated creator economics</CardTitle>
            <CardDescription>
              Public APIs don&apos;t expose revenue, so this uses an RPM you can edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="rpm" className="label-mono">
                Assumed RPM
              </label>
              <NumberField
                id="rpm"
                value={rpm}
                onChange={setRpm}
                onCommit={saveRpm}
                prefix="$"
                min={0.1}
                max={100}
                className="w-28"
              />
            </div>
            <dl className="grid gap-3 text-sm">
              {[
                ["Below expectations", revenueFor(m.p25Views, rpm)],
                ["As expected", revenueFor(m.medianViews, rpm)],
                ["Above expectations", revenueFor(m.p75Views, rpm)],
                ["Your top recent video", revenueFor(m.topVideo?.viewCount ?? 0, rpm)],
              ].map(([label, v]) => (
                <div key={label as string} className="flex items-baseline justify-between border-b border-dashed border-border/60 pb-2 last:border-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="num font-mono">{money(v as number, { cents: false })}</dd>
                </div>
              ))}
            </dl>
            <p className="font-mono text-[11px] text-muted-foreground">
              Estimated using {money(rpm, { cents: true })} RPM · views ÷ 1,000 × RPM
            </p>
          </CardContent>
        </Card>
      </div>

      <FundingSimulator metrics={m} rpm={rpm} onRpmChange={setRpm} sampleSize={sample.length} basePath={basePath} />

    </div>
  );
}
