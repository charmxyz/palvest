import { TrendingDownIcon, TrendingUpIcon, MinusIcon } from "lucide-react";
import type { ForecastRange } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ScenarioRow = {
  label: string;
  values: ForecastRange;
  format: (n: number) => string;
  /** Highlight this row (e.g. the Pal's own return). */
  strong?: boolean;
};

const SCENARIOS = [
  { key: "low", title: "Below expectations", short: "Below", basis: "25th percentile", Icon: TrendingDownIcon },
  { key: "base", title: "As expected", short: "Expected", basis: "Median upload", Icon: MinusIcon },
  { key: "high", title: "Above expectations", short: "Above", basis: "75th percentile", Icon: TrendingUpIcon },
] as const;

/**
 * Three discrete outcomes instead of one wide range: each cell is a single figure.
 * The "as expected" column is emphasized; the other two frame it.
 */
export function ScenarioTable({
  rows,
  compact,
  className,
}: {
  rows: ScenarioRow[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border", className)}>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className={cn("text-left font-normal", compact ? "w-[34%] px-2.5 py-2" : "w-[28%] p-3 sm:p-4")}>
              <span className="sr-only">Metric</span>
            </th>
            {SCENARIOS.map(({ key, title, short, basis, Icon }) => (
              <th
                key={key}
                scope="col"
                className={cn(
                  "text-left align-bottom font-normal",
                  compact ? "px-2.5 py-2" : "p-3 sm:p-4",
                  key === "base" && "bg-foreground/[0.04]",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    compact ? "items-center whitespace-nowrap" : "flex-col items-start gap-1.5",
                    key === "base" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {compact ? null : <Icon className="size-3.5 shrink-0" />}
                  {compact ? (
                    <span className="text-[11px] font-medium">{short}</span>
                  ) : (
                    <span className="text-sm leading-tight font-medium">
                      <span className="hidden sm:inline">{title}</span>
                      <span className="sm:hidden">{short}</span>
                    </span>
                  )}
                </div>
                {compact ? null : <div className="label-mono mt-1 hidden text-[10px]! sm:block">{basis}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t">
              <th
                scope="row"
                className={cn(
                  "text-left font-normal text-muted-foreground",
                  compact ? "p-2.5 text-xs" : "p-3 sm:p-4",
                  row.strong && "text-foreground",
                )}
              >
                {row.label}
              </th>
              {SCENARIOS.map(({ key }) => (
                <td
                  key={key}
                  className={cn(
                    "num font-mono",
                    compact ? "p-2.5 text-[13px]" : "p-3 text-sm sm:p-4 sm:text-base",
                    key === "base" ? "bg-foreground/[0.04] text-foreground" : "text-muted-foreground",
                    row.strong && key === "base" && "font-medium",
                  )}
                >
                  {row.format(row.values[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
