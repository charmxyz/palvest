import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DisbursementView } from "@/components/creator/disbursement-view";
import { PageHeader } from "@/components/creator/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreatorBySlug, getDistributions, getProposal } from "@/lib/data";
import { creatorPath } from "@/lib/slug";

type Props = PageProps<"/creator/[handle]/projects/[id]/success/[distributionId]">;

export default function DisbursementPage(props: Props) {
  return (
    <>
      <PageHeader eyebrow="Payout" title="Disbursement" />
      <div className="p-4 md:p-6">
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <Disbursement {...props} />
        </Suspense>
      </div>
    </>
  );
}

async function Disbursement({ params, searchParams }: Props) {
  const [{ handle, id, distributionId }, sp] = await Promise.all([params, searchParams]);
  const [creator, proposal, distributions] = await Promise.all([
    getCreatorBySlug(handle),
    getProposal(id),
    getDistributions(id),
  ]);
  const distribution = distributions.find((d) => d.id === distributionId);
  if (!creator || !proposal || proposal.creatorProfileId !== creator.id || !distribution) notFound();
  const token = Array.isArray(sp.token) ? sp.token[0] : sp.token;

  return (
    <DisbursementView
      distribution={distribution}
      creatorName={creator.channelTitle}
      creatorThumb={creator.thumbnailUrl}
      projectTitle={proposal.title}
      projectHref={creatorPath(handle, "projects", proposal.id)}
      returnToken={token ?? null}
    />
  );
}
