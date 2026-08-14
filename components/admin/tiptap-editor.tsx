"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded text-primary",
        "transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({
  value,
  onChange,
  label,
  placeholder,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? "Tulis deskripsi produk…",
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sinkron nilai dari luar (mis. ganti produk yang diedit) — abaikan saat user mengetik
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-editor w-full">
      {label && (
        <span className="block text-sm font-medium text-primary mb-1.5 dark:text-white">
          {label}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-0.5 border border-border rounded-t bg-accent/60 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Tebal"
        >
          <span className="text-[13px] font-bold leading-none">B</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Miring"
        >
          <span className="text-[13px] italic leading-none font-serif">I</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          title="List poin"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M4 3.5h8M4 7h8M4 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="1.8" cy="3.5" r="0.9" fill="currentColor" />
            <circle cx="1.8" cy="7" r="0.9" fill="currentColor" />
            <circle cx="1.8" cy="10.5" r="0.9" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          title="List angka"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M4.5 3.5h8M4.5 7h8M4.5 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M1.5 2.5h1.2v3M1.5 5.5h1.4M1.8 5.5V6.8M1.5 8.7l1.3-.9 1.3.9-.9 1.6H2.4l-.9 1.6h2.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3.5 2.5 6 5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.5 6H9a2.5 2.5 0 0 1 0 5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 3.5 11.5 6 9 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 6H5a2.5 2.5 0 0 0 0 5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="border border-t-0 border-border rounded-b bg-white px-3 py-2"
      />
    </div>
  );
}
