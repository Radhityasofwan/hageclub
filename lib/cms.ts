import { cache } from "react";
import { db } from "@/lib/db";
import { getSettingValue } from "@/lib/settings";
import {
  DEFAULT_CMS_PAGES,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_CONTACT_INFO,
  type ContactInfo,
} from "@/lib/cms-content";

// =============================================================================
// MARKDOWN RENDERER (sama dengan blog detail)
// =============================================================================

export function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-bold mt-6 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-bold text-primary mt-8 mb-3'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-accent px-1 rounded text-xs'>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded my-4" loading="lazy" />')
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-border pl-4 italic text-muted my-4'>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li class='ml-4'>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1</li>")
    .replace(/^---$/gm, "<hr class='my-8 border-border' />")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

  html = html.replace(/((?:<li.*?>.*?<\/li><br \/>?)+)/g, (match) =>
    `<ul class='list-disc pl-5 my-3 space-y-1'>${match.replace(/<br \/>/g, "")}</ul>`
  );

  html = `<p>${html}</p>`;
  html = html.replace(/<p><h([1-3])/g, "<h$1").replace(/<\/h([1-3])><\/p>/g, "</h$1>");
  html = html.replace(/<p><blockquote/g, "<blockquote").replace(/<\/blockquote><\/p>/g, "</blockquote>");
  html = html.replace(/<p><img/g, "<img").replace(/\/><\/p>/g, " />");
  html = html.replace(/<p><hr/g, "<hr").replace(/\/><\/p>/g, " />");

  // Code blocks
  html = html.replace(/<p>```/g, "<pre class='bg-accent rounded p-4 my-4 overflow-x-auto text-sm'><code>");
  html = html.replace(/```<\/p>/g, "</code></pre>");
  html = html.replace(/<pre>([\s\S]*?)<\/pre>/g, (_, code) =>
    `<pre class='bg-accent rounded p-4 my-4 overflow-x-auto text-sm'>${code.replace(/<br \/>/g, "\n")}</pre>`
  );
  html = html.replace(/<p><pre/g, "<pre").replace(/<\/pre><\/p>/g, "</pre>");

  return html;
}

// =============================================================================
// QUERIES
// =============================================================================

export interface CmsPageData {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  showInFooter: boolean;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date | null;
}

// cache() agar generateMetadata + page dalam 1 request memakai hasil yang sama.
// Fallback ke konten default hanya berlaku saat tabel masih kosong (fresh install
// sebelum seed) — jika admin menghapus halaman, halaman benar-benar tidak ada.
export const getCmsPage = cache(async (slug: string): Promise<CmsPageData | null> => {
  const row = await db.cmsPage.findUnique({ where: { slug } });
  if (row) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      image: row.image,
      showInFooter: row.showInFooter,
      isPublished: row.isPublished,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      updatedAt: row.updatedAt,
    };
  }

  const count = await db.cmsPage.count();
  if (count === 0) {
    const fallback = DEFAULT_CMS_PAGES.find((p) => p.slug === slug);
    if (fallback) {
      return {
        id: null,
        slug: fallback.slug,
        title: fallback.title,
        excerpt: fallback.excerpt,
        content: fallback.content,
        image: null,
        showInFooter: fallback.showInFooter,
        isPublished: true,
        seoTitle: null,
        seoDescription: null,
        updatedAt: null,
      };
    }
  }
  return null;
});

export interface FooterPageLink {
  slug: string;
  title: string;
}

export async function getFooterPages(): Promise<FooterPageLink[]> {
  const rows = await db.cmsPage.findMany({
    where: { isPublished: true, showInFooter: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, title: true },
  });
  if (rows.length > 0) return rows;

  const count = await db.cmsPage.count();
  if (count === 0) {
    return DEFAULT_CMS_PAGES.filter((p) => p.showInFooter).map((p) => ({
      slug: p.slug,
      title: p.title,
    }));
  }
  return [];
}

export interface FaqItemData {
  id: string | null;
  question: string;
  answer: string;
}

export async function getFaqItems(): Promise<FaqItemData[]> {
  const rows = await db.faqItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, question: true, answer: true },
  });
  if (rows.length > 0) return rows;

  const count = await db.faqItem.count();
  if (count === 0) {
    return DEFAULT_FAQ_ITEMS.map((f) => ({ id: null, ...f }));
  }
  return [];
}

export async function getContactInfo(): Promise<ContactInfo> {
  const raw = await getSettingValue("contact_info");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ContactInfo;
      return { ...DEFAULT_CONTACT_INFO, ...parsed };
    } catch {
      // malformed JSON — fallback
    }
  }
  return DEFAULT_CONTACT_INFO;
}

// Slug halaman yang punya route tetap di aplikasi
export const KNOWN_PAGE_ROUTES: Record<string, string> = {
  about: "/about",
  "privacy-policy": "/privacy-policy",
  "terms-conditions": "/terms-conditions",
  "return-policy": "/return-policy",
  "shipping-info": "/shipping-info",
};

export function pageHref(slug: string): string {
  return KNOWN_PAGE_ROUTES[slug] ?? `/pages/${slug}`;
}
