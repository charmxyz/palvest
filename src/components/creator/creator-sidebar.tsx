"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  LayoutDashboardIcon,
  PlusIcon,
  RotateCcwIcon,
  ScanSearchIcon,
} from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { api } from "@/lib/client";
import { compactNumber } from "@/lib/format";
import { creatorPath } from "@/lib/slug";

export type SidebarCreator = {
  id: string;
  channelTitle: string;
  youtubeHandle: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  isSeed: boolean;
  slug: string;
};

export function CreatorSidebar({
  creators,
  activeSlug,
  projects,
}: {
  creators: SidebarCreator[];
  activeSlug: string;
  projects: { id: string; title: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = creators.find((c) => c.slug === activeSlug) ?? null;
  const base = creatorPath(activeSlug);

  const reset = () =>
    start(async () => {
      if (!confirm("Reset all data? This deletes analyzed channels, proposals and backings.")) return;
      try {
        await api("/api/demo/reset");
        toast.success("Data reset");
        router.push("/creator");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-3">
        <Logo href="/" suffix="Studio" className="px-2 pt-1 group-data-[collapsible=icon]:hidden" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="border bg-card/40" disabled={pending}>
              {active ? (
                <>
                  <CreatorAvatar name={active.channelTitle} src={active.thumbnailUrl} className="size-7" />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{active.channelTitle}</span>
                    <span className="truncate font-mono text-[10px] text-muted-foreground">
                      {compactNumber(active.subscriberCount)} subscribers
                    </span>
                  </div>
                </>
              ) : (
                <span className="flex-1 text-left text-sm text-muted-foreground">No channel yet</span>
              )}
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="label-mono">Viewing as creator</DropdownMenuLabel>
            {creators.map((c) => (
              <DropdownMenuItem key={c.id} onSelect={() => router.push(creatorPath(c.slug))} className="gap-2">
                <CreatorAvatar name={c.channelTitle} src={c.thumbnailUrl} className="size-6" />
                <span className="flex-1 truncate">{c.channelTitle}</span>
                {c.slug === activeSlug ? <CheckIcon className="size-4" /> : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/creator">
                <ScanSearchIcon /> Analyze another channel
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="label-mono">Studio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === base} tooltip="Overview">
                  <Link href={base}>
                    <LayoutDashboardIcon /> Overview
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === `${base}/new-proposal`} tooltip="New proposal">
                  <Link href={`${base}/new-proposal`}>
                    <PlusIcon /> New proposal
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {projects.length ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="label-mono">Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((p) => (
                  <SidebarMenuItem key={p.id}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === `${base}/projects/${p.id}`}
                      className="text-muted-foreground data-[active=true]:text-foreground"
                    >
                      <Link href={`${base}/projects/${p.id}`}>
                        <span className="truncate">{p.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Pals marketplace">
              <Link href="/pals">
                <ArrowUpRightIcon /> Open Pals marketplace
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={reset} disabled={pending} tooltip="Reset data" className="text-muted-foreground">
              <RotateCcwIcon /> Reset data
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
