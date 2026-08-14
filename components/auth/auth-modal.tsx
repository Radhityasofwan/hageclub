"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/stores/auth-modal-store";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const router = useRouter();
  const { isOpen, tab, callbackFn, close, switchTab } = useAuthModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-accent transition-colors"
          aria-label="Tutup"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Brand header */}
        <div className="bg-primary px-6 pt-8 pb-6 text-center text-white">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">Welcome to</p>
          <h1 className="text-xl font-bold tracking-[0.15em] uppercase">HAGE CLUB</h1>
          <p className="text-xs text-white/50 mt-1 tracking-wide">The Pinnacle of Refined Comfort</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border">
          <button
            onClick={() => switchTab("login")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === "login"
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted hover:text-primary"
            )}
          >
            Masuk
          </button>
          <button
            onClick={() => switchTab("register")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === "register"
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted hover:text-primary"
            )}
          >
            Daftar
          </button>
        </div>

        {/* Form area */}
        <div className="px-6 py-6">
          {tab === "login" ? (
            <LoginForm
              onSuccess={() => {
                close();
                if (callbackFn) {
                  callbackFn();
                  router.refresh();
                } else {
                  router.push("/account");
                }
              }}
              onClose={close}
              onSwitchToRegister={() => switchTab("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {
                close();
                if (callbackFn) {
                  callbackFn();
                  router.refresh();
                } else {
                  router.push("/account");
                }
              }}
              onSwitchToLogin={() => switchTab("login")}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ────────────────────────────────────────────────── Login Form */

function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onClose,
}: {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setResendMsg("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
        return;
      }
      if (result?.error) {
        setError("Email atau kata sandi salah");
        return;
      }
      onSuccess();
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMsg(res.ok ? "Email verifikasi telah dikirim ulang!" : (data.message ?? "Gagal mengirim."));
    } catch {
      setResendMsg("Gagal mengirim, coba lagi.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email">
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@kamu.com"
          required
          className={fieldClass}
        />
      </Field>

      <Field label="Kata Sandi">
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={cn(fieldClass, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            tabIndex={-1}
          >
            {showPw ? <EyeOff /> : <EyeOn />}
          </button>
        </div>
      </Field>

      <div className="flex justify-end -mt-1">
        <a
          href="/forgot-password"
          className="text-xs text-muted hover:text-primary transition-colors"
          onClick={onClose}
        >
          Lupa kata sandi?
        </a>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {unverified && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
          <p className="text-xs text-primary font-medium">Email belum diverifikasi</p>
          <p className="text-xs text-muted">Cek inbox kamu untuk link verifikasi, atau kirim ulang di bawah.</p>
          {resendMsg && (
            <p className={`text-xs ${resendMsg.includes("dikirim") ? "text-success" : "text-destructive"}`}>
              {resendMsg}
            </p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-primary font-medium hover:underline disabled:opacity-60"
          >
            {resending ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>

      <p className="text-xs text-center text-muted">
        Belum punya akun?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary font-medium hover:underline"
        >
          Daftar sekarang
        </button>
      </p>
    </form>
  );
}

/* ────────────────────────────────────────────────── Register Form */

function RegisterForm({
  onSwitchToLogin,
}: {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    birthDate: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }
    if (form.password.length < 8) {
      setError("Kata sandi minimal 8 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          city: form.city || undefined,
          birthDate: form.birthDate || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Pendaftaran gagal");
        return;
      }

      setRegisteredEmail(form.email);
      setStep("verify");
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      setResendMsg(res.ok ? "Email terkirim! Cek inbox kamu." : (data.message ?? "Gagal mengirim ulang."));
    } catch {
      setResendMsg("Gagal mengirim ulang, coba lagi.");
    } finally {
      setResending(false);
    }
  }

  if (step === "verify") {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-primary">
            <rect x="3" y="7" width="26" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 11l13 8 13-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-primary mb-1">Cek Email Kamu</h3>
          <p className="text-xs text-muted leading-relaxed">
            Kami mengirim link verifikasi ke{" "}
            <span className="font-medium text-primary">{registeredEmail}</span>.
            Klik link tersebut untuk mengaktifkan akun kamu.
          </p>
        </div>
        <div className="bg-accent/60 rounded-lg p-3 text-xs text-muted text-left space-y-1">
          <p>• Cek folder <strong>Spam / Junk</strong> jika tidak muncul dalam 2 menit</p>
          <p>• Link berlaku selama <strong>24 jam</strong></p>
        </div>
        {resendMsg && (
          <p className={`text-xs ${resendMsg.includes("terkirim") ? "text-success" : "text-destructive"}`}>
            {resendMsg}
          </p>
        )}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full h-10 border border-border rounded-lg text-sm text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-60"
          >
            {resending ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
          </button>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full text-xs text-muted hover:text-primary transition-colors"
          >
            Sudah verifikasi? Masuk sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Nama Lengkap">
        <input
          ref={nameRef}
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Nama kamu"
          required
          className={fieldClass}
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="email@kamu.com"
          required
          className={fieldClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kata Sandi">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 8 karakter"
              required
              className={cn(fieldClass, "pr-8 text-xs")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              tabIndex={-1}
            >
              {showPw ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
        </Field>
        <Field label="Ulangi Sandi">
          <input
            type={showPw ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            placeholder="Ulangi sandi"
            required
            className={cn(fieldClass, "text-xs")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kota / Kecamatan" optional>
          <input
            type="text"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Jakarta Selatan"
            className={cn(fieldClass, "text-xs")}
          />
        </Field>
        <Field label="Tanggal Lahir" optional>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className={cn(fieldClass, "text-xs")}
          />
        </Field>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
      >
        {loading ? "Mendaftar..." : "Buat Akun"}
      </button>

      <p className="text-xs text-center text-muted">
        Sudah punya akun?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary font-medium hover:underline"
        >
          Masuk
        </button>
      </p>

      <p className="text-[10px] text-center text-muted leading-relaxed">
        Dengan mendaftar, kamu menyetujui{" "}
        <a href="/terms-conditions" className="underline hover:text-primary">
          Syarat & Ketentuan
        </a>{" "}
        kami.
      </p>
    </form>
  );
}

/* ────────────────────────────────────────────────── Helpers */

const fieldClass =
  "w-full h-10 px-3 border border-border rounded-lg text-sm bg-white placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-xs font-medium text-primary/80">
        {label}
        {optional && (
          <span className="text-[10px] text-muted font-normal">(opsional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

function EyeOn() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010.4 10M5 4.2C3 5.4 1.5 7.5 1.5 8S4 13 8 13c1.2 0 2.3-.3 3.2-.8M8 3c4 0 6.5 5 6.5 5s-.6 1.2-1.8 2.3" />
    </svg>
  );
}
