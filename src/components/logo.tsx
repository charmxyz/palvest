import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Palvest mark (public/logo-mark.png, cropped from Logo.png), used as a mask so it takes the text color in both themes. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block aspect-[660/432] h-3.5 shrink-0 bg-current [mask:url(/logo-mark.png)_center/contain_no-repeat]",
        className,
      )}
    />
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
