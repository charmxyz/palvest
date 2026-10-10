import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Logo } from "@/components/logo";

const STEPS = [
  ["Creators pitch", "Share the bigger project you've been wanting to make, what it costs, and what backers get back."],
  ["Fans back it", "The people who love your work fund it before it's made."],
  ["Everyone shares the upside", "When the project earns, its backers earn with you."],
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link href="/pals" className="text-sm text-muted-foreground hover:text-foreground">
          Explore creators
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 text-center">
        <span className="label-mono">For creators and the fans behind them</span>
        <h1 className="max-w-3xl text-5xl font-medium tracking-[-0.03em] text-balance sm:text-7xl">
          Invest in your favorite creators.
        </h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground">
          Back the next project before it&apos;s made. When it succeeds, you share in what it earns.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/creator" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90">
            I&apos;m a creator <ArrowRightIcon className="size-4" />
          </Link>
          <Link href="/pals" className="rounded-full border border-white/15 px-5 py-2.5 text-sm transition hover:border-white/40">
            Back a creator
          </Link>
        </div>
        <ol className="mt-12 grid w-full max-w-4xl gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] text-left sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-2 bg-black p-6">
              <span className="label-mono">0{i + 1}</span>
              <span className="font-medium">{title}</span>
              <span className="text-sm text-muted-foreground">{body}</span>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
