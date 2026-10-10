"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreatorSim } from "./creator-sim";
import { PalSim } from "./pal-sim";

const TABS = [
  { id: "creator", label: "As a creator", Sim: CreatorSim },
  { id: "pal", label: "As a Pal", Sim: PalSim },
] as const;

export function Simulations() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("creator");
  const active = TABS.find((t) => t.id === tab)!;
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Simulation" className="inline-flex w-fit gap-1 rounded-full border border-border p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === tab}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition",
              t.id === tab ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" key={tab} className="animate-rise">
        <active.Sim />
      </div>
    </div>
  );
}
