import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Cover } from "@/components/cover";
import { FundingBar } from "@/components/funding-bar";
import { PAL_SCENARIOS } from "@/components/landing/demo-data";
import { PixelField } from "@/components/landing/pixel-field";
import { PixelGlyph, type GlyphName } from "@/components/landing/pixel-glyph";
import { Simulations } from "@/components/landing/simulations";
import { Logo } from "@/components/logo";
import { compactNumber, fundedPercent, money } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS: { glyph: GlyphName; title: string; body: string }[] = [
  {
    glyph: "pitch",
    title: "Creators pitch",
    body: "Describe the bigger video you've wanted to make. Palvest drafts the proposal and forecasts it from your channel's own numbers.",
  },
  {
    glyph: "back",
    title: "Fans back it",
    body: "The people who already watch everything you make fund it before it's shot, from $5.",
  },
  {
    glyph: "earn",
    title: "Everyone shares the upside",
    body: "Once it's live, a fixed share of what the video earns goes back to every Pal, pro rata.",
  },
];

const PRINCIPLES = [
  ["Forecasts, not hype", "Expected views come from the channel's last 20 long-form uploads, weighted toward similar videos. AI drafts the pitch; it never touches the numbers."],
  ["A ledger for every payout", "Each distribution is split pro rata in whole cents, so every line adds up exactly to the pool."],
  ["Money moves through PayPal", "A backing counts only once PayPal confirms the capture. Revenue goes back out as a PayPal Payouts batch."],
  ["Creators keep the video", "Pals share revenue for a fixed term. They never own the video, the channel or the creator's company."],
];

const NAV = [
  ["How it works", "#how"],
  ["Simulate", "#simulate"],
  ["Projects", "#projects"],
];

function PrimaryCta({ className }: { className?: string }) {
  return (
    <Link
      href="/pals"
      className={cn("group flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90", className)}
    >
      Find a creator to back <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecondaryCta() {
  return (
    <Link href="/creator" className="rounded-full border border-foreground/15 px-5 py-2.5 text-sm transition hover:border-foreground/40">
      I&apos;m a creator
    </Link>
  );
}

function SectionHead({ eyebrow, title, body, children }: { eyebrow: string; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex max-w-xl flex-col gap-3">
        <span className="label-mono">{eyebrow}</span>
        <h2 className="text-3xl font-medium tracking-[-0.025em] text-balance sm:text-4xl">{title}</h2>
        {body ? <p className="text-muted-foreground text-pretty">{body}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      <header className="sticky top-0 z-30 border-b border-transparent bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/creator" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              For creators
            </Link>
            <Link href="/pals" className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition hover:bg-foreground/90">
              Explore creators
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero */}
        <section className="relative">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(55%_60%_at_70%_40%,black,transparent)]" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20 lg:pb-28">
            <div className="flex flex-col items-start gap-7">
              <span className="label-mono flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-positive" />
                Fan-funded videos · Shared revenue
              </span>
              <h1 className="text-5xl leading-[1.02] font-medium tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
                Invest in your favorite creators.
              </h1>
              <p className="max-w-lg text-lg text-pretty text-muted-foreground">
                Back the next video from a creator you already watch, before it&apos;s made. When it earns, you get a share of what it brings in.
              </p>
              <div className="flex flex-wrap gap-3">
                <PrimaryCta />
                <SecondaryCta />
              </div>
              <dl className="mt-4 grid w-full max-w-lg grid-cols-3 border-t border-border pt-5">
                {[
                  ["Forecast", "From channel data"],
                  ["Payments", "Through PayPal"],
                  ["Payouts", "Split to the cent"],
                ].map(([k, v], i) => (
                  <div key={k} className={cn("flex flex-col gap-1", i > 0 && "border-l border-border pl-4")}>
                    <dt className="label-mono text-[10px]!">{k}</dt>
                    <dd className="text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <PixelField className="aspect-square w-full max-sm:aspect-[5/4] lg:max-w-[540px] lg:justify-self-end" />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <SectionHead eyebrow="How it works" title="One video, three moves." />
            <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-10 bg-background p-6 sm:p-7">
                  <div className="flex items-start justify-between">
                    <PixelGlyph name={s.glyph} />
                    <span className="label-mono num">0{i + 1}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">{s.title}</h3>
                    <p className="text-sm text-pretty text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Simulations */}
        <section id="simulate" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28">
            <SectionHead
              eyebrow="Simulate"
              title="Watch a project play out."
              body="The exact math you see before backing, and a real demo project from pitch to payout. Same formulas the app runs."
            />
            <Simulations />
            <p className="text-xs text-muted-foreground">
              Simulated with demo data. Estimates, not promises: returns aren&apos;t guaranteed and depend on how the video performs.
            </p>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28">
            <SectionHead eyebrow="Raising now" title="Videos waiting on their Pals.">
              <Link href="/pals" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                See every project <ArrowUpRightIcon className="size-4" />
              </Link>
            </SectionHead>
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {PAL_SCENARIOS.map((p) => {
                const pct = fundedPercent(p.funded, p.target);
                return (
                  <li key={p.id}>
                    <Link href="/pals" className="group grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 py-5 sm:grid-cols-[auto_1fr_220px_auto]">
                      <Cover cover={p.cover} className="size-14 rounded-2xl sm:size-16" />
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium transition-colors group-hover:text-foreground/80">{p.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {p.creator} · {p.sharePercent}% revenue share · ~{compactNumber(p.views.base)} views expected
                        </span>
                      </div>
                      <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
                        <div className="num flex justify-between font-mono text-xs">
                          <span>
                            {money(p.funded)} <span className="text-muted-foreground">of {money(p.target)}</span>
                          </span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <FundingBar value={pct} />
                      </div>
                      <ArrowUpRightIcon className="hidden size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Principles */}
        <section className="border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.6fr] lg:[&>div:first-child]:sticky lg:[&>div:first-child]:top-24">
            <SectionHead eyebrow="Under the hood" title="Numbers you can check." />
            <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {PRINCIPLES.map(([title, body], i) => (
                <div key={title} className="flex flex-col gap-2 border-t border-border pt-5">
                  <span className="label-mono num">0{i + 1}</span>
                  <dt className="font-medium">{title}</dt>
                  <dd className="text-sm text-pretty text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative border-t border-border">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(50%_70%_at_50%_100%,black,transparent)]" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-7 px-4 py-24 text-center sm:px-6 sm:py-32">
            <PixelGlyph name="back" className="h-7" />
            <h2 className="max-w-2xl text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl">
              The videos you want to watch, made because you backed them.
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <PrimaryCta />
              <SecondaryCta />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-md text-xs text-pretty text-muted-foreground">
              Returns aren&apos;t guaranteed. Pals share revenue for a fixed term and don&apos;t own the video or the creator&apos;s company. Prototype running on PayPal Sandbox.
            </p>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/creator" className="hover:text-foreground">Creators</Link>
            <Link href="/pals" className="hover:text-foreground">Projects</Link>
            <Link href="/pals/portfolio" className="hover:text-foreground">Portfolio</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
