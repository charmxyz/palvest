import { cn } from "@/lib/utils";

/** Funding progress: thin track, animated fill. */
export function FundingBar({
  value,
  className,
  tone = "default",
}: {
  value: number;
  className?: string;
  tone?: "default" | "positive";
}) {
  const pct = Math.max(0, Math.min(100, value));
  // Any funding at all gets a visible sliver.
  const width = pct > 0 ? Math.max(pct, 1.5) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.08]", className)}
    >
      <div
        key={pct}
        className={cn(
          "animate-fill-in h-full rounded-full",
          tone === "positive" ? "bg-positive" : "bg-foreground",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
