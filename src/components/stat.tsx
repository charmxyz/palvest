import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  className,
  valueClassName,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="label-mono">{label}</span>
      <span className={cn("num text-2xl font-medium tracking-tight", valueClassName)}>{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}
