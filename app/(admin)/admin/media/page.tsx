"use client";

import { useEffect, useState, useCallback } from "react";
import { MediaGrid } from "@/components/admin/media-grid";

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

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [folderFilter, setFolderFilter] = useState("");

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "24" });
      if (folderFilter) params.set("folder", folderFilter);
      const res = await fetch(`/api/admin/media?${params}`);
      const json = await res.json();
      const data = json.data ?? {};
      setMedia(data.media ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [folderFilter]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  function getUniqueFolders(): string[] {
    const folders = new Set(media.map((m) => m.folder).filter(Boolean) as string[]);
    return Array.from(folders).sort();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">Media Library</h1>
        <p className="text-sm text-muted">{total} total files</p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Folder</label>
          <div className="flex gap-2">
            <button
              onClick={() => { setFolderFilter(""); fetchData(1); }}
              className={`h-9 px-3 rounded text-xs font-medium border border-border transition-colors ${!folderFilter ? "bg-primary text-white border-primary" : "bg-white hover:bg-accent"}`}
            >
              All
            </button>
            {getUniqueFolders().map((f) => (
              <button
                key={f}
                onClick={() => { setFolderFilter(f); fetchData(1); }}
                className={`h-9 px-3 rounded text-xs font-medium border border-border transition-colors ${folderFilter === f ? "bg-primary text-white border-primary" : "bg-white hover:bg-accent"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <MediaGrid media={media} loading={loading} onRefresh={() => fetchData(page)} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <button onClick={() => { setPage(page - 1); fetchData(page - 1); }} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Previous</button>
            )}
            {page < totalPages && (
              <button onClick={() => { setPage(page + 1); fetchData(page + 1); }} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Next</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
