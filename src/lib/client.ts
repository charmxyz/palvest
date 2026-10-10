/** POST/PATCH JSON to an API route and throw the server's `{ error }` message on failure. */
export async function api<T = unknown>(
  url: string,
  data?: unknown,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}
