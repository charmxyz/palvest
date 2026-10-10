import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Cover } from "@/components/cover";
import { CreatorAvatar } from "@/components/creator-avatar";
import { FundingBar } from "@/components/funding-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolio } from "@/lib/data";
import { fundedPercent, moneyCents, relativeDate } from "@/lib/format";
import { estimatedReturn, round2 } from "@/lib/finance";
import { activePalEmail } from "@/lib/session";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { draft: "Draft", funding: "Raising", funded: "In production", published: "Earning" } as const;

export default function PortfolioPage() {
  return (
    <Suspense fallback={<Skeleton className="mt-10 h-96 rounded-3xl" />}>
      <Portfolio />
    </Suspense>
  );
}

async function Portfolio() {
  const email = await activePalEmail();
  const { name, entries } = await getPortfolio(email);
  const contributed = round2(entries.reduce((a, e) => a + e.contributed, 0));
  const received = round2(entries.reduce((a, e) => a + e.received, 0));
  const pending = round2(entries.reduce((a, e) => a + e.pending, 0));

  return (
    <div className="flex flex-col gap-10 pt-6">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <CreatorAvatar name={name ?? email} className="size-14 text-base" />
          <div>
            <div className="label-mono">Pal portfolio</div>
            <h1 className="text-3xl font-medium tracking-tight">{name ?? email}</h1>
            <div className="font-mono text-xs text-muted-foreground">{email}</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-4">
          {[
            ["Projects backed", String(entries.length)],
            ["Contributed", moneyCents(contributed)],
            ["Revenue received", moneyCents(received)],
            ["Owed, not yet paid", moneyCents(pending)],
          ].map(([label, value], i) => (
            <div key={label} className="bg-background p-6">
              <dt className="label-mono">{label}</dt>
              <dd className={cn("num mt-2 text-3xl font-medium tracking-tight", i === 2 && received > 0 && "text-positive")}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {entries.length ? (
        <ul className="flex flex-col gap-3">
          {entries.map((e, i) => {
            const p = e.proposal;
            const pct = fundedPercent(p.amountFunded, p.fundingTarget);
            const est = estimatedReturn(e.contributed, p.fundingTarget, p.forecast.palPool);
            return (
              <li key={p.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Link
                  href={`/pals/${p.id}`}
                  className="group grid items-center gap-5 rounded-3xl border border-border bg-card p-3 transition hover:border-foreground/20 md:grid-cols-[180px_minmax(0,1fr)_auto]"
                >
                  <Cover cover={p.coverImageUrl} title={p.title} className="aspect-video rounded-2xl" />
                  <div className="flex min-w-0 flex-col gap-2 px-2 md:px-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreatorAvatar name={p.creator.channelTitle} src={p.creator.thumbnailUrl} className="size-5" />
                      {p.creator.channelTitle}
                      <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase">
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>
                    <div className="truncate text-lg font-medium tracking-tight">{p.title}</div>
                    <div className="flex items-center gap-3">
                      <FundingBar value={pct} tone={pct >= 100 ? "positive" : "default"} className="max-w-56" />
                      <span className="font-mono text-xs text-muted-foreground">{pct}% funded</span>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-6 px-2 pb-2 text-right md:px-4 md:pb-0">
                    <div>
                      <dt className="label-mono text-[10px]!">Backed</dt>
                      <dd className="num mt-1 font-mono">{moneyCents(e.contributed)}</dd>
                      <dd className="font-mono text-[10px] text-muted-foreground">{relativeDate(e.backedAt)}</dd>
                    </div>
                    <div>
                      <dt className="label-mono text-[10px]!">Received</dt>
                      <dd className={cn("num mt-1 font-mono", e.received > 0 && "text-positive")}>{moneyCents(e.received)}</dd>
                      {e.pending > 0 ? (
                        <dd className="font-mono text-[10px] text-muted-foreground">+{moneyCents(e.pending)} owed</dd>
                      ) : null}
                    </div>
                    <div>
                      <dt className="label-mono text-[10px]!">Expected</dt>
                      <dd className="num mt-1 font-mono">{moneyCents(est.base)}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">You haven&apos;t backed any projects yet.</p>
          <Link href="/pals" className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm text-background">
            Explore creators <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
