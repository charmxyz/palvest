import { cn } from "@/lib/utils";

// Abstract covers for proposals without an image: low-chroma glows on black.
const GRADIENTS = [
  "radial-gradient(120% 90% at 15% 10%, oklch(0.55 0.09 60 / .85), transparent 55%), radial-gradient(90% 80% at 90% 100%, oklch(0.45 0.06 30 / .75), transparent 60%)",
  "radial-gradient(110% 90% at 85% 0%, oklch(0.6 0.08 250 / .75), transparent 55%), radial-gradient(80% 70% at 0% 100%, oklch(0.45 0.05 200 / .65), transparent 60%)",
  "radial-gradient(120% 90% at 20% 0%, oklch(0.62 0.04 260 / .65), transparent 55%), radial-gradient(100% 90% at 100% 100%, oklch(0.5 0.07 15 / .65), transparent 60%)",
  "radial-gradient(120% 100% at 50% 0%, oklch(0.75 0.03 220 / .65), transparent 55%), radial-gradient(80% 60% at 0% 100%, oklch(0.45 0.05 230 / .6), transparent 60%)",
  "radial-gradient(110% 90% at 0% 0%, oklch(0.58 0.07 20 / .75), transparent 55%), radial-gradient(90% 80% at 100% 90%, oklch(0.5 0.05 80 / .6), transparent 60%)",
  "radial-gradient(110% 90% at 80% 10%, oklch(0.62 0.1 70 / .75), transparent 55%), radial-gradient(90% 90% at 10% 100%, oklch(0.5 0.08 140 / .6), transparent 60%)",
];

export const COVER_PRESETS = GRADIENTS.map((_, i) => `gradient:${i}`);

export function Cover({
  cover,
  title,
  className,
  children,
}: {
  cover: string | null | undefined;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const isImage = cover && /^https?:\/\//.test(cover);
  const idx = cover?.startsWith("gradient:") ? Number(cover.split(":")[1]) % GRADIENTS.length : 0;
  return (
    <div
      className={cn("relative isolate overflow-hidden bg-[oklch(0.14_0_0)]", className)}
      style={isImage ? undefined : { backgroundImage: GRADIENTS[idx] }}
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={title ?? ""} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="bg-noise absolute inset-0 opacity-[0.18] mix-blend-overlay" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {children}
    </div>
  );
}
