import { ThumbnailCanvas } from "@/components/showcase/thumbnail-canvas";
import { LogoMark } from "@/components/logo";

// 1920×1080 cover/thumbnail: one sentence left, the dot-matrix mark right.
export const metadata = { title: "Thumbnail", robots: { index: false } };

export default function Thumbnail() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-background">
      <div id="showcase-frame" className="relative isolate h-[1080px] w-[1920px] shrink-0 overflow-hidden bg-background">
        <ThumbnailCanvas />
        <div className="absolute top-1/2 left-[140px] flex max-w-[760px] -translate-y-1/2 flex-col gap-10">
          <span className="flex items-center gap-3 text-[28px] font-medium tracking-tight">
            <LogoMark className="h-[22px]" />
            Palvest
          </span>
          <h1 className="text-[112px] leading-[0.98] font-medium tracking-[-0.045em] text-balance">Invest in your favorite creators.</h1>
        </div>
      </div>
    </div>
  );
}
