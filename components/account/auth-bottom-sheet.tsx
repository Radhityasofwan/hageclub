"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

type SheetMode = "login" | "register";
type LoginStep = "email" | "password";

interface Props {
  isOpen: boolean;
  mode: SheetMode;
  onClose: () => void;
  onSwitchMode: (mode: SheetMode) => void;
}

export function AuthBottomSheet({ isOpen, mode, onClose, onSwitchMode }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/60 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl sheet-transition",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2 max-h-[90vh] overflow-y-auto">
          {mode === "login" ? (
            <LoginSheet
              onClose={onClose}
              onSwitchToRegister={() => onSwitchMode("register")}
            />
          ) : (
            <RegisterSheet
              onClose={onClose}
              onSwitchToLogin={() => onSwitchMode("login")}
            />
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Login Sheet */

function LoginSheet({
  onClose,
  onSwitchToRegister,
}: {
  onClose: () => void;
  onSwitchToRegister: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "email") emailRef.current?.focus();
    else pwRef.current?.focus();
  }, [step]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step === "email") { setStep("password"); return; }
    setError("");
    setUnverified(false);
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error === "EMAIL_NOT_VERIFIED") { setUnverified(true); return; }
      if (result?.error) { setError("Email atau kata sandi salah"); return; }
      onClose();
      router.refresh();
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMsg(res.ok ? "Email verifikasi telah dikirim ulang!" : (data.message ?? "Gagal mengirim."));
    } catch { setResendMsg("Gagal mengirim, coba lagi."); }
    finally { setResending(false); }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step === "password" && (
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); setUnverified(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors text-muted hover:text-primary"
              aria-label="Kembali"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4L6 8l4 4" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-bold text-primary">{t("account.loginTitle")}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors text-muted hover:text-primary"
          aria-label="Tutup"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleNext} className="space-y-4">
        {step === "email" ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-primary/80">{t("account.emailOrPhone")}</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("account.emailOrPhonePlaceholder")}
              required
              className={fieldCls}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-primary/80">{t("account.passwordLabel")}</label>
              <a
                href="/forgot-password"
                className="text-xs text-muted hover:text-primary transition-colors"
                onClick={onClose}
              >
                Lupa kata sandi?
              </a>
            </div>
            <div className="relative">
              <input
                ref={pwRef}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={cn(fieldCls, "pr-10")}
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
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {unverified && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
            <p className="text-xs font-medium text-primary">Email belum diverifikasi</p>
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
          disabled={step === "email" ? !emailValid : loading}
          className="w-full h-12 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === "email" ? t("account.nextStep") : (loading ? "Memproses..." : "Masuk")}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          {t("account.noAccountRegister")}
        </button>
      </div>

      <p className="text-[10px] text-center text-muted/60 leading-relaxed">
        {t("account.recaptchaNote")}
      </p>
    </div>
  );
}

/* ── Register Sheet */

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const MONTHS_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function RegisterSheet({
  onClose,
  onSwitchToLogin,
}: {
  onClose: () => void;
  onSwitchToLogin: () => void;
}) {
  const { t, locale } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 13 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = locale === "id" ? MONTHS_ID : MONTHS_EN;

  function buildBirthDate() {
    if (!birthDay || !birthMonth || !birthYear) return undefined;
    const m = String(Number(birthMonth)).padStart(2, "0");
    return `${birthYear}-${m}-${String(birthDay).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Kata sandi minimal 8 karakter"); return; }
    setLoading(true);
    try {
      const birthDate = buildBirthDate();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, birthDate }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Pendaftaran gagal"); return; }
      setRegisteredEmail(form.email);
      setStep("verify");
    } catch { setError("Terjadi kesalahan, coba lagi"); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      setResendMsg(res.ok ? "Email terkirim! Cek inbox kamu." : (data.message ?? "Gagal mengirim ulang."));
    } catch { setResendMsg("Gagal mengirim ulang, coba lagi."); }
    finally { setResending(false); }
  }

  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Cek Email Kamu</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent text-muted hover:text-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>
        <div className="text-center py-4 space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-primary">
              <rect x="3" y="7" width="26" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 11l13 8 13-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Link verifikasi dikirim ke <span className="font-medium text-primary">{registeredEmail}</span>.
          </p>
          <div className="bg-accent/60 rounded-xl p-3 text-xs text-muted text-left space-y-1">
            <p>• Cek folder <strong>Spam / Junk</strong> jika tidak muncul dalam 2 menit</p>
            <p>• Link berlaku selama <strong>24 jam</strong></p>
          </div>
          {resendMsg && (
            <p className={`text-xs ${resendMsg.includes("terkirim") ? "text-success" : "text-destructive"}`}>{resendMsg}</p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full h-10 border border-border rounded-xl text-sm text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-60"
          >
            {resending ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
          </button>
          <button type="button" onClick={onSwitchToLogin} className="text-sm text-muted hover:text-primary transition-colors">
            Sudah verifikasi? Masuk sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">{t("account.registerTitle")}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent text-muted hover:text-primary"
          aria-label="Tutup"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-muted leading-relaxed">{t("account.registerBenefit")}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-primary/80">{t("account.fullName")}</label>
          <input
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder={t("account.fullNamePlaceholder")}
            required
            className={fieldCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-primary/80">{t("auth.email")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder={t("account.emailOrPhonePlaceholder")}
            required
            className={fieldCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-primary/80">{t("account.passwordLabel")}</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={t("account.passwordPlaceholder")}
              required
              className={cn(fieldCls, "pr-10")}
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
        </div>

        {/* Tanggal Lahir — 3 dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-primary/80">
            {t("account.birthDate")}{" "}
            <span className="text-[10px] text-muted font-normal">(opsional)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className={selectCls}
            >
              <option value="">{t("account.birthDay")}</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className={selectCls}
            >
              <option value="">{t("account.birthMonth")}</option>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className={selectCls}
            >
              <option value="">{t("account.birthYear")}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
        >
          {loading ? "Mendaftar..." : t("account.createAccount")}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          {t("account.haveAccountLogin")}
        </button>
      </div>

      <p className="text-[10px] text-center text-muted/60 leading-relaxed">
        Dengan mendaftar, kamu menyetujui{" "}
        <a href="/terms-conditions" className="underline hover:text-primary" onClick={onClose}>
          Syarat & Ketentuan
        </a>{" "}
        kami.
      </p>
    </div>
  );
}

/* ── Shared */

const fieldCls =
  "w-full h-12 px-4 border border-border rounded-xl text-sm bg-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

const selectCls =
  "w-full h-12 px-3 border border-border rounded-xl text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none";

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
