"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftIcon, CheckIcon, Loader2Icon, TriangleAlertIcon, UsersIcon, WalletIcon } from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { moneyCents } from "@/lib/format";
import type { Distribution } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RetryPayoutButton } from "./project-actions";

const ROW_STAGGER_MS = 45;
const STATUS_TEXT: Record<Distribution["status"], string> = {
  awaiting_funding: "Awaiting payment",
  pending: "Preparing",
  processing: "Processing",
  success: "Complete",
  failed: "Failed",
  ledger_only: "Ledger only",
};
const MAX_STAGGER_MS = 2600;

function useCountUp(target: number, durationMs: number, run: boolean) {
  const [value, setValue] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, run]);
  return value;
}

export function DisbursementView({
  distribution: d,
  creatorName,
  creatorThumb,
  projectTitle,
  projectHref,
  returnToken,
}: {
  distribution: Distribution;
  creatorName: string;
  creatorThumb: string | null;
  projectTitle: string;
  projectHref: string;
  /** Present when PayPal redirected back here after approval. */
  returnToken: string | null;
}) {
  const router = useRouter();
  const awaiting = d.status === "awaiting_funding";
  const [capturing, setCapturing] = useState(false);
  const started = useRef(false);

  // Redirect flow: PayPal sends the creator back here, so confirm the payment now.
  useEffect(() => {
    if (!awaiting || !returnToken || started.current) return;
    started.current = true;
    // Confirming a payment the creator just approved on paypal.com.
    setCapturing(true);
    api(`/api/paypal/distributions/${d.id}/capture`)
      .then(() => router.replace(window.location.pathname))
      .catch((e) => toast.error("Payment not completed", { description: (e as Error).message }))
      .finally(() => setCapturing(false));
  }, [awaiting, returnToken, d.id, router]);

  // Poll PayPal for batch + item statuses while the payout is processing.
  // Each check waits for the previous one, so slow responses never pile up.
  useEffect(() => {
    if (d.status !== "processing" || !d.paypalBatchId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async (tries: number) => {
      try {
        const r = await api<{ status: string }>(`/api/paypal/payouts/${d.id}`);
        if (cancelled) return;
        router.refresh();
        if (r.status !== "processing") return;
      } catch {}
      if (!cancelled && tries < 12) timer = setTimeout(() => check(tries + 1), 5000);
    };
    timer = setTimeout(() => check(1), 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [d.status, d.paypalBatchId, d.id, router]);

  const sent = !awaiting;
  const total = useCountUp(d.backerPoolAmount, 2200, sent);
  const [shown, setShown] = useState(sent ? 0 : d.items.length);
  useEffect(() => {
    if (!sent) return;
    const step = Math.min(ROW_STAGGER_MS, MAX_STAGGER_MS / Math.max(1, d.items.length));
    const timer = setInterval(() => setShown((n) => (n >= d.items.length ? n : n + 1)), step);
    return () => clearInterval(timer);
  }, [sent, d.items.length]);

  if (awaiting) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        {capturing ? (
          <>
            <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            <h2 className="text-xl font-medium">Confirming your PayPal payment…</h2>
            <p className="text-sm text-muted-foreground">Then we&apos;ll pay every Pal through PayPal Payouts.</p>
          </>
        ) : (
          <>
            <WalletIcon className="size-8 text-muted-foreground" />
            <h2 className="text-xl font-medium">Waiting for your PayPal payment</h2>
            <p className="text-sm text-muted-foreground">
              This distribution hasn&apos;t been funded yet. Head back to the project to pay the Pal pool.
            </p>
            <Button asChild variant="outline">
              <Link href={projectHref}>
                <ArrowLeftIcon /> Back to project
              </Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  const failed = d.status === "failed";
  const total$ = d.items.reduce((a, i) => a + i.contributed, 0);
  const statusLabel =
    d.status === "success"
      ? "Payout batch complete"
      : d.status === "processing"
        ? "PayPal is processing the payout batch"
        : d.status === "ledger_only"
          ? "Recorded on the ledger (PayPal Payouts not configured)"
          : failed
            ? "PayPal Payouts failed. Your payment is safe and can be re-sent"
            : "Preparing payouts";

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card">
        <div aria-hidden className="bg-grid absolute inset-0 [mask-image:radial-gradient(60%_80%_at_50%_0%,black,transparent)]" />
        <div className="relative flex flex-col items-center gap-5 px-6 pt-12 pb-8 text-center">
          <div
            className={cn(
              "animate-pop flex size-14 items-center justify-center rounded-full",
              failed ? "bg-destructive/15 text-destructive" : "bg-positive text-positive-foreground shadow-[0_0_60px_-6px_var(--positive)]",
            )}
          >
            {failed ? <TriangleAlertIcon className="size-7" /> : <CheckIcon className="size-7" />}
          </div>
          <div className="flex flex-col gap-1">
            <span className="label-mono">{failed ? "Payout needs attention" : "Revenue distributed"}</span>
            <div className="num text-5xl font-medium tracking-tight sm:text-6xl">{moneyCents(total)}</div>
            <p className="text-muted-foreground">
              to {d.items.length} Pals of <span className="text-foreground">{projectTitle}</span>
            </p>
          </div>

          <FlowStrip
            creatorName={creatorName}
            creatorThumb={creatorThumb}
            pool={d.backerPoolAmount}
            pals={d.items.length}
            animate={!failed}
          />

          <dl className="grid w-full max-w-2xl gap-px overflow-hidden rounded-xl border bg-border text-left sm:grid-cols-3">
            {[
              ["Your PayPal payment", d.fundingCaptureId ?? "n/a"],
              ["Payout batch", d.paypalBatchId ?? (d.status === "ledger_only" ? "Ledger only" : "Pending")],
              ["Status", STATUS_TEXT[d.status]],
            ].map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-1 bg-card p-4">
                <dt className="label-mono text-[10px]!">{label}</dt>
                <dd className="font-mono text-xs break-all">{value}</dd>
              </div>
            ))}
          </dl>
          <p className={cn("flex items-center gap-2 text-sm", failed ? "text-destructive" : "text-muted-foreground")}>
            {d.status === "processing" ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {statusLabel}
          </p>
          {d.error ? <p className="max-w-xl text-xs text-destructive">{d.error}</p> : null}
          <div className="flex gap-2">
            {failed && d.fundingCaptureId ? <RetryPayoutButton distributionId={d.id} /> : null}
            <Button asChild variant="outline" size="sm">
              <Link href={projectHref}>
                <ArrowLeftIcon /> Back to project
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-medium tracking-tight">Pals paid</h2>
          <span className="num font-mono text-sm text-muted-foreground">
            {Math.min(shown, d.items.length)} / {d.items.length}
          </span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {d.items.map((item, i) => {
            const visible = i < shown;
            const paypalStatus = item.transactionStatus;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3 transition-all duration-500",
                  visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                <CreatorAvatar name={item.backerName ?? item.backerEmail} className="size-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.backerName ?? "Pal"}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">{item.backerEmail}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="num font-mono text-sm">{moneyCents(item.amount)}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-mono text-[10px] tracking-[0.06em] uppercase",
                      paypalStatus === "SUCCESS" || (!paypalStatus && visible && !failed)
                        ? "text-positive"
                        : "text-muted-foreground",
                    )}
                  >
                    {visible && !failed ? <CheckIcon className="size-3" /> : null}
                    {paypalStatus ??
                      (failed ? "Not sent" : !visible ? "Queued" : d.status === "ledger_only" ? "Recorded" : "Sent")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Each Pal&apos;s payout is their contribution ÷ {moneyCents(total$)} raised × {moneyCents(d.backerPoolAmount)}, split to
          the cent. Recipients without a PayPal account show as UNCLAIMED until they sign up.
        </p>
      </section>
    </div>
  );
}

function FlowStrip({
  creatorName,
  creatorThumb,
  pool,
  pals,
  animate,
}: {
  creatorName: string;
  creatorThumb: string | null;
  pool: number;
  pals: number;
  animate: boolean;
}) {
  return (
    <div className="flex w-full max-w-2xl items-center gap-2 py-2">
      <Node icon={<CreatorAvatar name={creatorName} src={creatorThumb} className="size-9" />} label={creatorName} sub="PayPal checkout" />
      <Connector animate={animate} />
      <Node
        icon={
          <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
            <WalletIcon className="size-4" />
          </span>
        }
        label="Pal pool"
        sub={moneyCents(pool)}
      />
      <Connector animate={animate} delay={0.8} />
      <Node
        icon={
          <span className="flex size-9 items-center justify-center rounded-full bg-positive text-positive-foreground">
            <UsersIcon className="size-4" />
          </span>
        }
        label={`${pals} Pals`}
        sub="PayPal Payouts"
      />
    </div>
  );
}

function Node({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-1.5 sm:w-28">
      {icon}
      <span className="max-w-full truncate text-xs font-medium">{label}</span>
      <span className="label-mono text-[9px]!">{sub}</span>
    </div>
  );
}

function Connector({ animate, delay = 0 }: { animate: boolean; delay?: number }) {
  return (
    <div className="relative mb-8 h-px flex-1 bg-border">
      {animate
        ? [0, 0.55, 1.1].map((offset) => (
            <span
              key={offset}
              className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-positive shadow-[0_0_10px_var(--positive)]"
              style={{ animation: `flow 1.6s linear ${delay + offset}s infinite` }}
            />
          ))
        : null}
    </div>
  );
}
