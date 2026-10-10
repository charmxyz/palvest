import { z } from "zod";
import { body, route } from "@/lib/api";
import { setActivePal } from "@/lib/session";

export const POST = route(async (req: Request) => {
  const { email } = await body(req, z.object({ email: z.email() }));
  await setActivePal(email);
  return Response.json({ ok: true });
});
