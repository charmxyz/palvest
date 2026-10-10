import { cn } from "@/lib/utils";

// Tiny dot-matrix icons that echo the hero's particle figures.
// "X" is a bright pixel, "o" a dim one, "g" the accent.
const GLYPHS = {
  pitch: [
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXX.XXXXXX",
    "XXXX..XXXXX",
    "XXXX...XXXX",
    "XXXX..XXXXX",
    "XXXX.XXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
  ],
  back: [
    "..ooo..XXX..",
    ".o...oXXXXX.",
    "o....XXXXXXX",
    "o....XXXXXXX",
    "o....XXXXXXX",
    ".o...oXXXXX.",
    "..ooo..XXX..",
  ],
  earn: [
    "..........g",
    "..........g",
    "........X.g",
    "........X.g",
    "......X.X.g",
    "....X.X.X.g",
    "..X.X.X.X.g",
    "X.X.X.X.X.g",
    "X.X.X.X.X.g",
  ],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function PixelGlyph({ name, className }: { name: GlyphName; className?: string }) {
  const rows = GLYPHS[name];
  const w = Math.max(...rows.map((r) => r.length));
  return (
    <svg viewBox={`0 0 ${w * 4} ${rows.length * 4}`} aria-hidden className={cn("h-9 w-auto", className)}>
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x * 4}
              y={y * 4}
              width={2.5}
              height={2.5}
              className={c === "g" ? "fill-positive" : c === "o" ? "fill-foreground/40" : "fill-foreground"}
            />
          ),
        ),
      )}
    </svg>
  );
}
