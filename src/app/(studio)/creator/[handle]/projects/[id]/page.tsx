import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRightIcon } from "lucide-react";
import { TrajectoryChart } from "@/components/charts/trajectory-chart";
import { Cover } from "@/components/cover";
import { DistributionLedger } from "@/components/creator/distribution-ledger";
import { PageHeader } from "@/components/creator/page-header";
import {
  DistributeDialog,
  PublishDialog,
  RefreshViewsButton,
  SimulateButton,
} from "@/components/creator/project-actions";
import { FundingBar } from "@/components/funding-bar";
import { Stat } from "@/components/stat";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBackings, getCreatorBySlug, getDistributions, getProposal, getPublishedVideo, settlement } from "@/lib/data";
import { compactNumber, fundedPercent, integer, money, moneyCents, relativeDate } from "@/lib/format";
import { paypalConfig } from "@/lib/paypal-config";
import { creatorPath } from "@/lib/slug";

export default function ProjectPage({ params }: PageProps<"/creator/[handle]/projects/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader eyebrow="Project" title="Loading…" />
          <div className="flex flex-col gap-4 p-4 md:p-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </>
      }
    >
      <Project params={params} />
    </Suspense>
  );
}

async function Project({ params }: Pick<PageProps<"/creator/[handle]/projects/[id]">, "params">) {
  const { handle, id } = await params;
  const [proposal, creator] = await Promise.all([getProposal(id), getCreatorBySlug(handle)]);
  if (!proposal || !creator || proposal.creatorProfileId !== creator.id) notFound();
  const [video, distributions, backings] = await Promise.all([
    getPublishedVideo(id),
    getDistributions(id),
    getBackings(id),
  ]);
  const s = settlement(proposal, video, distributions);
  const pct = fundedPercent(proposal.amountFunded, proposal.fundingTarget);
  const f = proposal.forecast;
  const isPublished = proposal.status === "published";

  return (
    <>
      <PageHeader
        eyebrow="Project"
        title={proposal.title}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/pals/${proposal.id}`} target="_blank">
              View as Pal <ArrowUpRightIcon />
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 p-4 md:p-6">

        <Card className="overflow-hidden p-0">
          <div className="grid md:grid-cols-[280px_minmax(0,1fr)]">
            <Cover cover={proposal.coverImageUrl} title={proposal.title} className="min-h-40" />
            <div className="flex flex-col gap-5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={proposal.status} />
                <span className="font-mono text-xs text-muted-foreground">Created {relativeDate(proposal.createdAt)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-medium tracking-tight">{proposal.title}</h2>
                {proposal.description ? (
                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{proposal.description}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <div className="num flex items-baseline justify-between font-mono text-sm">
                  <span>
                    <span className="text-lg">{money(proposal.amountFunded)}</span>{" "}
                    <span className="text-muted-foreground">of {money(proposal.fundingTarget)}</span>
                  </span>
                  <span>{pct}%</span>
                </div>
                <FundingBar value={pct} tone={pct >= 100 ? "positive" : "default"} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Pals" value={integer(proposal.palCount)} />
                <Stat label="Revenue share" value={`${proposal.revenueSharePercent}%`} />
                <Stat label="Term" value={`${proposal.revenueShareMonths} mo`} />
                <Stat label="Expected views" value={compactNumber(f.views.base)} />
              </div>
            </div>
          </div>
        </Card>

        {!isPublished ? (
          <Card>
            <CardHeader>
              <CardTitle>{proposal.status === "funded" ? "Fully funded — time to make it" : "Raising"}</CardTitle>
              <CardDescription>
                {proposal.status === "funded"
                  ? "When the video is live on YouTube, mark it published to start tracking revenue for your Pals."
                  : `${money(proposal.fundingTarget - proposal.amountFunded)} left to raise.`}
              </CardDescription>
              <CardAction>
                <PublishDialog projectId={proposal.id} disabled={proposal.amountFunded <= 0} />
              </CardAction>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Video performance
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {video?.source === "youtube" ? "Live YouTube views" : video?.source === "simulated" ? "Simulated" : "Awaiting data"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Eligible revenue estimated at {moneyCents(video?.assumedRpm ?? f.rpm)} RPM over the {proposal.revenueShareMonths}-month term.
                </CardDescription>
                <CardAction className="flex gap-2">
                  {video?.youtubeVideoId ? <RefreshViewsButton projectId={proposal.id} /> : null}
                  <SimulateButton projectId={proposal.id} />
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <Stat label="Views" value={integer(video?.currentViews ?? 0)} />
                  <Stat label="Assumed RPM" value={moneyCents(video?.assumedRpm ?? f.rpm)} />
                  <Stat label="Eligible revenue" value={moneyCents(s.eligibleRevenue)} />
                  <Stat label="Pal share" value={`${proposal.revenueSharePercent}%`} />
                  <Stat label="Pal pool owed" value={moneyCents(s.totalOwed)} />
                  <Stat label="Creator share" value={moneyCents(s.creatorShare)} />
                </div>
                {video && video.trajectory.length > 1 ? (
                  <TrajectoryChart
                    data={video.trajectory}
                    rpm={video.assumedRpm}
                    forecast={{ base: f.views.base, high: f.views.high }}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No performance data yet. Refresh live views or simulate 90 days.
                  </div>
                )}
                {video?.youtubeVideoId ? (
                  <a
                    href={`https://youtube.com/watch?v=${video.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 self-start font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    youtube.com/watch?v={video.youtubeVideoId} <ArrowUpRightIcon className="size-3" />
                  </a>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pay your Pals</CardTitle>
                <CardDescription>
                  YouTube pays you directly. You fund what&apos;s owed with PayPal, and Palvest pays every Pal through
                  PayPal Payouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 rounded-xl border bg-surface p-5 md:flex-row md:items-center">
                  <div className="grid flex-1 grid-cols-3 gap-4">
                    <Stat label="Owed to date" value={moneyCents(s.totalOwed)} />
                    <Stat label="Distributed" value={moneyCents(s.distributed)} />
                    <Stat label="Outstanding" value={moneyCents(s.outstanding)} valueClassName={s.outstanding > 0 ? "text-positive" : ""} />
                  </div>
                  <DistributeDialog
                    projectId={proposal.id}
                    basePath={creatorPath(handle)}
                    amount={s.outstanding}
                    palCount={proposal.palCount}
                    eligibleRevenue={s.eligibleRevenue}
                    sharePercent={proposal.revenueSharePercent}
                    paypal={paypalConfig()}
                  />
                </div>
                {distributions
                  .filter((d) => d.status !== "awaiting_funding")
                  .map((d) => (
                    <DistributionLedger
                      key={d.id}
                      distribution={d}
                      href={`${creatorPath(handle)}/projects/${proposal.id}/success/${d.id}`}
                    />
                  ))}
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pals</CardTitle>
            <CardDescription>Every backing is confirmed server-side from the PayPal capture.</CardDescription>
          </CardHeader>
          <CardContent>
            {backings.length ? (
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="label-mono">Pal</TableHead>
                      <TableHead className="label-mono text-right">Amount</TableHead>
                      <TableHead className="label-mono">PayPal capture</TableHead>
                      <TableHead className="label-mono text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.backerName ?? "Pal"}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{b.backerEmail}</div>
                        </TableCell>
                        <TableCell className="num text-right font-mono">{moneyCents(b.amount)}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {b.paypalCaptureId ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {relativeDate(b.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Pals yet. Share the Pal page to start raising.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
