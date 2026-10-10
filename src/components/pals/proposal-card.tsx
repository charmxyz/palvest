import Link from "next/link";
import { Cover } from "@/components/cover";
import { CreatorAvatar } from "@/components/creator-avatar";
import { FundingBar } from "@/components/funding-bar";
import { compactNumber, fundedPercent, money } from "@/lib/format";
import type { ProposalWithCreator } from "@/lib/types";

const STATUS_LABEL = { draft: "Draft", funding: "Raising", funded: "Funded", published: "Earning" } as const;

export function ProposalCard({ p, index = 0 }: { p: ProposalWithCreator; index?: number }) {
  const pct = fundedPercent(p.amountFunded, p.fundingTarget);
  return (
    <Link
      href={`/pals/${p.id}`}
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-rise group flex flex-col overflow-hidden rounded-3xl border border-border bg-gradient-to-b bg-card transition duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,.25)]"
    >
      <Cover cover={p.coverImageUrl} title={p.title} className="aspect-[16/10]">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full bg-black/50 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-white/90 uppercase backdrop-blur">
            {STATUS_LABEL[p.status]}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-black uppercase">
            {p.revenueSharePercent}% rev share
          </span>
        </div>
        <h3 className="absolute inset-x-0 bottom-0 p-5 text-xl leading-snug font-medium tracking-tight text-balance text-white drop-shadow">
          {p.title}
        </h3>
      </Cover>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <CreatorAvatar name={p.creator.channelTitle} src={p.creator.thumbnailUrl} className="size-6" />
          <span className="truncate text-sm text-muted-foreground">
            {p.creator.channelTitle} · {compactNumber(p.creator.subscriberCount)} subscribers
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="num flex items-baseline justify-between font-mono text-sm">
            <span>
              {money(p.amountFunded)} <span className="text-muted-foreground">of {money(p.fundingTarget)}</span>
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <FundingBar value={pct} tone={pct >= 100 ? "positive" : "default"} />
        </div>
        <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <div>
            <dt className="label-mono text-[10px]!">Term</dt>
            <dd className="num mt-1 font-mono text-sm">{p.revenueShareMonths} mo</dd>
          </div>
          <div>
            <dt className="label-mono text-[10px]!">Pals</dt>
            <dd className="num mt-1 font-mono text-sm">{p.palCount}</dd>
          </div>
          <div>
            <dt className="label-mono text-[10px]!">Expected views</dt>
            <dd className="num mt-1 font-mono text-sm">{compactNumber(p.forecast.views.base)}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
