"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { compactNumber, integer } from "@/lib/format";
import type { VideoSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

const config = {
  views: { label: "Views", color: "var(--chart-3)" },
} satisfies ChartConfig;

/**
 * Recent uploads, oldest → newest. With `highlight`, comparable videos are drawn
 * in the accent ink and everything else recedes to gray (emphasis, not categories).
 */
export function ViewsChart({
  videos,
  highlight,
  median,
  className,
}: {
  videos: VideoSnapshot[];
  highlight?: string[];
  median?: number;
  className?: string;
}) {
  const hl = new Set(highlight ?? []);
  const emphasis = hl.size > 0;
  const data = [...videos]
    .sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt))
    .map((v) => ({ ...v, views: v.viewCount, comparable: hl.has(v.videoId) }));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {emphasis ? (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-[var(--chart-1)]" /> Comparable videos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-[var(--chart-2)]" /> Other uploads
          </span>
        </div>
      ) : null}
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart data={data} margin={{ top: 8, right: median ? 88 : 4, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="videoId" hide />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => compactNumber(v)}
            className="font-mono"
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={({ active, payload }) => {
              const v = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !v) return null;
              return (
                <div className="max-w-64 rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
                  <div className="line-clamp-2 font-medium text-foreground">{v.title}</div>
                  <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
                    <span>{new Date(v.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="num font-mono text-foreground">{integer(v.views)} views</span>
                  </div>
                  {v.comparable ? <div className="mt-1 label-mono text-[10px]!">Comparable</div> : null}
                </div>
              );
            }}
          />
          {median ? (
            <ReferenceLine
              y={median}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.6}
              label={{
                value: `Median ${compactNumber(median)}`,
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 10,
                className: "font-mono",
              }}
            />
          ) : null}
          <Bar dataKey="views" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((d) => (
              <Cell
                key={d.videoId}
                fill={emphasis ? (d.comparable ? "var(--chart-1)" : "var(--chart-2)") : "var(--chart-3)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
