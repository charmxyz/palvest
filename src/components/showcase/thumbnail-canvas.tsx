"use client";

import { useEffect, useRef } from "react";

// 1920×1080 thumbnail art: the Palvest mark as a dot matrix, with a
// murmuration of loose dots streaming out of it across the frame.

const W = 1920;
const H = 1080;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

/** Cubic Bézier point. */
function bez(t: number, p: number[][]) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
}

export function ThumbnailCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = 2;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const rand = mulberry32(7);

    const dot = (x: number, y: number, s: number, a: number, accent = false) => {
      ctx.fillStyle = accent ? `oklch(0.8 0.15 160 / ${a})` : `rgba(255,255,255,${a})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    };

    // Murmuration: dense, twisting ribbons of dots sweeping across the frame.
    const ribbons = [
      { p: [[-200, 980], [500, 620], [900, 1150], [1500, 560]], n: 4200, spread: 52, twist: 2.2 },
      { p: [[700, -120], [1100, 380], [1900, 80], [2150, 520]], n: 3200, spread: 42, twist: 3 },
      { p: [[1150, 1250], [1500, 860], [1750, 1150], [2100, 760]], n: 2200, spread: 36, twist: 2.6 },
      { p: [[-150, 120], [300, 260], [450, -60], [900, 40]], n: 1200, spread: 30, twist: 1.6 },
    ];
    for (const r of ribbons) {
      for (let i = 0; i < r.n; i++) {
        const t = rand();
        const [x, y] = bez(t, r.p);
        // Width breathes along the ribbon, like a flock thickening and thinning.
        const width = r.spread * (0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * r.twist)));
        const ox = gauss(rand) * width;
        const oy = gauss(rand) * width * 0.8;
        const edge = Math.min(1, Math.hypot(ox, oy) / (width * 2.2));
        dot(x + ox, y + oy, 2 + rand() * 1.6, (0.18 + rand() * 0.42) * (1 - edge * 0.75), rand() < 0.03);
      }
    }
    // A thin haze of stragglers everywhere.
    for (let i = 0; i < 900; i++) dot(rand() * W, rand() * H, 1.8, 0.04 + rand() * 0.08);

    // The mark, sampled from the logo onto a dot grid.
    const img = new Image();
    img.src = "/logo-mark.png";
    img.onload = () => {
      const bw = 820;
      const bh = (bw * img.height) / img.width;
      const bx = 1385 - bw / 2;
      const by = H / 2 - bh / 2;
      const off = document.createElement("canvas");
      off.width = Math.round(bw);
      off.height = Math.round(bh);
      const oc = off.getContext("2d", { willReadFrequently: true })!;
      oc.drawImage(img, 0, 0, off.width, off.height);
      const data = oc.getImageData(0, 0, off.width, off.height).data;

      // Clear a soft halo behind the mark so it reads cleanly over the flock.
      const halo = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, bh * 0.2, bx + bw / 2, by + bh / 2, bw * 0.75);
      halo.addColorStop(0, "rgba(10,10,10,0.85)");
      halo.addColorStop(1, "rgba(10,10,10,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      const step = 13;
      for (let y = step / 2; y < off.height; y += step) {
        for (let x = step / 2; x < off.width; x += step) {
          const i = (Math.floor(y) * off.width + Math.floor(x)) * 4;
          const alpha = data[i + 3] / 255;
          if (alpha < 0.5) continue;
          const lum = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
          const px = bx + x;
          const py = by + y;
          // Dots on the right edge peel off toward the flock.
          const drift = Math.max(0, (x / off.width - 0.82) / 0.18);
          if (drift > 0 && rand() < drift * 0.55) {
            dot(px + rand() * 160 * drift, py + gauss(rand) * 40 * drift, 6, 0.35 * (1 - drift * 0.5));
            continue;
          }
          const accent = rand() < 0.035;
          dot(px, py, 7.5, accent ? 0.95 : 0.35 + 0.6 * lum, accent);
        }
      }
      canvas.dataset.ready = "1";
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-[1080px] w-[1920px]" />;
}
