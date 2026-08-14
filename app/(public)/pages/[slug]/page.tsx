import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCmsPage } from "@/lib/cms";
import { CmsContent } from "@/components/cms/cms-content";
import { getI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCmsPage(slug);
  return {
    title: page?.seoTitle ?? page?.title ?? "Halaman Tidak Ditemukan",
    description: page?.seoDescription ?? page?.excerpt ?? undefined,
  };
}

export default async function CmsPageRoute({ params }: Props) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const page = await getCmsPage(slug);
  if (!page || !page.isPublished) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      {page.excerpt && <p className="text-sm text-muted mt-2">{page.excerpt}</p>}
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
