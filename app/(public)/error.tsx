"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-xs tracking-widest uppercase text-muted mb-4">Error</p>
        <h2 className="text-lg font-semibold mb-2">Halaman tidak dapat dimuat</h2>
        <p className="text-sm text-muted mb-6">
          Terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
