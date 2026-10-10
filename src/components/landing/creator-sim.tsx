"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon, PauseIcon, PlayIcon } from "lucide-react";
import { backerPoolOwed, revenueFor, round2 } from "@/lib/finance";
import { compactNumber, integer, money, moneyCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CREATOR_STORY as S } from "./demo-data";

const STAGES = [
  { name: "Pitch", body: "Draft the project, its budget and what Pals get back." },
  { name: "Raise", body: "Fans back it through PayPal before a frame is shot." },
  { name: "Publish", body: "The video goes live and views are tracked against the forecast." },
  { name: "Distribute", body: "The Pal pool is split to the cent and paid out." },
] as const;
const STAGE_MS = 4600;

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const after = (p: number, start: number, span = 0.25) => easeOut((p - start) / span);

const REVENUE = round2(revenueFor(S.views, S.rpm));
const POOL = backerPoolOwed(REVENUE, S.sharePercent, S.target, S.target);
const payoutFor = (amount: number) => round2((amount / S.target) * POOL);

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** Drives the stage + progress clock; pauses while off screen. Reduced motion shows each stage complete. */
function useStageClock(count: number) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [progress, setP] = useState(0);
  const [wantsPlay, setPlaying] = useState(true);
  const playing = wantsPlay && !reduced;
  const p = reduced ? 1 : progress;
  const state = useRef({ stage: 0, elapsed: 0, visible: false });

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => (state.current.visible = e.isIntersecting), { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      const s = state.current;
      if (!s.visible) return;
      s.elapsed += dt;
      if (s.elapsed >= STAGE_MS) {
        s.elapsed = 0;
        s.stage = (s.stage + 1) % count;
        setStage(s.stage);
      }
      setP(Math.min(1, s.elapsed / (STAGE_MS * 0.8)));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, count]);

  const jump = (i: number) => {
    state.current.stage = i;
    state.current.elapsed = 0;
    setStage(i);
    setP(playing ? 0 : 1);
  };
  return { ref, stage, p, playing, setPlaying, jump };
}

export function CreatorSim() {
  const { ref, stage, p, playing, setPlaying, jump } = useStageClock(STAGES.length);

  return (
    <div ref={ref} className="grid overflow-hidden rounded-3xl border border-border bg-card/40 md:grid-cols-[260px_1fr]">
      <div className="flex flex-col border-b border-border md:border-r md:border-b-0">
        <ol className="grid grid-cols-4 md:grid-cols-1">
          {STAGES.map((s, i) => (
            <li key={s.name}>
              <button
                type="button"
                onClick={() => jump(i)}
                className={cn(
                  "relative flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors md:px-5 md:py-5",
                  i === stage ? "bg-foreground/[0.04]" : "hover:bg-foreground/[0.02]",
                )}
              >
                <span className={cn("label-mono num", i === stage && "text-foreground")}>0{i + 1}</span>
                <span className={cn("text-sm font-medium transition-colors", i !== stage && "text-muted-foreground")}>{s.name}</span>
                <span className="hidden text-xs text-muted-foreground md:block">{s.body}</span>
                <span className="absolute inset-x-0 bottom-0 h-px bg-border">
                  <span
                    className="block h-full origin-left bg-foreground"
                    style={{ transform: `scaleX(${i < stage ? 1 : i === stage ? p : 0})` }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-auto hidden items-center justify-between px-5 py-4 md:flex">
          <span className="label-mono">Demo · Nomad Notes</span>
          <PlayToggle playing={playing} onToggle={() => setPlaying(!playing)} />
        </div>
      </div>

      <div className="relative min-h-[420px] p-5 sm:p-8">
        <div className="absolute top-4 right-4 md:hidden">
          <PlayToggle playing={playing} onToggle={() => setPlaying(!playing)} />
        </div>
        <div key={stage} className="animate-rise h-full">
          {stage === 0 && <PitchPanel p={p} />}
          {stage === 1 && <RaisePanel p={p} />}
          {stage === 2 && <PublishPanel p={p} />}
          {stage === 3 && <DistributePanel p={p} />}
        </div>
      </div>
    </div>
  );
}

function PlayToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? "Pause simulation" : "Play simulation"}
      className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
    >
      {playing ? <PauseIcon className="size-3" /> : <PlayIcon className="size-3" />}
    </button>
  );
}

function Row({ label, value, show = 1, strong }: { label: string; value: string; show?: number; strong?: boolean }) {
  return (
    <div
      className={cn("flex items-baseline justify-between gap-4 py-2 text-sm", strong && "font-medium")}
      style={{ opacity: show, transform: `translateY(${(1 - show) * 6}px)` }}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="num font-mono">{value}</span>
    </div>
  );
}

function PitchPanel({ p }: { p: number }) {
  const typed = S.title.slice(0, Math.ceil(S.title.length * after(p, 0, 0.3)));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-foreground/10 font-mono text-[11px]">NN</span>
        <div className="flex flex-col">
          <span className="text-sm">{S.creator}</span>
          <span className="label-mono text-[10px]!">{compactNumber(S.subscribers)} subscribers</span>
        </div>
        <span className="label-mono ml-auto rounded-full border border-border px-2.5 py-1 text-[10px]!">Draft</span>
      </div>
      <h3 className="min-h-[2lh] text-2xl font-medium tracking-tight text-balance sm:text-3xl">
        {typed}
        <span className={cn("ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-foreground", p < 0.35 ? "animate-pulse" : "opacity-0")} />
      </h3>
      <div className="divide-y divide-border border-y border-border">
        {S.budget.map((b, i) => (
          <Row key={b.label} label={b.label} value={money(b.amount)} show={after(p, 0.3 + i * 0.07, 0.15)} />
        ))}
        <Row label="Budget" value={money(S.target)} strong show={after(p, 0.6, 0.15)} />
      </div>
      <dl className="grid grid-cols-3 gap-4" style={{ opacity: after(p, 0.7, 0.2) }}>
        {[
          ["Revenue share", `${S.sharePercent}%`],
          ["Term", `${S.months} months`],
          ["Forecast views", `${compactNumber(S.forecast.low)}–${compactNumber(S.forecast.high)}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label-mono text-[10px]!">{k}</dt>
            <dd className="num mt-1 font-mono text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// A fixed shuffle of the 84 Pal cells, so they light up in a scattered order.
const CELL_ORDER = (() => {
  const order = Array.from({ length: S.pals }, (_, i) => i);
  let seed = 11;
  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const rank = new Array<number>(S.pals);
  order.forEach((cell, r) => (rank[cell] = r));
  return rank;
})();
const BACKERS = ["Maya C.", "Leo P.", "Priya O.", "Sam S.", "Jordan N.", "Ava K.", "Zara H.", "Kai L.", "Omar S.", "Alex R."];
const AMOUNTS = [25, 10, 50, 15, 100, 25, 10, 250, 20, 10];

function RaisePanel({ p }: { p: number }) {
  const e = easeOut(p);
  const lit = Math.round(S.pals * e);
  const raised = Math.round(S.target * e);
  const feed = Math.min(BACKERS.length - 1, Math.floor(e * BACKERS.length));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-mono">Raised</span>
          <div className="num mt-1 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
            {money(raised)}
            <span className="text-lg font-normal tracking-normal text-muted-foreground"> / {money(S.target)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="label-mono">Pals</span>
          <div className="num mt-1 font-mono text-2xl">{lit}</div>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
        <div className={cn("h-full rounded-full transition-colors", e >= 1 ? "bg-positive" : "bg-foreground")} style={{ width: `${e * 100}%` }} />
      </div>
      <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-1" aria-hidden>
        {CELL_ORDER.map((rank, cell) => (
          <span
            key={cell}
            className={cn(
              "aspect-square rounded-[1.5px] transition-colors duration-300",
              rank >= lit ? "bg-foreground/[0.06]" : rank >= lit - 3 && e < 1 ? "bg-positive" : "bg-foreground/80",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {e >= 1 ? (
            <span className="text-positive">Fully funded. Production starts.</span>
          ) : (
            <>
              <span className="text-foreground">{BACKERS[feed]}</span> backed {money(AMOUNTS[feed])}
            </>
          )}
        </span>
        <span className="label-mono">via PayPal</span>
      </div>
    </div>
  );
}

// Cumulative views over 95 days: fast launch, long tail.
const DAYS = 95;
const curve = (d: number) => (1 - Math.exp(-d / 14)) / (1 - Math.exp(-DAYS / 14));
const Y_MAX = 900_000;

function PublishPanel({ p }: { p: number }) {
  const e = easeOut(p);
  const day = Math.round(DAYS * e);
  const views = Math.round(S.views * curve(day));
  const W = 560;
  const H = 160;
  const y = (v: number) => H - (v / Y_MAX) * H;
  const pts = Array.from({ length: day + 1 }, (_, d) => `${(d / DAYS) * W},${y(S.views * curve(d))}`);
  const beat = views > S.forecast.high;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <span className="label-mono">Views · day {day}</span>
          <div className="num mt-1 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">{integer(views)}</div>
        </div>
        <div className="text-right">
          <span className="label-mono">Eligible revenue</span>
          <div className="num mt-1 font-mono text-2xl">{moneyCents(revenueFor(views, S.rpm))}</div>
          <span className="label-mono text-[10px]!">at ${S.rpm} RPM</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
        <rect x={0} y={y(S.forecast.high)} width={W} height={y(S.forecast.low) - y(S.forecast.high)} className="fill-foreground/[0.05]" />
        <line x1={0} x2={W} y1={y(S.forecast.base)} y2={y(S.forecast.base)} className="stroke-foreground/25" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        <polyline points={pts.join(" ")} fill="none" className={beat ? "stroke-positive" : "stroke-foreground"} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block h-2.5 w-4 rounded-[2px] bg-foreground/[0.08]" /> Forecast {compactNumber(S.forecast.low)}–{compactNumber(S.forecast.high)}
        </span>
        <span className={cn("label-mono transition-opacity", beat ? "text-positive opacity-100" : "opacity-0")}>Above forecast</span>
      </div>
    </div>
  );
}

function DistributePanel({ p }: { p: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="label-mono">Pal pool</span>
        <div className="num mt-1 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">{moneyCents(POOL * easeOut(p / 0.4))}</div>
        <p className="num mt-2 font-mono text-xs text-muted-foreground">
          {moneyCents(REVENUE)} × {S.sharePercent}% share × 100% funded
        </p>
      </div>
      <div className="divide-y divide-border border-y border-border">
        <div className="label-mono grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2 text-[10px]!">
          <span>Pal</span><span className="w-16 text-right">Backed</span><span className="w-16 text-right">Receives</span><span className="w-12 text-right">Status</span>
        </div>
        {S.ledger.map((l, i) => {
          const show = after(p, 0.25 + i * 0.1, 0.15);
          const sent = p > 0.45 + i * 0.1 + 0.15;
          return (
            <div key={l.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-2 text-sm" style={{ opacity: show }}>
              <span className="truncate">{l.name}</span>
              <span className="num w-16 text-right font-mono text-muted-foreground">{money(l.amount)}</span>
              <span className="num w-16 text-right font-mono">{moneyCents(payoutFor(l.amount))}</span>
              <span className="flex w-12 justify-end">
                {sent ? <CheckIcon className="animate-pop size-4 text-positive" /> : <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />}
              </span>
            </div>
          );
        })}
        <div className="py-2 text-sm text-muted-foreground" style={{ opacity: after(p, 0.65, 0.15) }}>
          + {S.pals - S.ledger.length} more Pals, split pro rata to the cent
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm" style={{ opacity: after(p, 0.75, 0.2) }}>
        <span className="text-muted-foreground">Nomad Notes keeps</span>
        <span className="num font-mono">{moneyCents(REVENUE - POOL)} <span className="text-muted-foreground">+ owns the film</span></span>
      </div>
    </div>
  );
}
