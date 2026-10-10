import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { CreatorStudio } from "@/components/creator/creator-studio";
import { PageHeader } from "@/components/creator/page-header";
import { ProjectsTable } from "@/components/creator/projects-table";
import { Stat } from "@/components/stat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { creatorSummary, getCreatorBySlug, listProposals } from "@/lib/data";
import { money } from "@/lib/format";
import { creatorPath } from "@/lib/slug";

export default function CreatorPage({ params }: PageProps<"/creator/[handle]">) {
  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title="Overview"
        actions={
          <Suspense fallback={null}>
            <NewProposalButton params={params} />
          </Suspense>
        }
      />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Suspense fallback={<OverviewSkeleton />}>
          <Overview params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function NewProposalButton({ params }: Pick<PageProps<"/creator/[handle]">, "params">) {
  const { handle } = await params;
  return (
    <Button asChild size="sm">
      <Link href={creatorPath(handle, "new-proposal")}>
        <PlusIcon /> New proposal
      </Link>
    </Button>
  );
}

async function Overview({ params }: Pick<PageProps<"/creator/[handle]">, "params">) {
  const { handle } = await params;
  const creator = await getCreatorBySlug(handle);
  if (!creator) notFound();
  const [summary, projects] = await Promise.all([
    creatorSummary(creator.id),
    listProposals({ creatorId: creator.id }),
  ]);

  return (
    <>
      {projects.length ? (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            ["Raising", summary.active],
            ["Funded", summary.funded],
            ["Published", summary.published],
            ["Total raised", money(summary.raised)],
            ["Owed to Pals", money(summary.outstanding, { cents: true })],
          ].map(([label, value]) => (
            <Card key={label} size="sm">
              <CardContent>
                <Stat label={label} value={value} />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {projects.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Your proposals</CardTitle>
            <CardDescription>Track funding, publish finished videos and pay your Pals.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectsTable projects={projects} basePath={creatorPath(handle)} />
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        {projects.length ? <h2 className="label-mono">Channel analysis</h2> : null}
        <CreatorStudio creator={creator} basePath={creatorPath(handle)} />
      </section>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
