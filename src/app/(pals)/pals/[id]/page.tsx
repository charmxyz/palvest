import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, ArrowUpRightIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react";
import { TrajectoryChart } from "@/components/charts/trajectory-chart";
import { ViewsChart } from "@/components/charts/views-chart";
import { Cover } from "@/components/cover";
import { CreatorAvatar } from "@/components/creator-avatar";
import { BackPanel } from "@/components/pals/back-panel";
import { paypalConfig } from "@/lib/paypal-config";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreator, getDistributions, getProposal, getPublishedVideo, settlement } from "@/lib/data";
import { ScenarioTable } from "@/components/scenario-table";
import { compactNumber, integer, money, moneyCents, relativeDate } from "@/lib/format";

export default function ProposalPage({ params }: PageProps<"/pals/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/pals/[id]">, "params">) {
  const { id } = await params;
  const p = await getProposal(id);
  if (!p) notFound();
  const [creator, video, distributions] = await Promise.all([
    getCreator(p.creatorProfileId),
    getPublishedVideo(id),
    getDistributions(id),
  ]);
  if (!creator) notFound();
  const s = settlement(p, video, distributions);
  const f = p.forecast;
  const comparables = creator.videos.filter((v) => f.comparableVideoIds.includes(v.videoId));
  const budgetTotal = p.budget.reduce((a, b) => a + b.amount, 0) || 1;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/pals" className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> All videos
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <article className="flex min-w-0 flex-col gap-10">
          <header className="flex flex-col gap-6">
            <Cover cover={p.coverImageUrl} title={p.title} className="aspect-[16/8] rounded-3xl border border-border" />
            <div className="flex items-center gap-3">
              <CreatorAvatar name={creator.channelTitle} src={creator.thumbnailUrl} className="size-10" />
              <div>
                <div className="font-medium">{creator.channelTitle}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {compactNumber(creator.subscriberCount)} subscribers · {compactNumber(creator.metrics.medianViews)} median views
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl">{p.title}</h1>
            {p.description ? <p className="max-w-2xl text-lg text-muted-foreground">{p.description}</p> : null}
          </header>

          {p.creatorPitch ? (
            <blockquote className="border-l-2 border-foreground/30 pl-5 text-lg text-balance">
              “{p.creatorPitch}”
              <footer className="mt-2 font-mono text-xs text-muted-foreground">— {creator.channelTitle}</footer>
            </blockquote>
          ) : null}

          {video ? (
            <Section label="Since publication" title={`${integer(video.currentViews)} views`}>
              <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-5">
                <Mini label="Eligible revenue" value={moneyCents(s.eligibleRevenue)} />
                <Mini label="Pal pool owed" value={moneyCents(s.totalOwed)} />
                <Mini label="Paid to Pals" value={moneyCents(s.distributed)} />
              </div>
              {video.trajectory.length > 1 ? (
                <TrajectoryChart data={video.trajectory} rpm={video.assumedRpm} forecast={{ base: f.views.base, high: f.views.high }} />
              ) : null}
              {video.youtubeVideoId ? (
                <a href={`https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
                  Watch on YouTube <ArrowUpRightIcon className="size-3" />
                </a>
              ) : null}
            </Section>
          ) : null}

          <Section label="AI performance estimate" title={`${compactNumber(f.views.base)} views expected`}>
            <ScenarioTable
              className="rounded-2xl bg-card"
              rows={[
                { label: "Views", values: f.views, format: compactNumber },
                { label: "Video revenue", values: f.revenue, format: (n) => money(n, { cents: false }) },
                { label: `Pal pool (${p.revenueSharePercent}%)`, values: f.palPool, format: (n) => money(n, { cents: false }), strong: true },
              ]}
            />
            <p className="font-mono text-[11px] text-muted-foreground">Revenue assumes {moneyCents(f.rpm)} RPM.</p>
            <div className="flex gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
              <SparklesIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                {f.explanation ? <p>{f.explanation}</p> : null}
                <p className="text-muted-foreground">
                  {f.method === "similarity"
                    ? `"As expected" weights ${comparables.length} comparable videos 65% and the channel's median 35%; the other two outcomes keep the channel's own spread. AI picks the comparables, code does the math.`
                    : "Outcomes are the 25th percentile, median and 75th percentile of the creator's recent long-form uploads."}
                </p>
              </div>
            </div>
          </Section>

          <Section label="Creator track record" title={`Last ${creator.videos.length} long-form uploads`}>
            <ViewsChart videos={creator.videos} highlight={f.comparableVideoIds} median={creator.metrics.medianViews} />
          </Section>

          {comparables.length ? (
            <Section label="Comparable previous videos" title="What the forecast leans on">
              <div className="grid gap-3 sm:grid-cols-2">
                {comparables.map((v) => {
                  const real = !v.videoId.endsWith("seed");
                  const inner = (
                    <>
                      {v.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnailUrl} alt="" className="aspect-video w-28 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <Cover cover={`gradient:${v.title.length % 6}`} className="aspect-video w-28 shrink-0 rounded-lg" />
                      )}
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm">{v.title}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          {integer(v.viewCount)} views · {relativeDate(v.publishedAt)}
                        </div>
                      </div>
                    </>
                  );
                  const cls = "flex items-center gap-3 rounded-2xl border border-border p-2.5 pr-4 transition hover:border-foreground/20";
                  return real ? (
                    <a key={v.videoId} href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <div key={v.videoId} className={cls}>{inner}</div>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {p.budget.length ? (
            <Section label="Budget" title={`Where ${money(p.fundingTarget)} goes`}>
              <ul className="flex flex-col gap-4">
                {p.budget.map((b) => (
                  <li key={b.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{b.label}</span>
                      <span className="num font-mono text-muted-foreground">{money(b.amount)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="animate-fill-in h-full rounded-full bg-foreground/80" style={{ width: `${(b.amount / budgetTotal) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {p.risks.length ? (
            <Section label="Risks" title="What could go wrong">
              <ul className="flex flex-col gap-2">
                {p.risks.map((r) => (
                  <li key={r} className="flex gap-2.5 text-sm text-muted-foreground">
                    <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <p className="rounded-2xl border border-border p-4 text-xs leading-relaxed text-muted-foreground">
            Forecasts are estimates based on public YouTube data and an assumed RPM; they are not a promise of returns.
            Pals receive {p.revenueSharePercent}% of the video&apos;s eligible YouTube revenue for {p.revenueShareMonths} months after
            publication, pro rata to their contribution. If the video underperforms, Pals may receive less than they contributed.
          </p>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BackPanel
            proposalId={p.id}
            title={p.title}
            status={p.status}
            fundingTarget={p.fundingTarget}
            amountFunded={p.amountFunded}
            palCount={p.palCount}
            revenueSharePercent={p.revenueSharePercent}
            revenueShareMonths={p.revenueShareMonths}
            forecastViews={f.views}
            forecastRevenue={f.revenue}
            palPool={f.palPool}
            paypal={paypalConfig()}
          />
        </aside>
      </div>
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <div className="label-mono">{label}</div>
        <h2 className="mt-1 text-2xl font-medium tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-mono text-[10px]!">{label}</div>
      <div className="num mt-1 font-mono text-lg">{value}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-6">
        <Skeleton className="aspect-[16/8] rounded-3xl" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-[520px] rounded-3xl" />
    </div>
  );
}
