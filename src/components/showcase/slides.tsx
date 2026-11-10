import { ArrowRightIcon, CheckIcon, LockIcon, PlayIcon, SparklesIcon } from "lucide-react";
import { Cover } from "@/components/cover";
import { FundingBar } from "@/components/funding-bar";
import { CREATOR_STORY, PAL_SCENARIOS } from "@/components/landing/demo-data";
import { compactNumber, integer, money, moneyCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar, MockWindow, Pill } from "./frame";

export type Slide = { eyebrow: string; title: string; Mock: () => React.ReactNode };

const S = CREATOR_STORY;
const pool = Math.round(((S.views / 1000) * S.rpm * S.sharePercent) / 100 * 100) / 100; // $673.91
const shareOf = (amount: number) => Math.round(pool * (amount / S.target) * 100) / 100;

/* ─── 01 · AI drafts the pitch ─────────────────────────────────────────── */

function PitchMock() {
  const total = S.budget.reduce((a, b) => a + b.amount, 0);
  return (
    <MockWindow url="palvest.xyz/creator/new">
      <div className="grid h-full grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-6 border-r border-border bg-surface p-10">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-4">
            <Avatar name="Nomad Notes" className="size-11" />
            <div className="flex flex-col">
              <span className="text-[17px] font-medium">Nomad Notes</span>
              <span className="text-[14px] text-muted-foreground">{compactNumber(S.subscribers)} subscribers · YouTube connected</span>
            </div>
            <CheckIcon className="ml-auto size-5 text-positive" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="label-mono text-[12px]!">The video you want to make</span>
            <div className="rounded-2xl border border-foreground/20 bg-card p-5 text-[19px] leading-relaxed">
              Ride the Trans-Siberian end to end in 48 hours and film all of it: the people, the food, 9,000 km of track. I need a camera op and a local
              fixer to pull it off.
              <span className="ml-0.5 inline-block h-6 w-0.5 translate-y-1 animate-pulse bg-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="label-mono text-[12px]!">Palvest drafts</span>
            {["Title and hook", "Budget breakdown", "View forecast from your channel", "Pal terms"].map((t) => (
              <span key={t} className="flex items-center gap-3 text-[17px] text-muted-foreground">
                <CheckIcon className="size-4.5 text-positive" /> {t}
              </span>
            ))}
          </div>
          <button className="mt-auto flex items-center justify-center gap-2.5 rounded-full bg-foreground py-4 text-[17px] font-medium text-background">
            <SparklesIcon className="size-5" /> Draft my pitch
          </button>
        </div>

        <div className="flex flex-col gap-6 p-10">
          <div className="flex items-center justify-between">
            <Pill tone="positive">
              <SparklesIcon className="size-3.5" /> Drafted by Palvest AI
            </Pill>
            <span className="label-mono text-[12px]!">Draft · editable</span>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-[34px] leading-tight font-medium tracking-[-0.02em]">{S.title}</h3>
            <p className="text-[17px] leading-relaxed text-pretty text-muted-foreground">
              Two days, one train, the longest rail line on earth. A real-time ride from Moscow toward the Pacific, told through the people in the carriages.
            </p>
          </div>
          <div className="flex flex-col rounded-2xl border border-border">
            {S.budget.map((b) => (
              <div key={b.label} className="flex justify-between border-b border-border px-5 py-3 text-[16px] last:border-0">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="num font-mono">{money(b.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between rounded-b-2xl bg-foreground/[0.04] px-5 py-3 text-[16px] font-medium">
              <span>Raising</span>
              <span className="num font-mono">{money(total)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Pal share", `${S.sharePercent}% of revenue`],
              ["Term", `${S.months} months`],
              ["Backing from", "$5"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 rounded-2xl border border-border p-4">
                <span className="label-mono text-[11px]!">{k}</span>
                <span className="text-[17px]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 02 · Forecast from the channel's own numbers ─────────────────────── */

// Last 20 long-form uploads (thousands of views), oldest first. Similar travel videos flagged.
const UPLOADS: [number, boolean][] = [
  [210, false], [340, true], [265, false], [190, false], [395, true], [300, false], [455, true], [240, false], [310, false], [520, true],
  [285, false], [230, false], [410, true], [355, false], [270, false], [600, true], [325, false], [250, false], [480, true], [370, false],
];

function ForecastMock() {
  const max = 700;
  const band = { low: S.forecast.low / 1000, base: S.forecast.base / 1000, high: S.forecast.high / 1000 };
  const y = (v: number) => `${(v / max) * 100}%`;
  return (
    <MockWindow url="palvest.xyz/creator/nomad-notes/forecast">
      <div className="grid h-full grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-6 p-10">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="label-mono text-[12px]!">Last 20 long-form uploads</span>
              <span className="text-[24px] font-medium">Views per video</span>
            </div>
            <div className="flex gap-5 text-[14px] text-muted-foreground">
              <span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-positive" /> Similar to this pitch</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-foreground/25" /> Other uploads</span>
            </div>
          </div>
          <div className="relative mt-2 flex-1 pl-14">
            {[0, 200, 400, 600].map((t) => (
              <div key={t} className="absolute inset-x-0 flex items-center" style={{ bottom: y(t) }}>
                <span className="num w-14 -translate-y-0 pr-3 text-right font-mono text-[12px] text-muted-foreground">{t ? `${t}K` : "0"}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            ))}
            <div
              className="absolute right-0 left-14 border-y border-dashed border-positive/40 bg-positive/[0.07]"
              style={{ bottom: y(band.low), height: `${((band.high - band.low) / max) * 100}%` }}
            />
            <div className="absolute right-0 left-14 flex items-center" style={{ bottom: y(band.base) }}>
              <span className="h-0.5 flex-1 bg-positive" />
              <span className="num absolute left-3 z-10 -translate-y-4 rounded-md bg-positive px-2 py-0.5 font-mono text-[12px] text-positive-foreground">
                Forecast {compactNumber(S.forecast.base)}
              </span>
            </div>
            <div className="absolute inset-0 left-14 flex items-end gap-2.5 px-2">
              {UPLOADS.map(([v, similar], i) => (
                <div
                  key={i}
                  className={cn("flex-1 rounded-t-md", similar ? "bg-positive/85" : "bg-foreground/20")}
                  style={{ height: y(v) }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-l border-border bg-surface p-10">
          <span className="label-mono text-[12px]!">Forecast for this video</span>
          {(
            [
              ["Low", S.forecast.low, false],
              ["Base", S.forecast.base, true],
              ["High", S.forecast.high, false],
            ] as const
          ).map(([k, v, hi]) => (
            <div key={k} className={cn("flex items-center justify-between rounded-2xl border p-5", hi ? "border-positive/40 bg-positive/[0.06]" : "border-border")}>
              <div className="flex flex-col gap-1">
                <span className="label-mono text-[12px]!">{k}</span>
                <span className="num text-[30px] font-medium tracking-tight">{compactNumber(v)} <span className="text-[17px] text-muted-foreground">views</span></span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="label-mono text-[11px]!">Revenue</span>
                <span className="num font-mono text-[18px]">{money((v / 1000) * S.rpm)}</span>
              </div>
            </div>
          ))}
          <p className="mt-auto text-[15px] leading-relaxed text-pretty text-muted-foreground">
            Weighted toward 6 similar travel videos at a ${S.rpm} RPM. Computed, not generated: AI never touches these numbers.
          </p>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 03 · Fans back it from $5 ────────────────────────────────────────── */

function BackMock() {
  const p = PAL_SCENARIOS[0];
  const amounts = [5, 10, 25, 50, 100, 250];
  const pick = 25;
  return (
    <MockWindow url="palvest.xyz/pals/crossing-mongolia">
      <div className="grid h-full grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-7 p-10">
          <Cover cover={p.cover} className="flex aspect-[16/8] w-full items-end rounded-3xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                <PlayIcon className="size-8 translate-x-0.5 fill-white text-white" />
              </span>
            </div>
            <div className="relative flex flex-col gap-2 p-7">
              <span className="label-mono text-[12px]! text-white/70!">Pitch video · 2:14</span>
              <span className="text-[34px] leading-tight font-medium tracking-[-0.02em] text-white">{p.title}</span>
            </div>
          </Cover>
          <div className="flex flex-col gap-3">
            <div className="num flex items-end justify-between font-mono">
              <span className="text-[26px]">
                {money(p.funded)} <span className="text-[17px] text-muted-foreground">of {money(p.target)}</span>
              </span>
              <span className="text-[16px] text-muted-foreground">81% · 9 days left</span>
            </div>
            <FundingBar value={81} className="h-2.5" />
            <div className="mt-1 flex items-center gap-3">
              <div className="flex -space-x-1.5">
                {["Grace Okafor", "Theo Larsen", "Hana Costa", "Alex Rivera", "Priya Shah"].map((n) => (
                  <Avatar key={n} name={n} className="size-8 text-[11px] ring-2 ring-card" />
                ))}
              </div>
              <span className="text-[16px] text-muted-foreground">213 Pals have backed this</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-l border-border bg-surface p-10">
          <div className="flex items-center gap-3">
            <Avatar name="Nomad Notes" className="size-11" />
            <div className="flex flex-col">
              <span className="text-[17px] font-medium">Nomad Notes</span>
              <span className="text-[14px] text-muted-foreground">{compactNumber(S.subscribers)} subscribers</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="label-mono text-[12px]!">Choose your amount</span>
            <div className="grid grid-cols-3 gap-2.5">
              {amounts.map((a) => (
                <span
                  key={a}
                  className={cn(
                    "num rounded-2xl border py-3.5 text-center font-mono text-[19px]",
                    a === pick ? "border-foreground bg-foreground text-background" : "border-border text-foreground/80",
                  )}
                >
                  ${a}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-border text-[16px]">
            {[
              ["Revenue share", `${p.sharePercent}% for ${p.months} months`],
              ["Your stake in the pool", `${((pick / p.target) * 100).toFixed(2)}%`],
              ["Expected views", `~${compactNumber(p.views.base)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border px-5 py-3 last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="num font-mono">{v}</span>
              </div>
            ))}
          </div>
          <button className="mt-auto flex items-center justify-center gap-2 rounded-full bg-foreground py-4 text-[18px] font-medium text-background">
            Back ${pick} with PayPal <ArrowRightIcon className="size-5" />
          </button>
          <span className="-mt-2 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
            <LockIcon className="size-3.5" /> Counts only once PayPal confirms the payment
          </span>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 04 · See what you'd earn first ───────────────────────────────────── */

function SimMock() {
  const amount = 250;
  const stake = amount / S.target;
  const views = S.forecast.high;
  const revenue = (views / 1000) * S.rpm;
  const palPool = (revenue * S.sharePercent) / 100;
  const rows = (["low", "base", "high"] as const).map((k) => {
    const v = S.forecast[k];
    const pl = ((v / 1000) * S.rpm * S.sharePercent) / 100;
    return { k, v, pl, you: pl * stake };
  });
  const pos = 0.72;
  return (
    <MockWindow url="palvest.xyz/pals/trans-siberian/simulate">
      <div className="flex h-full flex-col gap-8 p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Cover cover="gradient:1" className="size-14 rounded-2xl" />
            <div className="flex flex-col">
              <span className="text-[20px] font-medium">{S.title}</span>
              <span className="text-[15px] text-muted-foreground">Nomad Notes · {S.sharePercent}% revenue share for {S.months} months</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="label-mono text-[12px]!">If you back</span>
            <span className="num rounded-full border border-foreground bg-foreground px-5 py-2 font-mono text-[18px] text-background">{money(amount)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-8">
          <div className="flex items-end justify-between">
            <span className="label-mono text-[12px]!">Drag the views</span>
            <span className="num text-[30px] font-medium tracking-tight">{integer(views)} views</span>
          </div>
          <div className="relative mt-3 h-2.5 rounded-full bg-foreground/10">
            <div className="absolute inset-y-0 left-0 rounded-full bg-positive" style={{ width: `${pos * 100}%` }} />
            <span className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-positive bg-background shadow-lg" style={{ left: `${pos * 100}%` }} />
            {[
              ["Low", 0.26],
              ["Base", 0.48],
              ["High", 0.72],
            ].map(([l, x]) => (
              <span key={l} className="absolute top-6 -translate-x-1/2 font-mono text-[12px] tracking-wide text-muted-foreground uppercase" style={{ left: `${(x as number) * 100}%` }}>
                {l}
              </span>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-5">
            {[
              ["Video earns", money(revenue), `at $${S.rpm} RPM`],
              ["Pal pool", money(palPool), `${S.sharePercent}% of revenue`],
              ["You get", moneyCents(palPool * stake), `${(stake * 100).toFixed(2)}% of the pool`],
            ].map(([k, v, sub], i, arr) => (
              <div key={k} className="contents">
                <div className={cn("flex flex-col gap-1.5 rounded-2xl border p-5", i === 2 ? "border-positive/40 bg-positive/[0.07]" : "border-border bg-card")}>
                  <span className="label-mono text-[12px]!">{k}</span>
                  <span className={cn("num text-[40px] leading-none font-medium tracking-tight", i === 2 && "text-positive")}>{v}</span>
                  <span className="text-[14px] text-muted-foreground">{sub}</span>
                </div>
                {i < arr.length - 1 ? <ArrowRightIcon className="size-6 text-muted-foreground" /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {rows.map((r) => (
            <div key={r.k} className="flex items-center justify-between rounded-2xl border border-border px-6 py-4">
              <div className="flex flex-col">
                <span className="label-mono text-[12px]!">{r.k} case</span>
                <span className="num text-[16px] text-muted-foreground">{compactNumber(r.v)} views</span>
              </div>
              <span className="num font-mono text-[22px]">{moneyCents(r.you)}</span>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 05 · Payout ledger ───────────────────────────────────────────────── */

function LedgerMock() {
  const revenue = (S.views / 1000) * S.rpm;
  const lines = [
    ["Grace Okafor", 250],
    ["Theo Larsen", 100],
    ["Priya Shah", 75],
    ["Hana Costa", 50],
    ["Marcus Bell", 25],
    ["Alex Rivera", 10],
  ] as const;
  return (
    <MockWindow url="palvest.xyz/creator/nomad-notes/payouts">
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-4 border-b border-border">
          {[
            ["Views this month", integer(S.views)],
            ["Video revenue", moneyCents(revenue)],
            [`Pal pool · ${S.sharePercent}%`, moneyCents(pool)],
            ["Pals paid", String(S.pals)],
          ].map(([k, v], i) => (
            <div key={k} className={cn("flex flex-col gap-1.5 px-10 py-6", i > 0 && "border-l border-border", i === 2 && "bg-positive/[0.06]")}>
              <span className="label-mono text-[12px]!">{k}</span>
              <span className={cn("num text-[32px] font-medium tracking-tight", i === 2 && "text-positive")}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col px-10 pt-5">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] px-2 pb-3">
            {["Pal", "Backed", "Share", "Payout", "Status"].map((h, i) => (
              <span key={h} className={cn("label-mono text-[12px]!", i > 0 && i < 4 && "text-right", i === 4 && "text-right")}>{h}</span>
            ))}
          </div>
          {lines.map(([name, amt]) => (
            <div key={name} className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] items-center border-t border-border px-2 py-3 text-[17px]">
              <span className="flex items-center gap-3">
                <Avatar name={name} className="size-8 text-[11px]" /> {name}
              </span>
              <span className="num text-right font-mono text-muted-foreground">{money(amt)}</span>
              <span className="num text-right font-mono text-muted-foreground">{((amt / S.target) * 100).toFixed(3).replace(/0$/, "")}%</span>
              <span className="num text-right font-mono">{moneyCents(shareOf(amt))}</span>
              <span className="flex justify-end">
                <Pill tone="positive">
                  <CheckIcon className="size-3.5" /> Sent
                </Pill>
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] items-center border-t border-border px-2 py-3 text-[16px] text-muted-foreground">
            <span>+ 78 more Pals</span>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-2xl border border-border bg-surface px-6 py-4 text-[16px]">
            <span className="flex items-center gap-2.5 text-muted-foreground">
              <CheckIcon className="size-5 text-positive" /> 84 lines add up to exactly {moneyCents(pool)}
            </span>
            <span className="font-mono text-[14px] text-muted-foreground">PayPal Payouts · batch 7XK29QF</span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

/* ─── 06 · Pal portfolio ───────────────────────────────────────────────── */

function PortfolioMock() {
  const backings = [
    { title: S.title, creator: "Nomad Notes", cover: "gradient:1", amount: 250, status: "Live · earning", earned: shareOf(250), pct: 100, tone: "positive" as const },
    { title: PAL_SCENARIOS[0].title, creator: "Nomad Notes", cover: "gradient:0", amount: 100, status: "Raising", earned: 0, pct: 81, tone: "default" as const },
    { title: PAL_SCENARIOS[1].title, creator: "Kitchen Lab", cover: "gradient:4", amount: 25, status: "Raising", earned: 0, pct: 61, tone: "default" as const },
    { title: PAL_SCENARIOS[2].title, creator: "Trail & Error", cover: "gradient:3", amount: 10, status: "Raising", earned: 0, pct: 27, tone: "default" as const },
  ];
  const months = [0, 0, 18.4, 31.2, 42.12];
  return (
    <MockWindow url="palvest.xyz/pals/portfolio">
      <div className="grid h-full grid-cols-[1fr_1.9fr]">
        <div className="flex flex-col gap-6 border-r border-border bg-surface p-10">
          <div className="flex items-center gap-3">
            <Avatar name="Grace Okafor" className="size-12 text-[15px]" />
            <div className="flex flex-col">
              <span className="text-[18px] font-medium">Grace Okafor</span>
              <span className="text-[14px] text-muted-foreground">Pal since March</span>
            </div>
          </div>
          {[
            ["Total backed", money(385)],
            ["Earned so far", moneyCents(shareOf(250))],
          ].map(([k, v], i) => (
            <div key={k} className="flex flex-col gap-1.5 border-t border-border pt-5">
              <span className="label-mono text-[12px]!">{k}</span>
              <span className={cn("num text-[44px] leading-none font-medium tracking-tight", i === 1 && "text-positive")}>{v}</span>
            </div>
          ))}
          <div className="mt-auto flex flex-col gap-3">
            <span className="label-mono text-[12px]!">Earned to date</span>
            <div className="flex h-28 items-end gap-2">
              {months.map((m, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className={cn("w-full rounded-t-md", m ? "bg-positive/80" : "bg-foreground/10")} style={{ height: m ? `${(m / 42.12) * 88}px` : "4px" }} />
                  <span className="font-mono text-[11px] text-muted-foreground">{["Jul", "Aug", "Sep", "Oct", "Nov"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-10">
          <div className="flex items-center justify-between">
            <span className="text-[22px] font-medium">Your videos</span>
            <span className="label-mono text-[12px]!">4 backed · 1 live</span>
          </div>
          {backings.map((b) => (
            <div key={b.title} className="grid grid-cols-[auto_1fr_200px_120px] items-center gap-6 rounded-2xl border border-border p-4 pr-6">
              <Cover cover={b.cover} className="size-16 rounded-xl" />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[18px] font-medium">{b.title}</span>
                <span className="text-[14px] text-muted-foreground">
                  {b.creator} · backed {money(b.amount)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Pill tone={b.tone} className="self-start">
                  {b.status}
                </Pill>
                {b.pct < 100 ? <FundingBar value={b.pct} /> : <FundingBar value={100} tone="positive" />}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="label-mono text-[11px]!">Earned</span>
                <span className={cn("num font-mono text-[20px]", b.earned ? "text-positive" : "text-muted-foreground")}>{b.earned ? moneyCents(b.earned) : "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

export const SLIDES: Slide[] = [
  { eyebrow: "AI-drafted pitches", title: "Describe the video you've always wanted to make, and Palvest writes the pitch.", Mock: PitchMock },
  { eyebrow: "Data-backed forecasts", title: "Every forecast comes from the channel's own uploads, not hype.", Mock: ForecastMock },
  { eyebrow: "Fan backing", title: "Fans back the next video before it's shot, starting at $5.", Mock: BackMock },
  { eyebrow: "Earnings simulator", title: "See exactly what you could earn before you put in a dollar.", Mock: SimMock },
  { eyebrow: "Transparent payouts", title: "Revenue is split to the cent and paid out through PayPal.", Mock: LedgerMock },
  { eyebrow: "Pal portfolio", title: "Every video you've backed, and what it's paid you, in one place.", Mock: PortfolioMock },
];
