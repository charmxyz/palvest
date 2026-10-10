"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { compactNumber, integer, moneyCents } from "@/lib/format";
import type { TrajectoryPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

const config = { views: { label: "Cumulative views", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Cumulative views since publication, with the forecast's base and high case as reference lines. */
export function TrajectoryChart({
  data,
  rpm,
  forecast,
  className,
}: {
  data: TrajectoryPoint[];
  rpm: number;
  forecast?: { base: number; high: number };
  className?: string;
}) {
  return (
    <ChartContainer config={config} className={cn("aspect-auto h-60 w-full", className)}>
      <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="traj-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(d: number) => `Day ${d}`}
          className="font-mono"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => compactNumber(v)}
          className="font-mono"
        />
        <ChartTooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as TrajectoryPoint | undefined;
            if (!active || !p) return null;
            return (
              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
                <div className="label-mono">Day {p.day}</div>
                <div className="num mt-1 font-mono text-foreground">{integer(p.views)} views</div>
                <div className="num font-mono text-muted-foreground">
                  {moneyCents((p.views / 1000) * rpm)} est. revenue
                </div>
              </div>
            );
          }}
        />
        {forecast
          ? (
              [
                ["Forecast base", forecast.base],
                ["High case", forecast.high],
              ] as const
            ).map(([label, y]) => (
              <ReferenceLine
                key={label}
                y={y}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.5}
                label={{
                  value: label,
                  position: "insideBottomRight",
                  fill: "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />
            ))
          : null}
        <Area
          dataKey="views"
          type="monotone"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#traj-fill)"
          activeDot={{ r: 4, stroke: "var(--background)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
