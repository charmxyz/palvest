import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { NavLinks } from "./nav-links";

export function PalsNav({ identity }: { identity?: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="pointer-events-auto flex w-full max-w-6xl items-center gap-2 rounded-full border border-border bg-background/75 py-1.5 pr-1.5 pl-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,.12)] backdrop-blur-xl">
        <Logo href="/pals" className="mr-4" />
        <Suspense fallback={<NavLinks pathname={null} />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/creator"
            className="hidden rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:block"
          >
            For creators
          </Link>
          {identity}
        </div>
      </nav>
    </div>
  );
}
