"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shown when a page fails to load (e.g. the database timed out), instead of an endless skeleton. */
export function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-medium tracking-tight">This page didn&apos;t load</h2>
      <p className="text-muted-foreground">
        Something went wrong on our side, usually a slow connection to the database. Give it another try.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
