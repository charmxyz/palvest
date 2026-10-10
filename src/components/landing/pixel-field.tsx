"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// A dot-matrix of square particles that morphs through the three beats of a
// Palvest project: the pitch (a video), the backing (creator + Pal), the
// payoff (rising bars). Particles spring to their targets and scatter away
// from the pointer. Pure canvas 2D, no dependencies.

type Point = { x: number; y: number; a: number; accent: boolean };
type Particle = {
  x: number; y: number; vx: number; vy: number;
  tx: number; ty: number; a: number; ta: number;
  accent: boolean; phase: number;
};

export const FIGURES = ["Pitch", "Back", "Earn"] as const;

const HOLD_MS = 3800;
const SPRING = 0.055;
const DAMPING = 0.84;
const REPEL_RADIUS = 80;
const REPEL_FORCE = 5;

/** Deterministic PRNG so the first frame matches across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rasterize a drawing onto a grid and return the cells it covers. */
function sample(w: number, h: number, step: number, draw: (c: CanvasRenderingContext2D) => void) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const c = off.getContext("2d", { willReadFrequently: true })!;
  c.fillStyle = c.strokeStyle = "#fff";
  draw(c);
  const data = c.getImageData(0, 0, w, h).data;
  const out: { x: number; y: number }[] = [];
  const ox = (w % step) / 2 + step / 2;
  const oy = (h % step) / 2 + step / 2;
  for (let y = oy; y < h; y += step) {
    for (let x = ox; x < w; x += step) {
      if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 127) out.push({ x, y });
    }
  }
  return out;
}

function buildFigures(w: number, h: number, step: number): Point[][] {
  const s = Math.min(w, h) * 0.6;
  const cx = w / 2;
  const cy = h / 2;
  const layer = (draw: (c: CanvasRenderingContext2D) => void, a: number, accent = false) =>
    sample(w, h, step, draw).map((p) => ({ ...p, a, accent }));

  // 01 Pitch: a video frame with a play glyph knocked out of it.
  const vw = s * 1.15;
  const vh = s * 0.74;
  const pitch = [
    ...layer((c) => {
      c.beginPath();
      c.roundRect(cx - vw / 2, cy - vh / 2, vw, vh, s * 0.12);
      c.fill();
      c.globalCompositeOperation = "destination-out";
      c.beginPath();
      c.moveTo(cx - s * 0.12, cy - s * 0.17);
      c.lineTo(cx + s * 0.18, cy);
      c.lineTo(cx - s * 0.12, cy + s * 0.17);
      c.closePath();
      c.fill();
    }, 0.9),
  ];

  // 02 Back: the Palvest mark. Open ring (the creator) overlapping a solid disc (the Pal).
  const r = s * 0.36;
  const back = [
    ...layer((c) => {
      c.lineWidth = s * 0.075;
      c.beginPath();
      c.arc(cx - r * 0.48, cy, r, 0, Math.PI * 2);
      c.stroke();
    }, 0.55),
    ...layer((c) => {
      c.beginPath();
      c.arc(cx + r * 0.48, cy, r, 0, Math.PI * 2);
      c.fill();
    }, 0.95),
  ];
  const backDedup = new Map(back.map((p) => [`${p.x},${p.y}`, p]));

  // 03 Earn: bars climbing left to right; the last one is the payout.
  const bars = [0.28, 0.42, 0.55, 0.74, 1];
  const bw = (s * 1.1) / (bars.length * 1.45);
  const gap = bw * 0.45;
  const total = bars.length * bw + (bars.length - 1) * gap;
  const base = cy + s * 0.46;
  const earn = bars.flatMap((v, i) =>
    layer(
      (c) => c.fillRect(cx - total / 2 + i * (bw + gap), base - v * s * 0.92, bw, v * s * 0.92),
      i === bars.length - 1 ? 1 : 0.35 + i * 0.12,
      i === bars.length - 1,
    ),
  );

  return [pitch, [...backDedup.values()], earn];
}

export function PixelField({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [figure, setFigure] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(wrap);
    const fg = styles.getPropertyValue("--pf-fg").trim() || "#fff";
    const accentColor = styles.getPropertyValue("--pf-accent").trim() || "#4ade80";

    let w = 0;
    let h = 0;
    let dot = 2;
    let figures: Point[][] = [];
    let particles: Particle[] = [];
    let current = 0;
    let lastSwitch = 0;
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999 };
    const rand = mulberry32(7);

    const assign = (index: number, kick: number) => {
      const pts = figures[index];
      // Shuffle so particles cross the field on every morph instead of sliding over.
      const order = particles.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      order.forEach((pi, k) => {
        const p = particles[pi];
        const t = pts[k];
        if (t) {
          p.tx = t.x; p.ty = t.y; p.ta = t.a; p.accent = t.accent;
        } else {
          // Leftovers drift as faint dust around the figure.
          p.tx = rand() * w; p.ty = rand() * h; p.ta = 0.05 + rand() * 0.07; p.accent = false;
        }
        p.vx += (rand() - 0.5) * kick;
        p.vy += (rand() - 0.5) * kick;
      });
    };

    const setup = () => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const step = w < 420 ? 6 : 7;
      dot = step < 7 ? 2 : 2.5;
      figures = buildFigures(w, h, step);
      const count = Math.round(Math.max(...figures.map((f) => f.length)) * 1.1);
      const prev = particles;
      particles = Array.from({ length: count }, (_, i) => {
        const old = prev[i];
        return {
          x: old?.x ?? rand() * w,
          y: old?.y ?? rand() * h,
          vx: 0, vy: 0, tx: 0, ty: 0,
          a: old?.a ?? 0, ta: 0, accent: false,
          phase: rand() * Math.PI * 2,
        };
      });
      assign(current, 0);
      if (reduced) {
        for (const p of particles) { p.x = p.tx; p.y = p.ty; p.a = p.ta; }
        draw(0);
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const twinkle = reduced ? 1 : 0.82 + 0.18 * Math.sin(time * 0.0016 + p.phase);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.a * twinkle));
        ctx.fillStyle = p.accent ? accentColor : fg;
        ctx.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (!lastSwitch) lastSwitch = time;
      if (time - lastSwitch > HOLD_MS) {
        lastSwitch = time;
        current = (current + 1) % figures.length;
        assign(current, 6);
        setFigure(current);
      }
      for (const p of particles) {
        p.vx += (p.tx - p.x) * SPRING;
        p.vy += (p.ty - p.y) * SPRING;
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / REPEL_RADIUS) * REPEL_FORCE;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        p.a += (p.ta - p.a) * 0.06;
      }
      draw(time);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };

    setup();
    const ro = new ResizeObserver(() => setup());
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(wrap);
    if (!reduced) {
      raf = requestAnimationFrame(tick);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <figure className={cn("relative select-none", className)}>
      <div
        ref={wrapRef}
        className="relative size-full [--pf-accent:var(--positive)] [--pf-fg:var(--foreground)]"
      >
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full touch-none" />
      </div>
      {/* Viewfinder corners */}
      {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
        <span key={c} aria-hidden className={cn("pointer-events-none absolute size-3 border-foreground/30", c)} />
      ))}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        <span className="label-mono flex items-center gap-3">
          {FIGURES.map((name, i) => (
            <span key={name} className={cn("transition-colors duration-500", i === figure ? "text-foreground" : "text-muted-foreground/50")}>
              {name}
            </span>
          ))}
        </span>
        <span className="label-mono num">0{figure + 1} / 03</span>
      </figcaption>
    </figure>
  );
}
