import Link from "next/link";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const isSuccess = params.success === "1";
  const errorCode = params.error;

  const errorMessages: Record<string, string> = {
    missing_token: "Link verifikasi tidak valid.",
    invalid_token: "Link verifikasi tidak ditemukan. Pastikan kamu mengklik link yang benar.",
    already_used: "Link ini sudah pernah digunakan. Akun kamu mungkin sudah aktif.",
    expired: "Link verifikasi sudah kadaluarsa (24 jam). Minta link baru melalui halaman login.",
    server_error: "Terjadi kesalahan server. Coba lagi atau hubungi kami.",
  };

  const errorText = errorCode ? (errorMessages[errorCode] ?? "Terjadi kesalahan.") : null;

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-primary px-8 py-8 text-center text-white">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">Selamat Datang</p>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase">HAGE CLUB</h1>
        </div>

        <div className="px-8 py-10 text-center space-y-6">
          {isSuccess ? (
            <>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-success">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 16.5l4.5 4.5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary mb-2">Email Terverifikasi!</h2>
                <p className="text-sm text-muted leading-relaxed">
                  Akun HAGE CLUB kamu sudah aktif. Sekarang kamu bisa masuk dan mulai berbelanja.
                </p>
              </div>
              <Link
                href="/"
                className="flex items-center justify-center w-full h-11 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Masuk ke Toko
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-destructive">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l10 10M21 11l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary mb-2">Verifikasi Gagal</h2>
                <p className="text-sm text-muted leading-relaxed">{errorText ?? "Link tidak valid."}</p>
              </div>
              <Link
                href="/"
                className="flex items-center justify-center w-full h-11 border border-border text-sm font-medium rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
