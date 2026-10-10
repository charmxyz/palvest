// Shared-password gate for the creator side. The cookie holds a hash of the
// password, so changing CREATOR_PASSWORD signs everyone out.
export const GATE_COOKIE = "palvest_gate";
export const GATE_MAX_AGE = 60 * 60 * 24 * 365;

export const gatePassword = () => process.env.CREATOR_PASSWORD || null;

export async function gateToken(password: string) {
  const bytes = new TextEncoder().encode(`palvest-gate:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Only allow same-site relative paths as the post-unlock destination. */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/creator";
}
