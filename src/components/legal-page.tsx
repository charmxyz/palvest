import Link from "next/link";
import { Logo } from "@/components/logo";

export const CONTACT_EMAIL = "firdaussaffan@gmail.com";

export type LegalSection = { heading: string; body: React.ReactNode };

/** Shared layout for /privacy and /terms. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4">
          <span className="label-mono">Last updated {updated}</span>
          <h1 className="text-4xl font-medium tracking-[-0.03em] sm:text-5xl">{title}</h1>
          <div className="text-pretty text-muted-foreground">{intro}</div>
        </div>
        <ol className="flex flex-col gap-10">
          {sections.map((s, i) => (
            <li key={s.heading} className="flex flex-col gap-3 border-t border-border pt-6">
              <h2 className="flex items-baseline gap-3 text-lg font-medium">
                <span className="label-mono num">{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </h2>
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-pretty text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {s.body}
              </div>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} Palvest</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
        </div>
      </footer>
    </div>
  );
}
