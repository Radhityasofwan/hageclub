"use client";

import { useI18n } from "@/lib/i18n/client";

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const { t } = useI18n();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";
  const url = `${appUrl}/blog/${slug}`;

  return (
    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
      <span className="text-xs text-muted">{t("blog.share")}</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted hover:text-primary transition-colors"
      >
        Twitter
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted hover:text-primary transition-colors"
      >
        WhatsApp
      </a>
      <button
        onClick={() => navigator.clipboard.writeText(url)}
        className="text-xs text-muted hover:text-primary transition-colors"
      >
        {t("blog.copyLink")}
      </button>
    </div>
  );
}
