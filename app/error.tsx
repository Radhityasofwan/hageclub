"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-primary mb-2">Terjadi kesalahan</h2>
        <p className="text-sm text-muted mb-6">
          Halaman mengalami masalah. Coba muat ulang atau kembali ke beranda.
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
        {error.digest && (
          <p className="mt-4 text-xs text-muted/60 font-mono">{error.digest}</p>
        )}
      </div>
    </div>
  );
}
