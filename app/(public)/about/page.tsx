import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCmsPage } from "@/lib/cms";
import { CmsContent } from "@/components/cms/cms-content";
import { TranslatedText } from "@/components/ui/translated-text";

export const revalidate = 3600;

const FALLBACK_TITLE = "Tentang — HAGE CLUB";
const FALLBACK_DESC =
  "Puncak Kenyamanan Terbaik. Temukan kisah di balik HAGE CLUB — brand lifestyle otomotif premium yang lahir dari budaya garasi.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("about");
  return {
    title: page?.seoTitle ?? FALLBACK_TITLE,
    description: page?.seoDescription ?? FALLBACK_DESC,
  };
}

export default async function AboutPage() {
  const page = await getCmsPage("about");
  if (!page) notFound();

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        {page.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.image}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-white/60 mt-4 max-w-xl text-sm md:text-base">{page.excerpt}</p>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <CmsContent content={page.content} />

        <Link
          href="/shop"
          className="inline-block mt-10 h-10 px-6 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition-colors leading-10"
        >
          <TranslatedText k="about.shopCollection" />
        </Link>
      </div>
    </div>
  );
}
