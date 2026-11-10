import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

/** A fixed 1920×1080 marketing frame: one sentence on top, one product mock beneath. */
export function ShowcaseFrame({
  index,
  total,
  eyebrow,
  title,
  children,
}: {
  index: number;
  total: number;
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      id="showcase-frame"
      className="relative isolate flex h-[1080px] w-[1920px] shrink-0 flex-col items-center overflow-hidden bg-background px-24 pt-14"
    >
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_55%_at_50%_30%,black,transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-380px] -z-10 mx-auto h-[760px] w-[1500px] rounded-full opacity-60 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, oklch(0.8 0.15 160 / 0.18), transparent)" }}
      />

      <div className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2.5 text-[22px] font-medium tracking-tight">
          <LogoMark className="h-[18px]" />
          Palvest
        </span>
        <span className="label-mono num text-[13px]!">
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-10 flex flex-col items-center gap-5 text-center">
        <span className="label-mono flex items-center gap-2 text-[13px]!">
          <span className="size-1.5 rounded-full bg-positive" />
          {eyebrow}
        </span>
        <h1 className="max-w-[1400px] text-[62px] leading-[1.05] font-medium tracking-[-0.035em] text-balance">{title}</h1>
      </div>

      <div className="mt-12 flex w-full flex-1 justify-center">{children}</div>
    </div>
  );
}

/** Browser-window chrome around a mock. Anchored to the bottom edge so it reads as a product shot. */
export function MockWindow({ url, className, children }: { url: string; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-[calc(100%+24px)] w-[1440px] flex-col overflow-hidden rounded-t-[26px] border border-b-0 border-white/10 bg-card shadow-[0_-30px_120px_-30px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-5 py-3.5">
        <span className="size-3 rounded-full bg-white/15" />
        <span className="size-3 rounded-full bg-white/15" />
        <span className="size-3 rounded-full bg-white/15" />
        <span className="mx-auto rounded-full border border-border bg-background px-5 py-1 font-mono text-[13px] text-muted-foreground">{url}</span>
        <span className="w-[52px]" />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export function Pill({ children, tone = "default", className }: { children: React.ReactNode; tone?: "default" | "positive"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[12px] tracking-wide uppercase",
        tone === "positive" ? "border-positive/30 bg-positive/10 text-positive" : "border-border text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-medium text-white/90", className)}
      style={{ background: `oklch(0.42 0.06 ${hue})` }}
    >
      {initials}
    </span>
  );
}
