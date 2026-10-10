"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, Loader2Icon, ScanSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client";
import type { CreatorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  "Finding channel",
  "Reading recent uploads",
  "Filtering out Shorts",
  "Calculating performance range",
  "Building funding forecast",
];

/** Paste a channel → POST /api/youtube/analyze, with staged progress so the analysis reads as deliberate. */
export function ChannelAnalyzer({
  onAnalyzed,
  compact,
  holdOnSuccess,
}: {
  onAnalyzed: (creator: CreatorProfile, slug: string) => void;
  compact?: boolean;
  /** Keep showing progress after success (the caller is navigating away). */
  holdOnSuccess?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const running = step >= 0;
  const showPrefix = !/^(https?:\/\/|www\.|youtube\.com|m\.youtube)/i.test(url);

  useEffect(() => () => clearInterval(timer.current), []);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || running) return;
    setError(null);
    setStep(0);
    // Advance through all but the last step while the request is in flight.
    timer.current = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 2)), 650);
    const started = Date.now();
    try {
      const { creator, slug } = await api<{ creator: CreatorProfile; slug: string }>(
        "/api/youtube/analyze",
        { url },
      );
      clearInterval(timer.current);
      const wait = Math.max(0, 1800 - (Date.now() - started));
      setStep(STEPS.length - 1);
      await new Promise((r) => setTimeout(r, wait + 450));
      setStep(STEPS.length);
      await new Promise((r) => setTimeout(r, 250));
      onAnalyzed(creator, slug);
      if (!holdOnSuccess) {
        setStep(-1);
        setUrl("");
      }
    } catch (err) {
      clearInterval(timer.current);
      setStep(-1);
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={analyze} className={cn("flex gap-2", compact ? "flex-row" : "flex-col sm:flex-row")}>
        <div className="relative flex-1">
          {showPrefix ? (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs text-muted-foreground">
              youtube.com/
            </span>
          ) : null}
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="@yourchannel"
            aria-label="YouTube channel URL"
            disabled={running}
            className={cn(showPrefix && "pl-[6.4rem]", "font-mono", compact ? "h-9" : "h-11 text-base")}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text");
              if (/youtube\.com|youtu\.be/.test(t)) {
                e.preventDefault();
                setUrl(t.trim());
              }
            }}
          />
        </div>
        <Button type="submit" size={compact ? "default" : "lg"} disabled={running || !url.trim()} className={compact ? "" : "h-11"}>
          {running ? <Loader2Icon className="animate-spin" /> : <ScanSearchIcon />}
          Analyze channel
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {running ? (
        <ol className="grid gap-2 rounded-lg border bg-surface p-4 font-mono text-xs">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2.5 transition-colors duration-300",
                  done ? "text-foreground" : current ? "text-foreground" : "text-muted-foreground/40",
                )}
              >
                <span className="flex size-4 items-center justify-center">
                  {done ? (
                    <CheckIcon className="size-3.5 text-positive" />
                  ) : current ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <span className="size-1 rounded-full bg-current" />
                  )}
                </span>
                {label}
                {current ? "…" : ""}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
