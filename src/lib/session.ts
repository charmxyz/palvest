import "server-only";
import { cookies } from "next/headers";
import { DEMO_PAL } from "./seed";

// No auth in the MVP: the creator comes from the URL; the Pal is a cookie defaulting to the seeded demo Pal.
export const PAL_COOKIE = "palvest_pal";

const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };

export async function activePalEmail(): Promise<string> {
  return (await cookies()).get(PAL_COOKIE)?.value || DEMO_PAL.email;
}

export async function setActivePal(email: string) {
  (await cookies()).set(PAL_COOKIE, email.toLowerCase(), cookieOpts);
}
