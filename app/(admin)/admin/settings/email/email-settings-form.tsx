"use client";

import { useState, useCallback } from "react";

interface DbField {
  key: string;
  label: string;
  hint: string;
  isSecret: boolean;
  value: string;
  hasValue?: boolean;
}

interface Props {
  settings: DbField[];
  adminEmail?: string;
}

// Static definition — shown even when DB rows don't exist yet
const EMAIL_FIELDS: Array<{
  key: string;
  label: string;
  hint: string;
  isSecret: boolean;
  placeholder: string;
}> = [
  {
    key: "email_host",
    label: "SMTP Host",
    hint: "Server SMTP untuk kirim email. Contoh: mail.domain.com atau smtp.gmail.com",
    isSecret: false,
    placeholder: "mail.domain.com",
  },
  {
    key: "email_port",
    label: "SMTP Port",
    hint: "Port SMTP. Gunakan 465 untuk SSL, 587 untuk TLS/STARTTLS, atau 25 (tidak direkomendasikan)",
    isSecret: false,
    placeholder: "465",
  },
  {
    key: "email_secure",
    label: "Gunakan SSL/TLS",
    hint: "true = koneksi SSL langsung (port 465). false = STARTTLS atau plain (port 587/25)",
    isSecret: false,
    placeholder: "true",
  },
  {
    key: "email_user",
    label: "Username SMTP",
    hint: "Alamat email atau username akun SMTP yang digunakan untuk autentikasi",
    isSecret: false,
    placeholder: "noreply@domain.com",
  },
  {
    key: "email_pass",
    label: "Password SMTP",
    hint: "Password atau App Password untuk akun SMTP. Untuk Gmail: buat App Password di Google Account → Security",
    isSecret: true,
    placeholder: "password atau app password",
  },
  {
    key: "email_from_name",
    label: "Nama Pengirim",
    hint: "Nama yang tampil di inbox penerima sebagai pengirim. Contoh: HAGE CLUB",
    isSecret: false,
    placeholder: "HAGE CLUB",
  },
  {
    key: "email_from_address",
    label: "Alamat Email Pengirim",
    hint: "Alamat email yang tampil sebagai pengirim (From). Harus sama atau alias dari Username SMTP",
    isSecret: false,
    placeholder: "noreply@domain.com",
  },
];

export function EmailSettingsForm({ settings, adminEmail }: Props) {
  // Merge static definitions with DB values
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const f of EMAIL_FIELDS) {
      const dbRow = settings.find((s) => s.key === f.key);
      map[f.key] = dbRow?.value ?? "";
    }
    return map;
  });

  // Track which secret fields have a saved value (to show •••• placeholder)
  const [hasValue] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const f of EMAIL_FIELDS) {
      if (!f.isSecret) continue;
      const dbRow = settings.find((s) => s.key === f.key);
      map[f.key] = Boolean(dbRow?.hasValue);
    }
    return map;
  });

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [testTo, setTestTo] = useState(adminEmail ?? "");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [connStatus, setConnStatus] = useState<"idle" | "ok" | "fail">("idle");

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  async function handleSave() {
    setSaving(true);
    const updates = EMAIL_FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? "" }))
      .filter((u) => u.value !== "••••••••");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menyimpan");
      showToast("success", "Konfigurasi email tersimpan");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckConnection() {
    setChecking(true);
    setConnStatus("idle");
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });
      const data = await res.json();
      if (res.ok && data.data?.connected) {
        setConnStatus("ok");
        showToast("success", "Koneksi SMTP berhasil!");
      } else {
        setConnStatus("fail");
        showToast("error", data.message ?? "Koneksi gagal");
      }
    } catch {
      setConnStatus("fail");
      showToast("error", "Tidak dapat terhubung ke server SMTP");
    } finally {
      setChecking(false);
    }
  }

  async function handleSendTest() {
    if (!testTo) {
      showToast("error", "Masukkan alamat email tujuan");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", to: testTo }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `Test email terkirim ke ${testTo}`);
      } else {
        showToast("error", data.message ?? "Gagal mengirim test email");
      }
    } catch {
      showToast("error", "Gagal mengirim test email");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-sm text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-success text-white" : "bg-destructive text-white"
          }`}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      {/* SMTP Config Card */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Konfigurasi SMTP</h2>
            <p className="text-xs text-muted mt-0.5">
              Pengaturan server SMTP untuk mengirim email otomatis dari sistem
            </p>
          </div>
          <button
            onClick={handleCheckConnection}
            disabled={checking}
            className="flex items-center gap-2 h-8 px-3 border border-border rounded-sm text-xs text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-60"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connStatus === "ok"
                  ? "bg-success"
                  : connStatus === "fail"
                  ? "bg-destructive"
                  : "bg-muted"
              }`}
            />
            {checking
              ? "Mengecek..."
              : connStatus === "ok"
              ? "Terkoneksi"
              : connStatus === "fail"
              ? "Gagal"
              : "Cek Koneksi"}
          </button>
        </div>

        <div className="divide-y divide-border">
          {EMAIL_FIELDS.map((field) => {
            const isRevealed = revealed[field.key];
            const currentVal = values[field.key] ?? "";
            const savedSecret = field.isSecret && hasValue[field.key] && currentVal === "••••••••";

            return (
              <div key={field.key} className="px-6 py-4">
                <div className="mb-2">
                  <label
                    htmlFor={field.key}
                    className="text-sm font-medium text-primary flex items-center gap-2"
                  >
                    {field.label}
                    {field.isSecret && (
                      <span className="text-[10px] text-muted border border-border rounded-sm px-1 py-0.5 uppercase tracking-wide">
                        Secret
                      </span>
                    )}
                    {field.isSecret && hasValue[field.key] && (
                      <span className="text-[10px] text-success border border-success/30 rounded-sm px-1 py-0.5 uppercase tracking-wide">
                        Set
                      </span>
                    )}
                  </label>
                  {field.hint && (
                    <p className="text-xs text-muted mt-0.5">{field.hint}</p>
                  )}
                </div>
                <div className="relative">
                  <input
                    id={field.key}
                    type={field.isSecret && !isRevealed ? "password" : "text"}
                    value={currentVal}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={
                      savedSecret
                        ? "Biarkan kosong untuk tidak mengubah"
                        : field.placeholder
                    }
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-9 border border-border rounded-sm px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary pr-10 bg-white"
                  />
                  {field.isSecret && (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((prev) => ({
                          ...prev,
                          [field.key]: !isRevealed,
                        }))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                    >
                      {isRevealed ? <IconEyeOff /> : <IconEye />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border bg-accent/20 flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 h-8 px-4 bg-primary text-white text-xs font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border border-white border-r-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Konfigurasi"
            )}
          </button>
        </div>
      </section>

      {/* Test Email Card */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Kirim Test Email</h2>
          <p className="text-xs text-muted mt-0.5">
            Verifikasi konfigurasi SMTP dengan mengirim email percobaan
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-3">
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="Alamat email tujuan test"
              className="flex-1 h-9 border border-border rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            />
            <button
              onClick={handleSendTest}
              disabled={testing}
              className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-xs font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {testing ? (
                <>
                  <span className="w-3 h-3 border border-white border-r-transparent rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <IconSend />
                  Kirim Test
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted mt-2">
            Email test akan dikirim menggunakan konfigurasi yang sudah tersimpan di database
          </p>
        </div>
      </section>

      {/* Info box */}
      <div className="rounded-sm border border-border bg-white p-4 text-xs text-muted space-y-1.5">
        <p className="font-semibold text-primary">Petunjuk Konfigurasi</p>
        <p>
          • <strong>cPanel Hosting:</strong> Buat email akun di cPanel, lalu gunakan mail server
          hosting kamu (contoh:{" "}
          <code className="bg-accent px-1 rounded-sm">mail.namadomain.com</code>), port{" "}
          <code className="bg-accent px-1 rounded-sm">465</code> dengan SSL{" "}
          <code className="bg-accent px-1 rounded-sm">true</code>.
        </p>
        <p>
          • <strong>Gmail:</strong> Aktifkan 2FA di akun Google, buat App Password di{" "}
          <em>Google Account → Security → App Passwords</em>. Gunakan host{" "}
          <code className="bg-accent px-1 rounded-sm">smtp.gmail.com</code>, port{" "}
          <code className="bg-accent px-1 rounded-sm">587</code>, SSL:{" "}
          <code className="bg-accent px-1 rounded-sm">false</code>.
        </p>
        <p>
          • Konfigurasi di-cache selama 5 menit. Setelah simpan, tunggu 5 menit atau restart
          server agar perubahan aktif langsung.
        </p>
      </div>
    </div>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 9.5M4.6 4.7C2.8 5.9 1 8 1 8s2.5 5 7 5c1.3 0 2.5-.3 3.5-.9M10 3.4C9.4 3.2 8.7 3 8 3 3.5 3 1 8 1 8s.5 1 1.5 2" strokeLinecap="round" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2L1 7l5 3 5-7-7 5 3 5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
