import type { Metadata } from "next";
import { preload } from "react-dom";
import { buildMetadata } from "@/lib/seo";
import { buildWebPageSchema } from "@/lib/schema";
import { getActiveSections } from "@/lib/queries/homepage";
import { SectionRenderer } from "@/components/homepage/section-renderer";
import type { HeroContent } from "@/components/homepage/hero-section";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "HAGE CLUB — The Pinnacle of Refined Comfort",
  description:
    "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
  url: "/",
});

export default async function HomePage() {
  const schema = buildWebPageSchema({
    name: "HAGE CLUB — The Pinnacle of Refined Comfort",
    description: "Premium automotive lifestyle fashion brand.",
  });

  const sections = await getActiveSections();

  // Preload LCP hero image from the server so the browser fetches it before
  // JS hydration — without this, the client-component hero causes ~3-4s LCP delay.
  const heroSection = sections.find((s) => s.type === "hero");
  const heroContent = heroSection?.content as HeroContent | null;
  const lcpImageUrl = heroContent?.bgImages?.[0]?.url ?? heroContent?.bgImage ?? null;
  if (lcpImageUrl) {
    preload(lcpImageUrl, { as: "image", fetchPriority: "high" });
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />

      {sections.length > 0 ? (
        sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))
      ) : (
        <>
          {/* Fallback hero when no sections configured */}
          <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_50%,#ffffff_1px,transparent_1px)] bg-[length:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary/95" />
            <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
              <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-6">Premium Automotive Lifestyle</p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white/70">HAGE CLUB</h1>
              <p className="mt-5 text-base sm:text-lg text-white/50 max-w-md mx-auto leading-relaxed">The Pinnacle of Refined Comfort</p>
            </div>
          </section>
        </>
      )}
    </>);
}
