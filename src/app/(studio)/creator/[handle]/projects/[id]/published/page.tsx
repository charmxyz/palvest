import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon } from "lucide-react";
import { Cover } from "@/components/cover";
import { CopyLink } from "@/components/creator/copy-link";
import { PageHeader } from "@/components/creator/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreatorBySlug, getProposal } from "@/lib/data";
import { compactNumber, money } from "@/lib/format";
import { creatorPath } from "@/lib/slug";

type Props = PageProps<"/creator/[handle]/projects/[id]/published">;

/** Shown right after a creator publishes a proposal. */
export default function PublishedPage({ params }: Props) {
  return (
    <>
      <PageHeader eyebrow="Proposal" title="Published" />
      <div className="p-4 md:p-6">
        <Suspense fallback={<Skeleton className="mx-auto h-[560px] max-w-xl rounded-2xl" />}>
          <Published params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function Published({ params }: Pick<Props, "params">) {
  const { handle, id } = await params;
  const [creator, p] = await Promise.all([getCreatorBySlug(handle), getProposal(id)]);
  if (!creator || !p || p.creatorProfileId !== creator.id) notFound();
  const palPath = `/pals/${p.id}`;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pop flex size-14 items-center justify-center rounded-full bg-positive text-positive-foreground shadow-[0_0_60px_-6px_var(--positive)]">
          <CheckIcon className="size-7" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-medium tracking-tight">Your proposal is live</h2>
          <p className="text-muted-foreground">
            Pals can now back it in the marketplace. Share the link with your audience to start raising.
          </p>
        </div>
      </div>

      <div className="animate-rise w-full overflow-hidden rounded-2xl border bg-card text-left">
        <Cover cover={p.coverImageUrl} title={p.title} className="aspect-[16/7]">
          <h3 className="absolute inset-x-0 bottom-0 p-5 text-xl font-medium tracking-tight text-balance text-white">
            {p.title}
          </h3>
        </Cover>
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            ["Raising", money(p.fundingTarget)],
            ["Revenue share", `${p.revenueSharePercent}%`],
            ["Term", `${p.revenueShareMonths} mo`],
            ["Expected views", compactNumber(p.forecast.views.base)],
          ].map(([label, value]) => (
            <div key={label} className="bg-card p-4">
              <dt className="label-mono text-[10px]!">{label}</dt>
              <dd className="num mt-1 font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex w-full flex-col gap-2">
        <span className="label-mono text-left">Share with your Pals</span>
        <CopyLink path={palPath} />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href={palPath} target="_blank">
            Open Pal page <ArrowUpRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={creatorPath(handle, "projects", p.id)}>
            Go to project <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </div>
  );
}
