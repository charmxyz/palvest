import "server-only";
import { z } from "zod";
import { AIError } from "./ai";
import { PayPalError } from "./paypal";
import { YouTubeError } from "./youtube";

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Wrap a route handler so known errors become JSON `{ error }` with the right status. */
export function route<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issue = err.issues[0];
        return Response.json(
          { error: `${issue.path.join(".") || "input"}: ${issue.message}` },
          { status: 400 },
        );
      }
      if (
        err instanceof HttpError ||
        err instanceof YouTubeError ||
        err instanceof PayPalError ||
        err instanceof AIError
      ) {
        if (err instanceof PayPalError) console.error("[paypal]", err.message, err.details);
        return Response.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const json = await req.json().catch(() => {
    throw new HttpError("Request body must be JSON");
  });
  return schema.parse(json);
}

export function appUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
}
