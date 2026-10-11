import "server-only";

const BASE = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

export class PayPalError extends Error {
  constructor(
    message: string,
    public status = 502,
    public details?: unknown,
  ) {
    super(message);
  }
}

let token: { value: string; expiresAt: number } | null = null;

/** Give up on a PayPal call rather than leave the request (and the creator) hanging. */
async function paypalFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new PayPalError("PayPal took too long to respond. Please try again.", 504);
    }
    throw err;
  }
}

export async function getAccessToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt - 60_000) return token.value;
  const id = process.env.PAYPAL_CLIENT_ID ?? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    throw new PayPalError("PayPal Sandbox credentials are not configured on the server.", 500);
  }
  const res = await paypalFetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = await res.json();
  if (!res.ok) throw new PayPalError(body.error_description ?? "PayPal auth failed", 502, body);
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

async function paypal<T>(
  path: string,
  init: { method?: string; body?: unknown; requestId?: string } = {},
): Promise<T> {
  const res = await paypalFetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const issue = body?.details?.[0];
    const message = issue
      ? `${issue.issue}: ${issue.description}`
      : (body?.message ?? `PayPal request failed (${res.status})`);
    throw new PayPalError(message, res.status >= 500 ? 502 : res.status, body);
  }
  return body as T;
}

type Link = { href: string; rel: string; method?: string };

export type PayPalOrder = {
  id: string;
  status: string;
  links: Link[];
};

/** One-item PayPal order. `referenceId` comes back on capture so the server can verify what was paid for. */
export async function createOrder(input: {
  referenceId: string;
  description: string;
  itemName: string;
  amount: number;
  returnUrl: string;
  cancelUrl: string;
}) {
  const value = input.amount.toFixed(2);
  const order = await paypal<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.referenceId,
          description: input.description.slice(0, 127),
          soft_descriptor: "PALVEST",
          amount: {
            currency_code: "USD",
            value,
            breakdown: { item_total: { currency_code: "USD", value } },
          },
          items: [
            {
              name: input.itemName.slice(0, 127),
              quantity: "1",
              category: "DIGITAL_GOODS",
              unit_amount: { currency_code: "USD", value },
            },
          ],
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Palvest",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    },
  });
  const approveUrl =
    order.links.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href ?? null;
  return { id: order.id, status: order.status, approveUrl };
}

export type CaptureResult = {
  id: string;
  status: string;
  payer?: {
    payer_id?: string;
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  purchase_units: {
    reference_id?: string;
    payments?: {
      captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[];
    };
  }[];
};

export async function captureOrder(orderId: string) {
  return paypal<CaptureResult>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    requestId: `capture-${orderId}`,
  });
}

/** Capture an order, tolerating a retry of one that's already been captured. */
export async function captureOrReadOrder(orderId: string): Promise<CaptureResult> {
  try {
    return await captureOrder(orderId);
  } catch (err) {
    if (err instanceof PayPalError && /ORDER_ALREADY_CAPTURED/.test(err.message)) return getOrder(orderId);
    throw err;
  }
}

/** The single completed capture on an order, or null. */
export function completedCapture(result: CaptureResult) {
  const unit = result.purchase_units[0];
  const capture = unit?.payments?.captures?.[0];
  if (result.status !== "COMPLETED" || capture?.status !== "COMPLETED") return null;
  return { id: capture.id, amount: Number(capture.amount.value), referenceId: unit.reference_id ?? null };
}

export async function getOrder(orderId: string) {
  return paypal<CaptureResult>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

export type PayoutBatch = {
  batch_header: {
    payout_batch_id: string;
    batch_status: string;
    sender_batch_header?: { sender_batch_id: string };
  };
  items?: {
    payout_item_id: string;
    transaction_status: string;
    payout_item: { sender_item_id?: string; receiver: string };
    errors?: { name?: string; message?: string };
  }[];
};

export async function createPayout(input: {
  senderBatchId: string;
  subject: string;
  message: string;
  items: { id: string; email: string; amount: number; note: string }[];
}) {
  return paypal<PayoutBatch>("/v1/payments/payouts", {
    method: "POST",
    requestId: input.senderBatchId,
    body: {
      sender_batch_header: {
        sender_batch_id: input.senderBatchId,
        email_subject: input.subject,
        email_message: input.message,
      },
      items: input.items.map((i) => ({
        recipient_type: "EMAIL",
        receiver: i.email,
        note: i.note,
        sender_item_id: i.id,
        amount: { value: i.amount.toFixed(2), currency: "USD" },
      })),
    },
  });
}

export async function getPayout(batchId: string) {
  return paypal<PayoutBatch>(`/v1/payments/payouts/${encodeURIComponent(batchId)}`);
}

export const paypalConfigured = () =>
  Boolean(
    (process.env.PAYPAL_CLIENT_ID ?? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) &&
      process.env.PAYPAL_CLIENT_SECRET,
  );
