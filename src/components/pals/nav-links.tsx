"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/pals", label: "Explore" },
  { href: "/pals/portfolio", label: "Portfolio" },
];

const isActive = (href: string, pathname: string) =>
  href === "/pals" ? pathname === "/pals" || /^\/pals\/[0-9a-f-]{36}/.test(pathname) : pathname.startsWith(href);

/** Pass `pathname={null}` for the static (prerendered) fallback with no active state. */
export function NavLinks(props: { pathname?: string | null }) {
  return "pathname" in props ? <Links pathname={props.pathname ?? null} /> : <LiveLinks />;
}

function LiveLinks() {
  return <Links pathname={usePathname()} />;
}

function Links({ pathname }: { pathname: string | null }) {
  return (
    <div className="flex items-center gap-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm transition",
            pathname && isActive(l.href, pathname)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
