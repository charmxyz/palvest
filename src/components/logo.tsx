import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)}>
      <circle cx="9" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="6.5" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}

export function Logo({ href = "/", className, suffix }: { href?: string; className?: string; suffix?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-medium tracking-tight", className)}>
      <LogoMark />
      <span>Palvest</span>
      {suffix ? <span className="label-mono ml-1 text-[10px]!">{suffix}</span> : null}
    </Link>
  );
}
