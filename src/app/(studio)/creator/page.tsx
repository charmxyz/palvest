import Link from "next/link";
import { OnboardingForm } from "@/components/creator/onboarding-form";
import { Logo } from "@/components/logo";

/** Creator onboarding: paste a channel, we analyze it and send you to /creator/[handle]. */
export default function CreatorOnboarding() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_55%_at_50%_40%,black,transparent)]"
      />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo suffix="Studio" />
        <Link href="/pals" className="text-sm text-muted-foreground hover:text-foreground">
          Browse videos
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 pb-32">
        <div className="flex flex-col gap-4 text-center">
          <span className="label-mono">Creator studio</span>
          <h1 className="text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl">
            Grow beyond your normal production budget.
          </h1>
          <p className="text-balance text-muted-foreground">
            Paste your YouTube channel. We&apos;ll read your public performance and show what a
            Pal-funded video could look like.
          </p>
        </div>
        <OnboardingForm />
      </main>
    </div>
  );
}
