"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  alt: string | null;
  folder: string | null;
  createdAt: string;
}

export interface MediaGridProps {
  media: MediaItem[];
  loading: boolean;
  onRefresh: () => void;
  selectable?: boolean;
  selectedId?: string | null;
  onSelect?: (item: MediaItem) => void;
  maxWidth?: number;
}

export function MediaGrid({
  media,
  loading,
  onRefresh,
  selectable,
  selectedId,
  onSelect,
  maxWidth,
}: MediaGridProps) {
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleEdit = useCallback((item: MediaItem) => {
    setEditItem(item);
    setEditAlt(item.alt ?? "");
    setEditFolder(item.folder ?? "");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/media/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: editAlt, folder: editFolder }),
      });
      setEditItem(null);
      onRefresh();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [editItem, editAlt, editFolder, onRefresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      onRefresh();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }, [onRefresh]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      onRefresh();
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [onRefresh]);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      {/* Upload bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted">{media.length} files</p>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: maxWidth
            ? "repeat(auto-fill, minmax(120px, 1fr))"
            : "repeat(auto-fill, minmax(140px, 1fr))",
        }}
      >
        {media.map((item) => {
          const isSelected = selectable && selectedId === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "group relative border border-border rounded overflow-hidden bg-accent/30 cursor-pointer",
                isSelected && "ring-2 ring-primary",
                selectable && "hover:ring-2 hover:ring-primary/50"
              )}
              onClick={() => onSelect?.(item)}
            >
              <div className="aspect-square bg-accent flex items-center justify-center overflow-hidden">
                <img
                  src={item.url}
                  alt={item.alt ?? item.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                  className="w-7 h-7 bg-white rounded flex items-center justify-center text-xs text-primary hover:bg-accent"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                {!selectable && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    disabled={deleting === item.id}
                    className="w-7 h-7 bg-white rounded flex items-center justify-center text-xs text-destructive hover:bg-accent disabled:opacity-50"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}
              </div>

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}

              {/* File info */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-muted truncate">{item.filename}</p>
                <p className="text-[9px] text-muted/60">{formatSize(item.size)}</p>
              </div>
            </div>
          );
        })}

        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="border border-border rounded overflow-hidden animate-pulse">
            <div className="aspect-square bg-accent" />
            <div className="px-2 py-1.5 space-y-1">
              <div className="h-2 bg-accent rounded w-3/4" />
              <div className="h-1.5 bg-accent rounded w-1/2" />
            </div>
          </div>
        ))}

        {!loading && media.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted">
            No media files yet. Click Upload to add one.
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Image"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={saving}>Save</Button>
          </div>
        }
      >
        {editItem && (
          <div className="space-y-4">
            <img src={editItem.url} alt="" className="w-full h-32 object-contain bg-accent rounded" />
            <Input label="Alt Text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
            <Input label="Folder" value={editFolder} onChange={(e) => setEditFolder(e.target.value)} placeholder="products, categories, etc." />
          </div>
        )}
      </Modal>
    </div>
  );
}
