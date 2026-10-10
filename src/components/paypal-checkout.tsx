"use client";

import { toast } from "sonner";
import {
  INSTANCE_LOADING_STATE,
  PayPalOneTimePaymentButton,
  PayPalProvider,
  usePayPal,
} from "@paypal/react-paypal-js/sdk-v6";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { PayPalConfig } from "@/lib/paypal-config";

/**
 * PayPal checkout via the v6 JS SDK, with a redirect to paypal.com as a fallback
 * when the SDK can't load or the popup is blocked. Both paths use the same server
 * endpoints: `createOrder` for the order, `onRedirect` for the approval-link flow.
 */
export function PayPalCheckout({
  config,
  createOrder,
  onApprove,
  onRedirect,
  label,
}: {
  config: PayPalConfig;
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (orderId: string) => Promise<void>;
  onRedirect: () => void;
  label: string;
}) {
  const fallback = (
    <Button size="lg" className="h-12 rounded-full bg-[#ffc439] text-black hover:bg-[#f2b92f]" onClick={onRedirect}>
      {label} <ExternalLinkIcon />
    </Button>
  );
  if (!config.clientId) return fallback;
  return (
    <PayPalProvider
      clientId={config.clientId}
      environment={config.environment}
      components={["paypal-payments"]}
      pageType="checkout"
    >
      <SdkButton createOrder={createOrder} onApprove={onApprove} onRedirect={onRedirect} fallback={fallback} />
    </PayPalProvider>
  );
}

function SdkButton({
  createOrder,
  onApprove,
  onRedirect,
  fallback,
}: {
  createOrder: () => Promise<{ orderId: string }>;
  onApprove: (orderId: string) => Promise<void>;
  onRedirect: () => void;
  fallback: React.ReactNode;
}) {
  const { loadingStatus } = usePayPal();
  if (loadingStatus === INSTANCE_LOADING_STATE.PENDING) {
    return <div className="h-12 animate-pulse rounded-full bg-muted" />;
  }
  if (loadingStatus === INSTANCE_LOADING_STATE.REJECTED) return fallback;
  return (
    <>
      <PayPalOneTimePaymentButton
        type="pay"
        presentationMode="auto"
        createOrder={createOrder}
        onApprove={async ({ orderId }) => {
          await onApprove(orderId);
        }}
        onCancel={() => toast("Checkout cancelled")}
        onError={(err) => {
          console.error(err);
          toast.error("PayPal checkout error");
        }}
      />
      <button
        type="button"
        onClick={onRedirect}
        className="self-center font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Popup blocked? Continue on paypal.com
      </button>
    </>
  );
}
