import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { UnlockForm } from "@/components/unlock-form";

export default function UnlockPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_55%_at_50%_40%,black,transparent)]"
      />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo suffix="Studio" />
        <Link href="/pals" className="text-sm text-muted-foreground hover:text-foreground">
          Explore creators
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 pb-32 text-center">
        <div className="flex flex-col gap-2">
          <span className="label-mono">Creator studio</span>
          <h1 className="text-3xl font-medium tracking-tight">Enter access password</h1>
          <p className="text-sm text-muted-foreground">You&apos;ll only need to do this once on this device.</p>
        </div>
        <Suspense fallback={null}>
          <UnlockForm />
        </Suspense>
      </main>
    </div>
  );
}
