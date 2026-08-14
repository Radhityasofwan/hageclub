"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  usedCount: number;
  showAsPopup: boolean;
  popupTitle: string | null;
  popupPriority: number | null;
}

interface PopupConfig {
  displayMode: "priority" | "rotation";
  rotationMinutes: number;
  delaySeconds: number;
  cooldownHours: number;
  reminderDays: number;
}

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "% Off",
  FIXED: "Fixed",
  FREE_SHIPPING: "Free Ship",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Popup config
  const defaultConfig: PopupConfig = { displayMode: "priority", rotationMinutes: 30, delaySeconds: 2, cooldownHours: 24, reminderDays: 1 };
  const [popupConfig, setPopupConfig] = useState<PopupConfig>(defaultConfig);
  const [popupConfigLoading, setPopupConfigLoading] = useState(true);
  const [popupConfigSaving, setPopupConfigSaving] = useState(false);
  const [popupConfigDraft, setPopupConfigDraft] = useState<PopupConfig>(defaultConfig);

  // Popup coupon reorder
  const [popupCoupons, setPopupCoupons] = useState<Coupon[]>([]);
  const [reordering, setReordering] = useState(false);

  const sortByPriority = (list: Coupon[]) =>
    [...list].sort((a, b) => {
      if (a.popupPriority == null && b.popupPriority == null) return 0;
      if (a.popupPriority == null) return 1;
      if (b.popupPriority == null) return -1;
      return a.popupPriority - b.popupPriority;
    });

  const fetchPopupCoupons = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coupons?popup=true&limit=50");
      const json = await res.json();
      setPopupCoupons(sortByPriority(json.data?.coupons ?? []));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/popup-config")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setPopupConfig(json.data);
          setPopupConfigDraft(json.data);
        }
      })
      .finally(() => setPopupConfigLoading(false));

    fetchPopupCoupons();
  }, [fetchPopupCoupons]);

  async function savePopupConfig() {
    setPopupConfigSaving(true);
    try {
      const res = await fetch("/api/admin/popup-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(popupConfigDraft),
      });
      const json = await res.json();
      if (res.ok && json.success) setPopupConfig(popupConfigDraft);
    } finally {
      setPopupConfigSaving(false);
    }
  }

  const popupConfigDirty =
    popupConfigDraft.displayMode !== popupConfig.displayMode ||
    popupConfigDraft.rotationMinutes !== popupConfig.rotationMinutes ||
    popupConfigDraft.delaySeconds !== popupConfig.delaySeconds ||
    popupConfigDraft.cooldownHours !== popupConfig.cooldownHours ||
    popupConfigDraft.reminderDays !== popupConfig.reminderDays;

  async function movePopupCoupon(id: string, direction: "up" | "down") {
    if (reordering) return;
    const idx = popupCoupons.findIndex((c) => c.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= popupCoupons.length) return;

    const reordered = [...popupCoupons];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const withPriority = reordered.map((c, i) => ({ ...c, popupPriority: i + 1 }));
    setPopupCoupons(withPriority); // optimistic

    setReordering(true);
    try {
      await fetch("/api/admin/coupons/popup-reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((c) => c.id) }),
      });
    } catch {
      fetchPopupCoupons(); // revert on error
    } finally {
      setReordering(false);
    }
  }

  async function fetchData(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/coupons?${params}`);
      const json = await res.json();
      const data = json.data ?? {};
      setCoupons(data.coupons ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchData(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon? This action cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData(page);
        fetchPopupCoupons();
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  function getStatusBadge(c: Coupon): { variant: "success" | "default" | "danger"; label: string } {
    if (!c.isActive) return { variant: "default", label: "Inactive" };
    if (c.endDate && new Date(c.endDate) < new Date()) return { variant: "danger", label: "Expired" };
    if (c.usageLimit && c.usedCount >= c.usageLimit) return { variant: "danger", label: "Used Up" };
    return { variant: "success", label: "Active" };
  }

  function formatValue(c: Coupon): string {
    if (c.type === "FREE_SHIPPING") return "Free Shipping";
    if (c.type === "PERCENTAGE") return `${c.value}%`;
    return formatPrice(c.value);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Coupons</h1>
          <p className="text-sm text-muted">{total} total coupons</p>
        </div>
        <Link href="/admin/coupons/new">
          <Button>+ New Coupon</Button>
        </Link>
      </div>

      {/* Popup Settings */}
      <div className="bg-white border border-border rounded p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Pengaturan Popup Promosi</h2>
            <p className="text-xs text-muted mt-0.5">Atur cara voucher popup tampil ke customer.</p>
          </div>
          {popupConfigDirty && (
            <Button size="sm" onClick={savePopupConfig} loading={popupConfigSaving}>
              Simpan
            </Button>
          )}
        </div>

        {popupConfigLoading ? (
          <p className="text-xs text-muted">Memuat...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted mb-2">Mode Tampil</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="displayMode"
                    value="priority"
                    checked={popupConfigDraft.displayMode === "priority"}
                    onChange={() => setPopupConfigDraft((d) => ({ ...d, displayMode: "priority" }))}
                    className="accent-primary"
                  />
                  <span className="text-sm">Prioritas Manual</span>
                  <span className="text-[10px] text-muted">— tampilkan yang urutan paling atas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="displayMode"
                    value="rotation"
                    checked={popupConfigDraft.displayMode === "rotation"}
                    onChange={() => setPopupConfigDraft((d) => ({ ...d, displayMode: "rotation" }))}
                    className="accent-primary"
                  />
                  <span className="text-sm">Rotasi Otomatis</span>
                  <span className="text-[10px] text-muted">— ganti voucher secara berkala</span>
                </label>
              </div>
            </div>

            {popupConfigDraft.displayMode === "rotation" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted shrink-0">Ganti setiap</label>
                <input
                  type="number"
                  min={1}
                  value={popupConfigDraft.rotationMinutes}
                  onChange={(e) =>
                    setPopupConfigDraft((d) => ({
                      ...d,
                      rotationMinutes: Math.max(1, Number(e.target.value) || 30),
                    }))
                  }
                  className="w-20 h-8 px-2 border border-border rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted">menit</span>
              </div>
            )}

            <p className="text-[10px] text-muted">
              {popupConfigDraft.displayMode === "priority"
                ? "Popup selalu menampilkan voucher paling atas dari daftar urutan di bawah."
                : `Popup berganti otomatis setiap ${popupConfigDraft.rotationMinutes} menit — berputar dari atas ke bawah lalu ulang.`}
            </p>

            {/* Delay, Cooldown & Reminder */}
            <div className="border-t border-border pt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-muted mb-1.5">Delay Muncul</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={popupConfigDraft.delaySeconds}
                    onChange={(e) =>
                      setPopupConfigDraft((d) => ({
                        ...d,
                        delaySeconds: Math.max(0, Number(e.target.value) || 2),
                      }))
                    }
                    className="w-16 h-8 px-2 border border-border rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted">detik</span>
                </div>
                <p className="text-[10px] text-muted mt-1">Jeda sebelum popup pertama kali muncul.</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1.5">Cooldown Setelah Tutup</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={popupConfigDraft.cooldownHours}
                    onChange={(e) =>
                      setPopupConfigDraft((d) => ({
                        ...d,
                        cooldownHours: Math.max(1, Number(e.target.value) || 24),
                      }))
                    }
                    className="w-16 h-8 px-2 border border-border rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted">jam</span>
                </div>
                <p className="text-[10px] text-muted mt-1">Untuk voucher <strong>belum diklaim</strong>. Voucher yang sudah diklaim tidak muncul lagi selamanya.</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1.5">Reminder Kadaluarsa</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={popupConfigDraft.reminderDays}
                    onChange={(e) =>
                      setPopupConfigDraft((d) => ({
                        ...d,
                        reminderDays: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-16 h-8 px-2 border border-border rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted">hari</span>
                </div>
                <p className="text-[10px] text-muted mt-1">H-N sebelum kadaluarsa, popup muncul sekali lagi sebagai reminder. <strong>0</strong> = tidak ada reminder.</p>
              </div>
            </div>
          </div>
        )}

        {/* Popup coupon reorder list */}
        {popupCoupons.length > 0 && (
          <div className="border-t border-border pt-4 space-y-1.5">
            <p className="text-xs font-medium text-muted mb-2">Urutan Popup Coupon</p>
            {popupCoupons.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 bg-accent/40 rounded border border-border/60"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => movePopupCoupon(c.id, "up")}
                    disabled={idx === 0 || reordering}
                    className="text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Geser ke atas"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => movePopupCoupon(c.id, "down")}
                    disabled={idx === popupCoupons.length - 1 || reordering}
                    className="text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Geser ke bawah"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Rank */}
                <span className="text-[10px] font-bold text-muted w-4 shrink-0 text-center">{idx + 1}</span>

                {/* Code + title */}
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm font-medium">{c.code}</span>
                  {c.popupTitle && (
                    <span className="text-xs text-muted ml-2 truncate">{c.popupTitle}</span>
                  )}
                </div>

                {/* Status */}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0",
                  c.isActive ? "bg-green-100 text-green-700" : "bg-accent text-muted"
                )}>
                  {c.isActive ? "Aktif" : "Nonaktif"}
                </span>

                <Link href={`/admin/coupons/${c.id}`} className="text-[10px] text-primary hover:underline shrink-0">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}

        {!popupConfigLoading && popupCoupons.length === 0 && (
          <p className="text-xs text-muted border-t border-border pt-4">
            Belum ada coupon yang diaktifkan sebagai popup. Aktifkan <b>Popup Promosi</b> di form coupon untuk menampilkannya di sini.
          </p>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Coupon code..."
            className="h-9 px-3 border border-border rounded text-sm w-72 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-4 bg-accent rounded text-sm font-medium hover:bg-accent/70 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Code</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Type</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Value</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Used</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Period</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const badge = getStatusBadge(c);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/coupons/${c.id}`} className="font-mono font-medium text-primary hover:underline">
                          {c.code}
                        </Link>
                        {c.showAsPopup && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded-sm uppercase tracking-wide shrink-0">
                            <span className="w-1 h-1 rounded-full bg-warning" />
                            Popup {c.popupPriority != null ? `#${c.popupPriority}` : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent uppercase">
                        {TYPE_LABELS[c.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatValue(c)}</td>
                    <td className="px-5 py-3 text-right text-muted text-xs">
                      {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {c.startDate
                        ? `${formatDateTime(c.startDate).slice(0, 10)} — ${c.endDate ? formatDateTime(c.endDate).slice(0, 10) : "∞"}`
                        : "No period"}
                    </td>
                    <td className="px-5 py-3"><Badge variant={badge.variant} size="sm">{badge.label}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/coupons/${c.id}`}>
                          <button className="text-xs text-primary hover:underline">Edit</button>
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="text-xs text-destructive hover:underline disabled:opacity-50"
                        >
                          {deleting === c.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">
                    {loading ? "Loading..." : "No coupons found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && <button onClick={() => fetchData(page - 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Previous</button>}
              {page < totalPages && <button onClick={() => fetchData(page + 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Next</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
