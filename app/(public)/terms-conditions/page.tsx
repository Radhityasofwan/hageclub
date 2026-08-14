import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCmsPage } from "@/lib/cms";
import { CmsContent } from "@/components/cms/cms-content";
import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  const { t, locale } = await getI18n();
  const page = await getCmsPage("terms-conditions");
  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      {page.updatedAt && (
        <p className="text-xs text-muted mt-1">
          {t("policy.lastUpdated")} {formatDate(page.updatedAt, undefined, locale)}
        </p>
      )}

      <div className="mt-8">
        <CmsContent content={page.content} />
      </div>
    </div>
  );
}
