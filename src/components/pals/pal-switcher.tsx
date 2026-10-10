"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/client";
import { money } from "@/lib/format";

export type KnownPal = { email: string; name: string | null; total: number; projects: number };

/** No auth: pick which Pal you're viewing as. Real checkouts switch to the PayPal payer automatically. */
export function PalSwitcher({ current, pals }: { current: { email: string; name: string | null }; pals: KnownPal[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const label = current.name ?? current.email.split("@")[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="flex items-center gap-2 rounded-full bg-muted py-1 pr-3.5 pl-1 text-sm transition outline-none hover:bg-muted"
      >
        <CreatorAvatar name={label} className="size-7" />
        <span className="max-w-32 truncate">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="label-mono">Viewing as Pal</DropdownMenuLabel>
        {pals.map((p) => (
          <DropdownMenuItem
            key={p.email}
            onSelect={() =>
              start(async () => {
                await api("/api/pals/active", { email: p.email });
                router.refresh();
              })
            }
            className="gap-2"
          >
            <CreatorAvatar name={p.name ?? p.email} className="size-6" />
            <div className="min-w-0 flex-1">
              <div className="truncate">{p.name ?? p.email}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {p.projects} videos · {money(p.total)}
              </div>
            </div>
            {p.email === current.email ? <CheckIcon className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
