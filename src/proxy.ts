import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gatePassword, gateToken } from "@/lib/gate";

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn("[gate] CREATOR_PASSWORD is not set, so /creator is open to everyone. Add it to .env.local and restart.");
}

/** Password-gate the creator studio and its APIs. Pals pages and backing checkout stay public. */
export async function proxy(request: NextRequest) {
  const password = gatePassword();
  if (!password) {
    warnOnce();
    return NextResponse.next();
  }

  const cookie = request.cookies.get(GATE_COOKIE)?.value;
  if (cookie && cookie === (await gateToken(password))) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Enter the access password first." }, { status: 401 });
  }
  const url = new URL("/unlock", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/creator/:path*",
    "/api/youtube/:path*",
    "/api/proposals/:path*",
    "/api/creators/:path*",
    "/api/projects/:path*",
    "/api/demo/:path*",
    "/api/paypal/distributions/:path*",
    "/api/paypal/payouts/:path*",
  ],
};
