import { cookies } from "next/headers";
import { z } from "zod";
import { body, HttpError, route } from "@/lib/api";
import { GATE_COOKIE, GATE_MAX_AGE, gatePassword, gateToken } from "@/lib/gate";

export const POST = route(async (req: Request) => {
  const { password } = await body(req, z.object({ password: z.string().max(200) }));
  const expected = gatePassword();
  if (!expected) return Response.json({ ok: true });
  if (password !== expected) throw new HttpError("Wrong password.", 401);
  (await cookies()).set(GATE_COOKIE, await gateToken(expected), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GATE_MAX_AGE,
  });
  return Response.json({ ok: true });
});
