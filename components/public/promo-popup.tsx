"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { usePromoStore } from "@/stores/promo-store";
import { formatPrice } from "@/lib/utils";

interface PromoData {
  id: string;
  popupTitle: string | null;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  endDate: string | null;
  userClaimedCode: string | null;
  delaySeconds: number;
  cooldownHours: number;
  reminderDays: number;
}

const SUPPRESSED_PATHS = ["/checkout", "/cart"];

const KEYFRAMES = `
  @keyframes pp-enter {
    0%   { opacity: 0; transform: translateY(16px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes pp-leave {
    0%   { opacity: 1; transform: translateY(0)    scale(1); }
    100% { opacity: 0; transform: translateY(10px) scale(0.97); }
  }
  @keyframes pp-chip {
    0%   { opacity: 0; transform: translateY(10px) scale(0.94); }
    100% { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes pp-code {
    0%   { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes pp-check {
    0%   { opacity: 0; transform: scale(0.6); }
    100% { opacity: 1; transform: scale(1); }
  }
  .pp-enter { animation: pp-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .pp-leave { animation: pp-leave 0.2s  ease-in forwards; }
  .pp-chip  { animation: pp-chip  0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .pp-code  { animation: pp-code  0.3s  cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .pp-check { animation: pp-check 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
`;

export function PromoPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isDismissed, dismiss, claimedCode, setClaimed } = usePromoStore();

  const [promo, setPromo] = useState<PromoData | null>(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const suppressed = SUPPRESSED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    fetch("/api/promotions/active")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const data: PromoData = json.data;
          setPromo(data);
          if (data.userClaimedCode) {
            setClaimed(data.userClaimedCode);
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!promo || suppressed) return;
    const delayMs = (promo.delaySeconds ?? 2) * 1000;

    if (promo.userClaimedCode) {
      // Server only sends userClaimedCode inside the reminder window
      // (H-N before expiry). Dismissing once suppresses until expiry.
      const endTs = promo.endDate ? new Date(promo.endDate).getTime() : null;
      const msUntilExpiry = endTs ? endTs - Date.now() : null;
      if (msUntilExpiry != null && msUntilExpiry > 0) {
        if (isDismissed(promo.id, msUntilExpiry)) return;
      }
      const t = setTimeout(() => setVisible(true), delayMs);
      return () => clearTimeout(t);
    }

    // Unclaimed: suppress for admin-configured cooldown
    const unclaimedCooldownMs = (promo.cooldownHours ?? 24) * 60 * 60 * 1000;
    if (isDismissed(promo.id, unclaimedCooldownMs)) return;
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [promo, suppressed, isDismissed]);

  useEffect(() => {
    if (!promo?.endDate || !visible) return;
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [promo?.endDate, visible]);

  if (!promo || !visible || suppressed) return null;
  const p = promo;

  const slotsLeft = p.usageLimit != null ? p.usageLimit - p.usedCount : null;
  const isSoldOut = slotsLeft != null && slotsLeft <= 0;
  const msLeft = p.endDate ? new Date(p.endDate).getTime() - now : null;
  const isExpired = msLeft != null && msLeft <= 0;

  const isReminder =
    !!(p.userClaimedCode || claimedCode) &&
    msLeft != null && msLeft > 0 &&
    (p.reminderDays ?? 1) > 0 &&
    msLeft < (p.reminderDays ?? 1) * 24 * 60 * 60 * 1000;

  function formatCountdown(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}j ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}d`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatDiscount() {
    if (p.type === "PERCENTAGE") return `Diskon ${p.value}%`;
    if (p.type === "FIXED") return `Hemat ${formatPrice(p.value)}`;
    return "Gratis Ongkos Kirim";
  }

  async function performClaim() {
    setClaiming(true);
    setClaimError("");
    try {
      const res = await fetch(`/api/promotions/${p.id}/claim`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) setClaimed(json.data.code);
      else setClaimError(json.message ?? "Gagal mengklaim promo.");
    } catch { setClaimError("Terjadi kesalahan. Coba lagi."); }
    finally { setClaiming(false); }
  }

  function handleClaim() {
    if (!session) {
      // Belum login → halaman akun (pilih daftar/login)
      router.push("/account");
      return;
    }
    performClaim();
  }

  async function copyCode() {
    if (!claimedCode) return;
    try { await navigator.clipboard.writeText(claimedCode); }
    catch {
      const el = document.createElement("textarea");
      el.value = claimedCode;
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleDismiss() {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      dismiss(p.id);
    }, 200);
  }

  function handleMinimize() {
    setLeaving(true);
    setTimeout(() => { setMinimized(true); setLeaving(false); }, 200);
  }

  // ── Minimized chip ──
  if (minimized) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
        <button
          onClick={() => setMinimized(false)}
          className="pp-chip fixed bottom-6 left-6 z-50 flex items-center gap-2 h-10 pl-4 pr-5 rounded-full text-sm font-medium text-white transition-shadow hover:shadow-lg"
          style={{ background: "#111", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.3)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
          {p.popupTitle ?? "Promo Terbatas"}
        </button>
      </>
    );
  }

  // ── Full popup ──
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div
        role="dialog"
        aria-label="Promo terbatas"
        className={`fixed bottom-4 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:w-80 z-50 bg-white rounded-2xl ${leaving ? "pp-leave" : "pp-enter"}`}
        style={{ boxShadow: "0 8px 40px -4px rgba(0,0,0,0.16), 0 2px 12px -2px rgba(0,0,0,0.08)" }}
      >
        {/* ── Top bar: eyebrow + controls ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          {isReminder ? (
            <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full" style={{ color: "#b45309", background: "#fef3c7" }}>
              Segera Kadaluarsa
            </span>
          ) : (
            <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: "#aaa" }}>
              Penawaran Terbatas
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              aria-label="Perkecil"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: "#bbb" }}
            >
              <svg viewBox="0 0 14 2" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
                <path d="M1 1h12" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Tutup"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: "#bbb" }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
                <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="px-6 pt-4 pb-6 space-y-5">

          {/* Headline block */}
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-semibold leading-tight tracking-tight" style={{ color: "#111" }}>
                {formatDiscount()}
              </p>
              {p.popupTitle && (
                <p className="mt-1.5 text-sm leading-snug" style={{ color: "#888" }}>
                  {p.popupTitle}
                </p>
              )}
            </div>

            {/* Conditions */}
            {(p.minPurchase != null || (p.type === "PERCENTAGE" && p.maxDiscount != null)) && (
              <div className="space-y-1">
                {p.minPurchase != null && (
                  <p className="text-[13px] leading-relaxed" style={{ color: "#aaa" }}>
                    Min. belanja{" "}
                    <span className="font-medium" style={{ color: "#555" }}>
                      {formatPrice(p.minPurchase)}
                    </span>
                  </p>
                )}
                {p.type === "PERCENTAGE" && p.maxDiscount != null && (
                  <p className="text-[13px] leading-relaxed" style={{ color: "#aaa" }}>
                    Maks. hemat{" "}
                    <span className="font-medium" style={{ color: "#555" }}>
                      {formatPrice(p.maxDiscount)}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Validity & countdown — inline, quiet */}
            {(() => {
              if (!p.endDate || isExpired) return null;
              const showCountdown = msLeft != null && msLeft < 24 * 60 * 60 * 1000;
              return (
                <p className="text-[13px]" style={{ color: "#aaa" }}>
                  {showCountdown && msLeft != null ? (
                    <>
                      Berakhir dalam{" "}
                      <span className="font-mono font-semibold" style={{ color: "#555" }}>
                        {formatCountdown(msLeft)}
                      </span>
                    </>
                  ) : (
                    <>
                      Berlaku s.d.{" "}
                      <span className="font-medium" style={{ color: "#555" }}>
                        {new Date(p.endDate).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </>
                  )}
                </p>
              );
            })()}
          </div>

          {/* Thin divider */}
          <div style={{ height: "1px", background: "#f0f0f0" }} />

          {/* ── State: expired / sold out ── */}
          {isSoldOut || isExpired ? (
            <p className="text-sm text-center py-1" style={{ color: "#bbb" }}>
              {isSoldOut ? "Kuota sudah habis." : "Promo telah berakhir."}
            </p>

          ) : claimedCode ? (
            /* ── State: code revealed ── */
            <div className="pp-code space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#aaa" }}>
                  Kode voucher kamu
                </p>
                {/* Coupon-style code box */}
                <button
                  onClick={copyCode}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors group"
                  style={{
                    border: "1.5px dashed #d8d8d8",
                    background: "#fafafa",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#aaa")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d8d8d8")}
                >
                  <span
                    className="font-mono text-base font-semibold tracking-[0.2em]"
                    style={{ color: "#111" }}
                  >
                    {claimedCode}
                  </span>
                  {copied ? (
                    <span className="pp-check flex items-center gap-1 text-[12px] font-medium" style={{ color: "#22c55e" }}>
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M1.5 6l3 3.5 6-7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Tersalin
                    </span>
                  ) : (
                    <span className="text-[12px] font-medium transition-colors" style={{ color: "#bbb" }}>
                      Salin
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[12px] text-center" style={{ color: "#bbb" }}>
                Masukkan kode ini saat checkout
              </p>
            </div>

          ) : (
            /* ── State: CTA ── */
            <div className="space-y-3">
              {claimError && (
                <p className="text-[12px] text-center" style={{ color: "#ef4444" }}>
                  {claimError}
                </p>
              )}
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full h-11 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: "#111",
                }}
                onMouseEnter={(e) => { if (!claiming) e.currentTarget.style.background = "#333"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#111"; }}
              >
                {claiming ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : session ? (
                  "Ambil Voucher"
                ) : (
                  "Login untuk Ambil Voucher"
                )}
              </button>
              {!session && (
                <p className="text-[12px] text-center" style={{ color: "#bbb" }}>
                  Kode akan muncul setelah login
                </p>
              )}
            </div>
          )}

          {/* Slot counter — very quiet, only if limited */}
          {p.usageLimit != null && !isSoldOut && !isExpired && slotsLeft != null && (
            <p className="text-[11px] text-center" style={{ color: "#ccc" }}>
              {Math.max(0, slotsLeft)} dari {p.usageLimit} voucher tersisa
            </p>
          )}
        </div>
      </div>
    </>
  );
}
