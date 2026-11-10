import { notFound } from "next/navigation";
import { ShowcaseFrame } from "@/components/showcase/frame";
import { SLIDES } from "@/components/showcase/slides";

// Marketing frames: /showcase/1 … /showcase/6, each exactly 1920×1080 for screenshots.
export const metadata = { title: "Showcase", robots: { index: false } };

export function generateStaticParams() {
  return SLIDES.map((_, i) => ({ slide: String(i + 1) }));
}

export default async function ShowcaseSlide({ params }: { params: Promise<{ slide: string }> }) {
  const { slide } = await params;
  const i = Number(slide) - 1;
  const s = SLIDES[i];
  if (!s) notFound();
  return (
    <div className="flex min-h-screen items-start justify-center bg-background">
      <ShowcaseFrame index={i + 1} total={SLIDES.length} eyebrow={s.eyebrow} title={s.title}>
        <s.Mock />
      </ShowcaseFrame>
    </div>
  );
}
