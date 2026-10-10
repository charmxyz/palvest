"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRightIcon, CheckIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { FundingBar } from "@/components/funding-bar";
import { PayPalCheckout } from "@/components/paypal-checkout";
import type { PayPalConfig } from "@/lib/paypal-config";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { estimatedReturn } from "@/lib/finance";
import { ScenarioTable } from "@/components/scenario-table";
import { compactNumber, fundedPercent, integer, money, moneyCents } from "@/lib/format";
import type { ForecastRange, ProposalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESETS = [10, 25, 50];

type CaptureResponse = {
  backing: { id: string; amount: number; captureId: string; backerName: string | null; backerEmail: string | null };
  proposal: { amountFunded: number; palCount: number; status: ProposalStatus } | null;
};

export type BackPanelProps = {
  proposalId: string;
  title: string;
  status: ProposalStatus;
  fundingTarget: number;
  amountFunded: number;
  palCount: number;
  revenueSharePercent: number;
  revenueShareMonths: number;
  forecastViews: ForecastRange;
  forecastRevenue: ForecastRange;
  palPool: ForecastRange;
  paypal: PayPalConfig;
};

export function BackPanel(props: BackPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState("");
  const [funded, setFunded] = useState({ amount: props.amountFunded, pals: props.palCount, status: props.status });
  const [success, setSuccess] = useState<CaptureResponse["backing"] | null>(null);
  const [capturing, setCapturing] = useState(false);
  const handledReturn = useRef(false);

  // Server values win after a refresh.
  const serverKey = `${props.amountFunded}:${props.palCount}:${props.status}`;
  const [prevServerKey, setPrevServerKey] = useState(serverKey);
  if (serverKey !== prevServerKey) {
    setPrevServerKey(serverKey);
    setFunded({ amount: props.amountFunded, pals: props.palCount, status: props.status });
  }

  const remaining = Math.max(0, props.fundingTarget - funded.amount);
  const pct = fundedPercent(funded.amount, props.fundingTarget);
  const ret = estimatedReturn(amount, props.fundingTarget, props.palPool);
  const open = funded.status === "funding" && remaining > 0;
  const amountError = amount < 1 ? "Minimum is $1" : amount > remaining ? `Only ${money(remaining, { cents: true })} left` : null;

  async function capture(orderId: string) {
    setCapturing(true);
    try {
      const res = await api<CaptureResponse>(`/api/paypal/orders/${orderId}/capture`);
      setSuccess(res.backing);
      if (res.proposal) {
        setFunded({ amount: res.proposal.amountFunded, pals: res.proposal.palCount, status: res.proposal.status });
      }
      toast.success(`You backed "${props.title}"`, { description: `${moneyCents(res.backing.amount)} via PayPal` });
      router.refresh();
    } catch (e) {
      toast.error("Payment not completed", { description: (e as Error).message });
      throw e;
    } finally {
      setCapturing(false);
    }
  }

  async function createOrder() {
    const { orderId } = await api<{ orderId: string; approveUrl: string | null }>("/api/paypal/orders", {
      proposalId: props.proposalId,
      amount,
    });
    return { orderId };
  }

  async function redirectCheckout() {
    try {
      const { approveUrl } = await api<{ approveUrl: string | null }>("/api/paypal/orders", {
        proposalId: props.proposalId,
        amount,
      });
      if (!approveUrl) throw new Error("PayPal didn't return an approval link");
      window.location.href = approveUrl;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Returning from the redirect checkout: PayPal appends ?token=<orderId>.
  useEffect(() => {
    const checkout = search.get("checkout");
    const token = search.get("token");
    if (handledReturn.current || !checkout) return;
    handledReturn.current = true;
    router.replace(pathname, { scroll: false });
    // Reacting to an external redirect from PayPal, so starting the capture here is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (checkout === "return" && token) capture(token).catch(() => {});
    if (checkout === "cancel") toast("Checkout cancelled");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,.25)] backdrop-blur">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="num text-4xl font-medium tracking-tight">{money(funded.amount)}</span>
          <span className="num font-mono text-sm text-muted-foreground">{pct}%</span>
        </div>
        <div className="text-sm text-muted-foreground">raised of {money(props.fundingTarget)}</div>
        <FundingBar value={pct} tone={pct >= 100 ? "positive" : "default"} className="h-2" />
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>{integer(funded.pals)} {funded.pals === 1 ? "Pal" : "Pals"}</span>
          {open ? <span>{money(remaining)} to go</span> : <span>Funding closed</span>}
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
        <Row label="Pal terms" value={`${props.revenueSharePercent}% of eligible YouTube revenue`} sub={`${props.revenueShareMonths} months after publication`} />
        <Row label="AI performance estimate" value={`${compactNumber(props.forecastViews.base)} views expected`} sub={`${money(props.forecastRevenue.base, { cents: false })} estimated video revenue`} />
      </div>

      {success ? (
        <div className="animate-rise flex flex-col gap-3 rounded-2xl border border-positive/30 bg-positive/10 p-5">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-full bg-positive text-positive-foreground">
              <CheckIcon className="size-4" />
            </span>
            You&apos;re a Pal on this video
          </div>
          <dl className="grid gap-3">
            {[
              ["Amount", moneyCents(success.amount)],
              ...(success.backerEmail ? [["PayPal account", success.backerEmail]] : []),
              ["Capture ID", success.captureId],
            ].map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="label-mono text-[10px]!">{label}</dt>
                <dd className="font-mono text-xs break-all">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2">
            <Button asChild size="sm" className="rounded-full">
              <Link href="/pals/portfolio">View portfolio</Link>
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setSuccess(null)}>
              Back again
            </Button>
          </div>
        </div>
      ) : open ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={cn(
                  "rounded-full border py-2 font-mono text-sm transition",
                  amount === p && !custom ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
                )}
              >
                ${p}
              </button>
            ))}
            <input
              inputMode="decimal"
              placeholder="Custom"
              value={custom}
              onChange={(e) => {
                const t = e.target.value.replace(/[^0-9.]/g, "");
                setCustom(t);
                if (Number(t) > 0) setAmount(Math.round(Number(t) * 100) / 100);
              }}
              className={cn(
                "min-w-0 rounded-full border bg-transparent px-3 py-2 text-center font-mono text-sm outline-none transition placeholder:text-muted-foreground",
                custom ? "border-foreground" : "border-border focus:border-foreground/30",
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="label-mono">If you back {money(amount, { cents: !Number.isInteger(amount) })}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {((amount / props.fundingTarget) * 100).toFixed(2)}% of the Pal pool
              </span>
            </div>
            <ScenarioTable
              compact
              className="rounded-2xl"
              rows={[
                { label: "Views", values: props.forecastViews, format: compactNumber },
                { label: "You get back", values: ret, format: moneyCents, strong: true },
              ]}
            />
          </div>

          {amountError ? <p className="text-sm text-destructive">{amountError}</p> : null}

          <div className={cn("flex flex-col gap-2", (amountError || capturing) && "pointer-events-none opacity-50")}>
            <PayPalCheckout
              key={amount}
              config={props.paypal}
              label="Back with PayPal"
              createOrder={createOrder}
              onApprove={capture}
              onRedirect={redirectCheckout}
            />
            {capturing ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" /> Confirming payment with PayPal…
              </div>
            ) : null}
          </div>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" />
            Your backing only counts once PayPal confirms the payment.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          {funded.status === "published"
            ? "This video is published and earning. Pals who backed it receive their share as the creator distributes revenue."
            : "This video is fully funded and in production."}
          <Link href="/pals" className="mt-2 flex items-center gap-1 text-foreground">
            Find another video <ArrowUpRightIcon className="size-3.5" />
          </Link>
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground/80">
        Returns are not guaranteed. Pals receive a share of the video&apos;s eligible revenue, not ownership of the video or the creator&apos;s company.
      </p>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-4 py-3">
      <span className="label-mono text-[10px]!">{label}</span>
      <span className="text-sm">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}
