import { Badge } from "@/components/ui/badge";
import type { ProposalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<ProposalStatus, string> = {
  draft: "Draft",
  funding: "Raising",
  funded: "Funded",
  published: "Published",
};

const DOT: Record<ProposalStatus, string> = {
  draft: "bg-neutral-500",
  funding: "bg-amber-300",
  funded: "bg-positive",
  published: "bg-sky-300",
};

export function StatusBadge({ status, className }: { status: ProposalStatus; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase", className)}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status])} />
      {LABEL[status]}
    </Badge>
  );
}
