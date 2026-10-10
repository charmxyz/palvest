import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Cover } from "@/components/cover";
import { FundingBar } from "@/components/funding-bar";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fundedPercent, integer, money } from "@/lib/format";
import type { ProposalWithCreator } from "@/lib/types";

export function ProjectsTable({ projects, basePath }: { projects: ProposalWithCreator[]; basePath: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="label-mono">Project</TableHead>
          <TableHead className="label-mono">Status</TableHead>
          <TableHead className="label-mono w-56">Funding</TableHead>
          <TableHead className="label-mono text-right">Pals</TableHead>
          <TableHead className="label-mono text-right">Terms</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => {
          const pct = fundedPercent(p.amountFunded, p.fundingTarget);
          return (
            <TableRow key={p.id} className="group">
              <TableCell>
                <Link href={`${basePath}/projects/${p.id}`} className="flex items-center gap-3">
                  <Cover cover={p.coverImageUrl} title={p.title} className="h-9 w-14 shrink-0 rounded-md" />
                  <span className="max-w-72 truncate font-medium">{p.title}</span>
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <div className="num flex justify-between font-mono text-xs">
                    <span>
                      {money(p.amountFunded)} <span className="text-muted-foreground">/ {money(p.fundingTarget)}</span>
                    </span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <FundingBar value={pct} tone={pct >= 100 ? "positive" : "default"} />
                </div>
              </TableCell>
              <TableCell className="num text-right font-mono">{integer(p.palCount)}</TableCell>
              <TableCell className="num text-right font-mono text-xs text-muted-foreground">
                {p.revenueSharePercent}% · {p.revenueShareMonths}mo
              </TableCell>
              <TableCell className="w-8">
                <Link href={`${basePath}/projects/${p.id}`} aria-label={`Open ${p.title}`}>
                  <ArrowRightIcon className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
