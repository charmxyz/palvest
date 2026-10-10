import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreatorSidebar } from "@/components/creator/creator-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCreatorBySlug, listCreators, listProposals } from "@/lib/data";
import { creatorSlug } from "@/lib/slug";

async function SidebarLoader({ params }: Pick<LayoutProps<"/creator/[handle]">, "params">) {
  const { handle } = await params;
  const creator = await getCreatorBySlug(handle);
  if (!creator) notFound();
  const [creators, projects] = await Promise.all([
    listCreators(),
    listProposals({ creatorId: creator.id }),
  ]);
  return (
    <CreatorSidebar
      creators={creators.map((c) => ({ ...c, slug: creatorSlug(c) }))}
      activeSlug={creatorSlug(creator)}
      projects={projects.map((p) => ({ id: p.id, title: p.title }))}
    />
  );
}

export default function CreatorLayout({ children, params }: LayoutProps<"/creator/[handle]">) {
  return (
    <SidebarProvider>
      <Suspense fallback={<div className="hidden w-(--sidebar-width) md:block" />}>
        <SidebarLoader params={params} />
      </Suspense>
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}
