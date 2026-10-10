import { Suspense } from "react";
import { PalSwitcher } from "@/components/pals/pal-switcher";
import { PalsNav } from "@/components/pals/pals-nav";
import { listKnownPals } from "@/lib/data";
import { activePalEmail } from "@/lib/session";

async function Identity() {
  const email = await activePalEmail();
  const pals = await listKnownPals();
  const me = pals.find((p) => p.email === email);
  const list = me ? pals : [{ email, name: null, total: 0, projects: 0 }, ...pals];
  return <PalSwitcher current={{ email, name: me?.name ?? null }} pals={list} />;
}

export default function PalsLayout({ children }: LayoutProps<"/pals">) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0_0_0/0.05),transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] [mask-image:radial-gradient(70%_80%_at_50%_0%,black,transparent)]"
      />
      <PalsNav
        identity={
          <Suspense fallback={<div className="h-9 w-28 rounded-full bg-muted" />}>
            <Identity />
          </Suspense>
        }
      />
      <main className="relative mx-auto w-full max-w-6xl px-4 pt-28 pb-24">{children}</main>
    </div>
  );
}
