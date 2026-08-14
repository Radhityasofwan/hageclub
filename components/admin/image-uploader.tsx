"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ImageItem {
  id?: string;
  url: string;
  alt?: string | null;
  isCover?: boolean;
  sortOrder?: number;
  uploading?: boolean;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      if (images.length + files.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      try {
        const newImages: ImageItem[] = [];

        for (const file of files) {
          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} melebihi 5MB, dilewati`);
            continue;
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "products");

          const res = await fetch("/api/admin/media/upload", {
            method: "POST",
            body: formData,
          });
          const json = await res.json();
          if (!res.ok) {
            alert(json.message ?? `Gagal upload ${file.name}`);
            continue;
          }

          newImages.push({
            url: json.data.url,
            sortOrder: images.length + newImages.length,
          });
        }

        if (newImages.length > 0) {
          onChange([...images, ...newImages]);
        }
      } catch {
        alert("Gagal upload gambar");
      } finally {
        setUploading(false);
      }
    },
    [images.length, maxImages, onChange]
  );

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function setAsCover(index: number) {
    onChange(
      images.map((img, i) => ({
        ...img,
        isCover: i === index,
      }))
    );
  }

  function moveImage(from: number, direction: -1 | 1) {
    const to = from + direction;
    if (to < 0 || to >= images.length) return;
    const updated = [...images];
    [updated[from], updated[to]] = [updated[to], updated[from]];
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-primary">
          Product Images
        </label>
        <span className="text-xs text-muted">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {images.map((img, index) => (
          <div
            key={index}
            className={cn(
              "relative aspect-square border border-border rounded overflow-hidden group",
              img.isCover && "ring-2 ring-primary"
            )}
          >
            <img
              src={img.url}
              alt={img.alt ?? ""}
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              {!img.isCover && (
                <button
                  type="button"
                  onClick={() => setAsCover(index)}
                  className="w-6 h-6 bg-white rounded flex items-center justify-center"
                  title="Set as cover"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M2 4h12M2 8h12M2 12h8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="w-6 h-6 bg-destructive text-white rounded flex items-center justify-center"
                title="Remove"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {/* Cover badge */}
            {img.isCover && (
              <span className="absolute top-1 left-1 text-[9px] font-semibold bg-primary text-white px-1 rounded">
                Cover
              </span>
            )}
            {/* Reorder buttons */}
            <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  className="w-5 h-5 bg-white/90 rounded flex items-center justify-center"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M8 3v10M4 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  className="w-5 h-5 bg-white/90 rounded flex items-center justify-center"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M8 13V3M4 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Upload button */}
        {images.length < maxImages && (
          <label className="aspect-square border-2 border-dashed border-border rounded flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary transition-colors">
            {uploading ? (
              <svg className="animate-spin w-5 h-5 text-muted" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="32" strokeDashoffset="32" />
              </svg>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-muted">
                  <path d="M8 1v10M3 6l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 12v2h14v-2" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] text-muted">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <p className="text-[10px] text-muted">
        Drag or click to upload. Click Cover to set the main product image. Max 5MB per image.
      </p>
    </div>
  );
}
