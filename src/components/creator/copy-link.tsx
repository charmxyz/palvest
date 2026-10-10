"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const noopSubscribe = () => () => {};

/** Shows the full app URL for `path` and copies it. The origin is only known in the browser. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
  const url = `${origin}${path}`;
  return (
    <div className="flex w-full items-center gap-2 rounded-xl border bg-surface p-1.5 pl-4">
      <span className="min-w-0 flex-1 truncate text-left font-mono text-xs text-muted-foreground">{url}</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
