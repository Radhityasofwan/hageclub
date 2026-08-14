"use client";

import { useState, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, "-");
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-primary mb-1.5">Tags</label>
      <div className="flex flex-wrap gap-1.5 items-center border border-border rounded bg-white px-3 py-2 min-h-[40px] focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-colors">
        {tags.map((tag, i) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-accent text-xs px-1.5 py-0.5 rounded">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-muted hover:text-destructive"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? (placeholder ?? "Type and press Enter...") : ""}
          className="flex-1 min-w-[120px] text-sm bg-transparent border-none outline-none focus:outline-none p-0"
        />
      </div>
      <p className="text-[10px] text-muted mt-1">Press Enter or comma to add a tag</p>
    </div>
  );
}
