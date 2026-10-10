import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/creator/page-header";
import { ProposalBuilder } from "@/components/creator/proposal-builder";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreatorBySlug } from "@/lib/data";
import { creatorPath } from "@/lib/slug";

type Props = PageProps<"/creator/[handle]/new-proposal">;

export default function NewProposalPage({ params, searchParams }: Props) {
  return (
    <>
      <PageHeader eyebrow="Studio" title="New proposal" />
      <div className="p-4 md:p-6">
        <Suspense fallback={<Skeleton className="mx-auto h-80 max-w-2xl rounded-xl" />}>
          <Builder params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

const num = (v: string | string[] | undefined, fallback: number) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

async function Builder({ params, searchParams }: Props) {
  const [{ handle }, sp] = await Promise.all([params, searchParams]);
  const creator = await getCreatorBySlug(handle);
  if (!creator) notFound();
  return (
    <ProposalBuilder
      key={creator.id}
      creator={creator}
      basePath={creatorPath(handle)}
      defaults={{
        budget: num(sp.budget, 4000),
        share: Math.min(50, num(sp.share, 20)),
        months: num(sp.months, 12),
      }}
    />
  );
}
