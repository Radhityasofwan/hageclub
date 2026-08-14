"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REGION_GROUPS } from "@/lib/regions";

interface Props {
  freeShippingThreshold: string;
  freeShippingRegions: string[];
}

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white";

export function StoreSettingsForm({ freeShippingThreshold, freeShippingRegions }: Props) {
  const [threshold, setThreshold] = useState(freeShippingThreshold);
  const [regions, setRegions] = useState<string[]>(freeShippingRegions);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function toggleRegion(key: string) {
    setRegions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(threshold);
    if (!Number.isFinite(value) || value < 0) {
      showToast("error", "Nilai harus berupa angka positif.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            { key: "store_free_shipping_threshold", value: String(Math.round(value)) },
            { key: "store_free_shipping_regions", value: JSON.stringify(regions) },
          ],
        }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast("success", "Pengaturan disimpan.");
      } else {
        showToast("error", json.message ?? "Gagal menyimpan pengaturan.");
      }
    } catch {
      showToast("error", "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  const formatted =
    Number.isFinite(Number(threshold)) && Number(threshold) >= 0
      ? `Rp${Number(threshold).toLocaleString("id-ID")}`
      : "—";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {toast && (
        <div
          className={`text-sm px-4 py-3 rounded-sm border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white border border-border rounded-sm divide-y divide-border">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold">Pengiriman</h2>
        </div>

        <div className="px-5 py-4 space-y-1.5">
          <label className="text-sm font-medium" htmlFor="threshold">
            Minimum Order Gratis Ongkir (Rp)
          </label>
          <input
            id="threshold"
            type="number"
            min="0"
            step="1000"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className={inputCls}
            placeholder="500000"
          />
          <p className="text-xs text-muted">
            Subtotal minimum untuk mendapat gratis ongkos kirim. Tampil: <strong>{formatted}</strong>
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Batasan Wilayah Gratis Ongkir</p>
            <p className="text-xs text-muted mt-0.5">
              Pilih wilayah yang dapat menikmati gratis ongkir. Kosongkan untuk semua wilayah.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {REGION_GROUPS.map((rg) => (
              <label key={rg.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regions.includes(rg.key)}
                  onChange={() => toggleRegion(rg.key)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">{rg.label}</span>
              </label>
            ))}
          </div>

          {regions.length > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-primary font-medium">
                {regions.length} wilayah dipilih
              </p>
              <button
                type="button"
                onClick={() => setRegions([])}
                className="text-xs text-muted hover:text-destructive transition-colors"
              >
                Hapus semua
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted italic">Berlaku untuk semua wilayah.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
