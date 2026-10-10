"use client";

import { useState } from "react";
import { Cover } from "@/components/cover";
import { Slider } from "@/components/ui/slider";
import { palShareOf, revenueFor, round2 } from "@/lib/finance";
import { compactNumber, fundedPercent, integer, money, moneyCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAL_SCENARIOS, type PalScenario } from "./demo-data";

const AMOUNTS = [10, 25, 50, 100, 250];
const OUTCOMES = ["low", "base", "high"] as const;
const STEPS = 1000;

/** Views at which the pool repays a backer in full. The same for every amount. */
const breakevenViews = (s: PalScenario) => (s.target * 1000) / (s.rpm * (s.sharePercent / 100));

/** Log-scaled slider: from half the low case up to just past breakeven. */
function scale(s: PalScenario) {
  const min = Math.log(s.views.low * 0.5);
  const max = Math.log(breakevenViews(s) * 1.25);
  return {
    toViews: (step: number) => Math.round(Math.exp(min + (step / STEPS) * (max - min)) / 1000) * 1000,
    toStep: (views: number, round = Math.round) => round(((Math.log(views) - min) / (max - min)) * STEPS),
  };
}

export function PalSim() {
  const [scenarioId, setScenarioId] = useState(PAL_SCENARIOS[0].id);
  const [amount, setAmount] = useState(25);
  const s = PAL_SCENARIOS.find((x) => x.id === scenarioId)!;
  const { toViews, toStep } = scale(s);
  const [step, setStep] = useState(() => toStep(s.views.base));
  const views = toViews(step);

  const revenue = round2(revenueFor(views, s.rpm));
  const pool = round2(revenue * (s.sharePercent / 100));
  const stake = palShareOf(amount, s.target, s.funded);
  const payout = round2(pool * stake);
  const breakeven = breakevenViews(s);
  // Round up so the snapped view count actually reaches breakeven.
  const breakevenStep = toStep(breakeven, Math.ceil);
  const outcome = OUTCOMES.find((o) => Math.abs(toStep(s.views[o]) - step) < 4);
  const pct = fundedPercent(s.funded, s.target);

  const pick = (id: string) => {
    const next = PAL_SCENARIOS.find((x) => x.id === id)!;
    setScenarioId(id);
    setStep(scale(next).toStep(next.views.base));
  };

  return (
    <div className="grid overflow-hidden rounded-3xl border border-border bg-card/40 md:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col gap-7 border-b border-border p-5 sm:p-8 md:border-r md:border-b-0">
        <fieldset className="flex flex-col gap-2">
          <legend className="label-mono mb-3">Pick a project</legend>
          {PAL_SCENARIOS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => pick(x.id)}
              aria-pressed={x.id === scenarioId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition",
                x.id === scenarioId ? "border-foreground/30 bg-foreground/[0.04]" : "border-transparent hover:bg-foreground/[0.02]",
              )}
            >
              <Cover cover={x.cover} className="size-11 shrink-0 rounded-xl" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{x.title}</span>
                <span className="text-xs text-muted-foreground">
                  {x.creator} · {x.sharePercent}% for {x.months} mo
                </span>
              </span>
              <span className="num ml-auto font-mono text-xs text-muted-foreground">{fundedPercent(x.funded, x.target)}%</span>
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend className="label-mono mb-3">You back</legend>
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                aria-pressed={a === amount}
                className={cn(
                  "num rounded-full border px-3.5 py-1.5 font-mono text-sm transition",
                  a === amount ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
                )}
              >
                {money(a)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <legend className="label-mono">If the video gets</legend>
            <span className="num font-mono text-sm">{integer(views)} views</span>
          </div>
          <Slider
            value={[step]}
            min={0}
            max={STEPS}
            onValueChange={([v]) => setStep(v)}
            aria-label="Views"
          />
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setStep(toStep(s.views[o]))}
                className={cn(
                  "label-mono rounded-full border px-2.5 py-1 text-[10px]! transition",
                  outcome === o ? "border-foreground/40 text-foreground" : "border-border hover:text-foreground",
                )}
              >
                {o} · {compactNumber(s.views[o])}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStep(breakevenStep)}
              className={cn(
                "label-mono rounded-full border px-2.5 py-1 text-[10px]! transition",
                Math.abs(breakevenStep - step) < 4 ? "border-positive/60 text-positive" : "border-border hover:text-foreground",
              )}
            >
              Full payback · {compactNumber(breakeven)}
            </button>
          </div>
        </fieldset>
      </div>

      {/* The receipt: every step of the math, nothing hidden. */}
      <div className="flex flex-col gap-6 p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="label-mono">Estimate</span>
          <span className="num font-mono text-xs text-muted-foreground">
            {money(s.funded)} of {money(s.target)} raised · {pct}%
          </span>
        </div>
        <dl className="num divide-y divide-dashed divide-border font-mono text-sm">
          <Line k="Views" v={integer(views)} />
          <Line k={`Revenue · $${s.rpm} RPM`} v={moneyCents(revenue)} />
          <Line k={`Pal pool · ${s.sharePercent}%`} v={moneyCents(pool)} />
          <Line k={`Your stake · ${money(amount)} / ${money(s.target)}`} v={`${(stake * 100).toFixed(2)}%`} />
        </dl>
        <div className="flex items-end justify-between gap-4 border-t border-foreground/20 pt-5">
          <div>
            <span className="label-mono">You receive</span>
            <p className="mt-1 text-xs text-muted-foreground">over {s.months} months, via PayPal</p>
          </div>
          <span className={cn("num text-4xl font-medium tracking-[-0.03em] transition-colors", payout >= amount && "text-positive")}>
            {moneyCents(payout)}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="h-1 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div
              className={cn("h-full rounded-full transition-[width] duration-300", payout >= amount ? "bg-positive" : "bg-foreground/70")}
              style={{ width: `${Math.min(100, (payout / amount) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {payout >= amount
              ? `Your ${money(amount)} is back in full, and the film exists because you backed it.`
              : `Your full ${money(amount)} comes back at ${compactNumber(breakeven)} views. Back it because you want it made; share in it if it takes off.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
