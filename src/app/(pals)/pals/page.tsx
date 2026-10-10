import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProposalCard } from "@/components/pals/proposal-card";
import { Skeleton } from "@/components/ui/skeleton";
import { listProposals } from "@/lib/data";
import { db } from "@/lib/db";
import { compactNumber, money } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All projects" },
  { key: "funding", label: "Raising" },
  { key: "funded", label: "Funded" },
  { key: "published", label: "Earning" },
] as const;

export default function PalsPage({ searchParams }: PageProps<"/pals">) {
  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col items-center gap-6 pt-10 text-center">
        <span className="rounded-full border border-border bg-muted/60 px-3 py-1 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          Pals marketplace
        </span>
        <h1 className="max-w-3xl text-5xl font-medium tracking-[-0.03em] text-balance sm:text-6xl">
          Back the creators you believe in.
        </h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground">
          Fund their next project before it&apos;s made. When it earns, you share in the revenue.
        </p>
        <Suspense fallback={<Skeleton className="h-16 w-full max-w-xl rounded-2xl" />}>
          <PlatformStats />
        </Suspense>
      </section>

      <Suspense fallback={<GridSkeleton />}>
        <Marketplace searchParams={searchParams} />
      </Suspense>

      <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
        Backing a project is not an investment in the creator&apos;s company and does not confer ownership.
        Returns depend on the project&apos;s actual eligible revenue and are not guaranteed.
      </p>
    </div>
  );
}

async function PlatformStats() {
  await connection();
  const [row] = await db()`
    select
      (select coalesce(sum(amount), 0) from backings where status = 'completed') as raised,
      (select count(distinct lower(backer_email)) from backings where status = 'completed') as pals,
      (select coalesce(sum(backer_pool_amount), 0) from distributions where status in ('processing', 'success', 'ledger_only')) as paid`;
  const stats = [
    ["Raised for creators", money(Number(row.raised))],
    ["Pals backing creators", compactNumber(Number(row.pals))],
    ["Paid back to Pals", money(Number(row.paid))],
  ];
  return (
    <dl className="mt-2 grid w-full max-w-xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card py-4 backdrop-blur">
      {stats.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1 px-4">
          <dd className="num text-xl font-medium tracking-tight">{value}</dd>
          <dt className="label-mono text-[10px]!">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

async function Marketplace({ searchParams }: Pick<PageProps<"/pals">, "searchParams">) {
  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.key === status)?.key ?? "all";
  const all = await listProposals();
  const proposals = active === "all" ? all : all.filter((p) => p.status === active);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-medium tracking-tight">Projects looking for Pals</h2>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? all.length : all.filter((p) => p.status === f.key).length;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/pals" : `/pals?status=${f.key}`}
                scroll={false}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition",
                  active === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label} <span className="ml-1 font-mono text-[11px] opacity-60">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {proposals.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p, i) => (
            <ProposalCard key={p.id} p={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
          Nothing here yet.
        </div>
      )}
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[420px] rounded-3xl" />
      ))}
    </div>
  );
}
