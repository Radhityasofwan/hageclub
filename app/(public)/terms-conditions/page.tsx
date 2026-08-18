import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCmsPage } from "@/lib/cms";
import { CmsContent } from "@/components/cms/cms-content";
import { LocaleDate } from "@/components/cms/locale-date";

export const revalidate = 3600;

const FALLBACK_TITLE = "Syarat & Ketentuan — HAGE CLUB";
const FALLBACK_DESC = "Syarat dan ketentuan penggunaan website dan layanan HAGE CLUB.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("terms-conditions");
  return {
    title: page?.seoTitle ?? FALLBACK_TITLE,
    description: page?.seoDescription ?? FALLBACK_DESC,
  };
}

export default async function TermsPage() {
  const page = await getCmsPage("terms-conditions");
  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      {page.updatedAt && (
        <LocaleDate date={page.updatedAt} labelKey="policy.lastUpdated" className="text-xs text-muted mt-1 block" />
      )}

      <div className="mt-8">
        <CmsContent content={page.content} />
      </div>
    </div>
  );
}
