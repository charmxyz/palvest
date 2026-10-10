export type PayPalConfig = { clientId: string | null; environment: "sandbox" | "production" };

/** PayPal client config, read on the server and passed to client checkout components. */
export function paypalConfig(): PayPalConfig {
  return {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null,
    environment: process.env.PAYPAL_BASE_URL?.includes("sandbox") === false ? "production" : "sandbox",
  };
}
