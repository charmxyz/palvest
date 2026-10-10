import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { moneyCents, percent } from "@/lib/format";
import type { Distribution } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RetryPayoutButton, SyncPayoutButton } from "./project-actions";

const STATUS: Record<Distribution["status"], { label: string; dot: string }> = {
  awaiting_funding: { label: "Awaiting payment", dot: "bg-neutral-400" },
  pending: { label: "Pending", dot: "bg-neutral-400" },
  processing: { label: "Processing", dot: "bg-amber-300" },
  success: { label: "Paid", dot: "bg-positive" },
  failed: { label: "Failed", dot: "bg-destructive" },
  ledger_only: { label: "Ledger only", dot: "bg-neutral-400" },
};

export function DistributionStatus({ status }: { status: Distribution["status"] }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase">
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}

export function DistributionLedger({ distribution: d, href }: { distribution: Distribution; href?: string }) {
  const total = d.items.reduce((a, i) => a + i.contributed, 0);
  return (
    <div className="flex flex-col gap-3 rounded-xl border">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <DistributionStatus status={d.status} />
        <span className="num font-mono text-sm">{moneyCents(d.backerPoolAmount)}</span>
        <span className="text-xs text-muted-foreground">
          to {d.items.length} Pals · {new Date(d.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {d.paypalBatchId ? (
            <span className="font-mono text-[11px] text-muted-foreground">PayPal batch {d.paypalBatchId}</span>
          ) : null}
          {d.paypalBatchId && d.status === "processing" ? <SyncPayoutButton distributionId={d.id} /> : null}
          {d.status === "ledger_only" || (d.status === "failed" && d.fundingCaptureId) ? (
            <RetryPayoutButton distributionId={d.id} />
          ) : null}
          {href ? (
            <Link href={href} className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              View disbursement
            </Link>
          ) : null}
        </span>
      </div>
      {d.error ? <p className="px-4 text-sm text-destructive">{d.error}</p> : null}
      <div className="max-h-72 overflow-auto px-2 pb-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="label-mono">Pal</TableHead>
              <TableHead className="label-mono text-right">Backed</TableHead>
              <TableHead className="label-mono text-right">Share</TableHead>
              <TableHead className="label-mono text-right">Payout</TableHead>
              <TableHead className="label-mono text-right">PayPal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <div className="font-medium">{i.backerName ?? "Pal"}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{i.backerEmail}</div>
                </TableCell>
                <TableCell className="num text-right font-mono">{moneyCents(i.contributed)}</TableCell>
                <TableCell className="num text-right font-mono text-muted-foreground">
                  {percent(total ? (i.contributed / total) * 100 : 0, 2)}
                </TableCell>
                <TableCell className="num text-right font-mono">{moneyCents(i.amount)}</TableCell>
                <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                  {i.transactionStatus ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
