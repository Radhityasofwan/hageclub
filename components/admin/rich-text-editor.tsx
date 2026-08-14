"use client";

import { useState, useCallback, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function simpleMarkdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-primary underline">$1</a>')
    // Images
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded my-2" loading="lazy" />')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-border pl-4 italic text-muted my-2">$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr class='my-4 border-border' />")
    // Paragraphs (double newline)
    .replace(/\n\n/g, "</p><p>")
    // Single newlines within paragraphs
    .replace(/\n/g, "<br />");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li><br \/>?)+)/g, (match) => `<ul class="list-disc pl-5 my-2">${match.replace(/<br \/>/g, "")}</ul>`);

  html = `<p>${html}</p>`;
  // Fix double-wrapped headers
  html = html.replace(/<p><h([1-3])>/g, "<h$1>").replace(/<\/h([1-3])><\/p>/g, "</h$1>");
  // Fix double-wrapped blockquotes
  html = html.replace(/<p><blockquote/g, "<blockquote").replace(/<\/blockquote><\/p>/g, "</blockquote>");
  // Fix double-wrapped hr
  html = html.replace(/<p><hr/g, "<hr").replace(/\/><\/p>/g, " />");
  // Fix double-wrapped images
  html = html.replace(/<p><img/g, "<img").replace(/\/><\/p>/g, " />");
  // Fix double-wrapped code blocks (```code``` → <pre><code>)
  html = html.replace(/<p>```/g, "<pre class='bg-accent rounded p-4 my-2 overflow-x-auto text-sm'><code>");
  html = html.replace(/```<\/p>/g, "</code></pre>");
  // Fix <pre> <br /> removal inside
  html = html.replace(/<pre>([\s\S]*?)<\/pre>/g, (_, code) => `<pre class='bg-accent rounded p-4 my-2 overflow-x-auto text-sm'>${code.replace(/<br \/>/g, "\n")}</pre>`);
  // Fix nested <p> inside <pre>
  html = html.replace(/<p><pre/g, "<pre").replace(/<\/pre><\/p>/g, "</pre>");

  return html;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 400 }: RichTextEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback((before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [value, onChange]);

  const wordCount = value ? value.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const TOOLS = [
    { label: "B", action: () => insertMarkdown("**", "**"), title: "Bold" },
    { label: "I", action: () => insertMarkdown("*", "*"), title: "Italic", style: "italic" },
    { label: "H2", action: () => insertMarkdown("## ", ""), title: "Heading 2" },
    { label: "H3", action: () => insertMarkdown("### ", ""), title: "Heading 3" },
    { label: "Link", action: () => insertMarkdown("[", "](url)"), title: "Link" },
    { label: "Img", action: () => insertMarkdown("![alt](", ")"), title: "Image" },
    { label: "UL", action: () => insertMarkdown("- ", ""), title: "Bullet list" },
    { label: "OL", action: () => insertMarkdown("1. ", ""), title: "Numbered list" },
    { label: `"`, action: () => insertMarkdown("> ", ""), title: "Blockquote" },
    { label: "< >", action: () => insertMarkdown("`", "`"), title: "Inline code" },
    { label: "{}", action: () => insertMarkdown("```\n", "\n```"), title: "Code block" },
  ];

  return (
    <div className="border border-border rounded overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/30">
        <div className="flex items-center gap-1 flex-wrap">
          {TOOLS.map((tool) => (
            <button
              key={tool.title}
              type="button"
              onClick={tool.action}
              title={tool.title}
              className="h-7 px-2 text-xs font-medium text-muted hover:text-primary hover:bg-accent rounded transition-colors"
            >
              {tool.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted">{readingTime} min read</span>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="h-7 px-3 text-xs font-medium rounded border border-border hover:bg-accent transition-colors"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="p-4 text-sm prose max-w-none bg-white min-h-[200px]"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(value) || "<p class='text-muted'>Nothing to preview</p>" }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Write your content in Markdown..."}
          className="w-full p-4 text-sm font-mono bg-white resize-y focus:outline-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
