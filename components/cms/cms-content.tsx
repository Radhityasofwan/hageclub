import { markdownToHtml } from "@/lib/cms";

export function CmsContent({ content }: { content: string }) {
  const html = markdownToHtml(content);
  return (
    <div
      className="text-sm text-muted leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
