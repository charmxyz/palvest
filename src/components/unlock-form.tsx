"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, Loader2Icon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client";
import { safeNext } from "@/lib/gate";

export function UnlockForm() {
  const next = safeNext(useSearchParams().get("next"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/api/unlock", { password });
      // Full load so the proxy sees the new cookie.
      window.location.assign(next);
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      <div className="relative">
        <LockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access password"
          aria-label="Access password"
          className="h-11 pl-10 font-mono"
        />
      </div>
      {error ? <p className="text-left text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="h-11" disabled={pending || !password}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Continue <ArrowRightIcon />
      </Button>
    </form>
  );
}
