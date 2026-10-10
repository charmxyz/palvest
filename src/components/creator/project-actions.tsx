"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FlaskConicalIcon, Loader2Icon, RefreshCwIcon, SendIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PayPalCheckout } from "@/components/paypal-checkout";
import { api } from "@/lib/client";
import type { PayPalConfig } from "@/lib/paypal-config";
import { moneyCents } from "@/lib/format";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<string | void>) =>
    start(async () => {
      try {
        const msg = await fn();
        if (msg) toast.success(msg);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  return { pending, run };
}

export function PublishDialog({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const { pending, run } = useAction();

  const publish = (youtubeUrl?: string) =>
    run(async () => {
      await api(`/api/projects/${projectId}/publish`, { youtubeUrl });
      setOpen(false);
      return "Marked as published";
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <UploadIcon /> Mark video as published
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark video as published</DialogTitle>
          <DialogDescription>
            Link the YouTube video to track its public views. Revenue is estimated from views at your RPM.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          className="font-mono"
        />
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => publish()} disabled={pending}>
            Publish without link
          </Button>
          <Button onClick={() => publish(url)} disabled={pending || !url.trim()}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Link video & publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SimulateButton({ projectId }: { projectId: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        run(async () => {
          await api(`/api/projects/${projectId}/simulate-revenue`);
          return "Simulated 90 days of performance";
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <FlaskConicalIcon />}
      Simulate 90 days
    </Button>
  );
}

export function RefreshViewsButton({ projectId }: { projectId: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        run(async () => {
          const r = await api<{ views: number }>(`/api/projects/${projectId}/refresh-views`);
          return `Updated: ${r.views.toLocaleString("en-US")} views`;
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
      Refresh live views
    </Button>
  );
}

type StartResult = {
  distributionId: string;
  pool: number;
  pals: number;
  orderId: string | null;
  approveUrl: string | null;
};

/**
 * The creator funds the Pal pool with PayPal checkout; once the capture is confirmed
 * server-side, Palvest sends PayPal Payouts and shows the disbursement page.
 */
export function DistributeDialog({
  projectId,
  basePath,
  amount,
  palCount,
  eligibleRevenue,
  sharePercent,
  paypal,
}: {
  projectId: string;
  basePath: string;
  amount: number;
  palCount: number;
  eligibleRevenue: number;
  sharePercent: number;
  paypal: PayPalConfig;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const distributionId = useRef<string | null>(null);
  const successPath = (id: string) => `${basePath}/projects/${projectId}/success/${id}`;

  const start = () => api<StartResult>(`/api/projects/${projectId}/distributions`, { basePath });

  async function createOrder() {
    const r = await start();
    distributionId.current = r.distributionId;
    if (!r.orderId) {
      // PayPal isn't configured: the ledger was recorded without a charge.
      router.push(successPath(r.distributionId));
      throw new Error("PayPal not configured");
    }
    return { orderId: r.orderId };
  }

  async function onApprove() {
    const id = distributionId.current;
    if (!id) return;
    setConfirming(true);
    try {
      await api(`/api/paypal/distributions/${id}/capture`);
      router.push(successPath(id));
    } catch (e) {
      toast.error("Payment not completed", { description: (e as Error).message });
      setConfirming(false);
    }
  }

  async function onRedirect() {
    try {
      const r = await start();
      if (r.approveUrl) window.location.href = r.approveUrl;
      else router.push(successPath(r.distributionId));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !confirming && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={amount < 0.01}>
          <SendIcon /> Distribute {moneyCents(amount)} to Pals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund your Pals&apos; revenue share</DialogTitle>
          <DialogDescription>
            YouTube paid you directly. Pay the Pal pool with PayPal and Palvest splits it across every Pal
            through PayPal Payouts.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-2 rounded-xl border bg-surface p-4 font-mono text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Eligible revenue</dt>
            <dd>{moneyCents(eligibleRevenue)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pal share</dt>
            <dd>{sharePercent}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pals receiving</dt>
            <dd>{palCount}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between border-t pt-3">
            <dt>You pay now</dt>
            <dd className="text-xl">{moneyCents(amount)}</dd>
          </div>
        </dl>
        {confirming ? (
          <div className="flex h-12 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" /> Confirming payment and paying Pals…
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <PayPalCheckout
              config={paypal}
              label="Pay with PayPal"
              createOrder={createOrder}
              onApprove={onApprove}
              onRedirect={onRedirect}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SyncPayoutButton({ distributionId }: { distributionId: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        run(async () => {
          const r = await api<{ batchStatus?: string }>(`/api/paypal/payouts/${distributionId}`);
          return r.batchStatus ? `PayPal batch: ${r.batchStatus}` : undefined;
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
      Refresh status
    </Button>
  );
}

export function RetryPayoutButton({ distributionId }: { distributionId: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        run(async () => {
          await api(`/api/paypal/payouts`, { distributionId });
          return "Sent via PayPal Payouts";
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
      Send via PayPal
    </Button>
  );
}
