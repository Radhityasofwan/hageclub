"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { REGION_GROUPS } from "@/lib/regions";

type ScopeType = "all" | "category" | "product";

interface CategoryOption {
  id: string;
  name: string;
  parent: { id: string; name: string } | null;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

interface CouponFormData {
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  applicableCategory: string | null;
  applicableProduct: string | null;
  showAsPopup: boolean;
  popupTitle: string | null;
  allowedRegions: string[];
}

type CouponFormInitial = Omit<CouponFormData, "allowedRegions"> & {
  id?: string;
  allowedRegions?: string | string[] | null;
};

interface CouponFormProps {
  initialData?: CouponFormInitial;
  onSuccess?: () => void;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function fromDatetimeLocal(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

function deriveScope(data?: { applicableCategory?: string | null; applicableProduct?: string | null }): ScopeType {
  if (data?.applicableProduct) return "product";
  if (data?.applicableCategory) return "category";
  return "all";
}

export function CouponForm({ initialData, onSuccess }: CouponFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState(false);

  function parseInitialRegions(raw?: string | string[] | null): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }

  const [form, setForm] = useState<CouponFormData>(
    initialData
      ? { ...initialData, allowedRegions: parseInitialRegions(initialData.allowedRegions) }
      : {
          code: "",
          type: "PERCENTAGE",
          value: 0,
          minPurchase: null,
          maxDiscount: null,
          usageLimit: null,
          startDate: null,
          endDate: null,
          isActive: true,
          applicableCategory: null,
          applicableProduct: null,
          showAsPopup: false,
          popupTitle: null,
          allowedRegions: [],
        }
  );

  // Applicable To state
  const [scopeType, setScopeType] = useState<ScopeType>(deriveScope(initialData));
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  // Load categories on mount
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []));
  }, []);

  // Resolve product name when editing existing coupon with applicableProduct
  useEffect(() => {
    if (initialData?.applicableProduct) {
      fetch(`/api/admin/products/${initialData.applicableProduct}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.name) setSelectedProductName(json.data.name);
        })
        .catch(() => {});
    }
  }, [initialData?.applicableProduct]);

  // Debounced product search
  useEffect(() => {
    if (scopeType !== "product" || productSearch.trim().length < 2) {
      setProductResults([]);
      return;
    }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setProductSearchLoading(true);
      try {
        const res = await fetch(
          `/api/admin/products?search=${encodeURIComponent(productSearch)}&limit=8&status=PUBLISHED`
        );
        const json = await res.json();
        setProductResults(json.data?.products ?? []);
      } catch {
        // silent
      } finally {
        setProductSearchLoading(false);
      }
    }, 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [productSearch, scopeType]);

  const update = useCallback(<K extends keyof CouponFormData>(field: K, value: CouponFormData[K]) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "type") {
        if (value === "FREE_SHIPPING") {
          updated.maxDiscount = null;
          updated.value = 0;
        } else {
          updated.allowedRegions = [];
        }
      }
      return updated;
    });
  }, []);

  function handleScopeChange(scope: ScopeType) {
    setScopeType(scope);
    if (scope === "all") {
      update("applicableCategory", null);
      update("applicableProduct", null);
      setSelectedProductName(null);
      setProductSearch("");
      setProductResults([]);
    } else if (scope === "category") {
      update("applicableProduct", null);
      setSelectedProductName(null);
      setProductSearch("");
      setProductResults([]);
    } else if (scope === "product") {
      update("applicableCategory", null);
    }
  }

  function generateCode() {
    if (manualCode) return;
    const prefix = form.type === "PERCENTAGE" ? "DISC" : form.type === "FIXED" ? "POT" : "GRATIS";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    update("code", `${prefix}${random}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (scopeType === "category" && !form.applicableCategory) {
      setError("Pilih kategori yang berlaku untuk kupon ini.");
      return;
    }
    if (scopeType === "product" && !form.applicableProduct) {
      setError("Pilih produk yang berlaku untuk kupon ini.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/coupons/${initialData.id}`
        : "/api/admin/coupons";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Failed to save coupon");
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/coupons");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Basic */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Coupon Details</h2>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Coupon Code"
              value={form.code}
              onChange={(e) => {
                setManualCode(true);
                update("code", e.target.value.toUpperCase());
              }}
              placeholder="e.g., SUMMER25"
              required
            />
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={generateCode}
              className="h-10 px-3 bg-accent rounded text-xs text-muted hover:text-primary"
            >
              Generate
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted -mt-2">Code will be stored in uppercase</p>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Discount Type"
            options={[
              { value: "PERCENTAGE", label: "Percentage (%)" },
              { value: "FIXED", label: "Fixed (IDR)" },
              { value: "FREE_SHIPPING", label: "Free Shipping" },
            ]}
            value={form.type}
            onChange={(e) => update("type", e.target.value as CouponFormData["type"])}
          />
          {form.type !== "FREE_SHIPPING" && (
            <Input
              label={form.type === "PERCENTAGE" ? "Discount (%)" : "Discount (IDR)"}
              type="number"
              value={form.value}
              onChange={(e) => update("value", Number(e.target.value))}
              required
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Purchase (IDR)"
            type="number"
            value={form.minPurchase ?? ""}
            onChange={(e) => update("minPurchase", e.target.value ? Number(e.target.value) : null)}
          />
          {form.type === "PERCENTAGE" && (
            <Input
              label="Max Discount (IDR)"
              type="number"
              value={form.maxDiscount ?? ""}
              onChange={(e) => update("maxDiscount", e.target.value ? Number(e.target.value) : null)}
            />
          )}
        </div>

        <Input
          label="Usage Limit"
          type="number"
          value={form.usageLimit ?? ""}
          onChange={(e) => update("usageLimit", e.target.value ? Number(e.target.value) : null)}
          helperText="Leave empty for unlimited"
        />
      </section>

      {/* Period */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Validity Period</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="datetime-local"
            value={toDatetimeLocal(form.startDate)}
            onChange={(e) => update("startDate", fromDatetimeLocal(e.target.value))}
          />
          <Input
            label="End Date"
            type="datetime-local"
            value={toDatetimeLocal(form.endDate)}
            onChange={(e) => update("endDate", fromDatetimeLocal(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="isActive" className="text-sm cursor-pointer">
            Active
          </label>
        </div>
      </section>

      {/* Applicable To */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase">Berlaku Untuk</h2>
          <p className="text-xs text-muted mt-0.5">
            Batasi diskon agar hanya berlaku pada kategori atau produk tertentu.
          </p>
        </div>

        <div className="space-y-3">
          {(
            [
              { value: "all", label: "Semua produk", desc: "Diskon berlaku untuk semua produk di keranjang" },
              { value: "category", label: "Kategori tertentu", desc: "Hanya produk dalam satu kategori yang dipilih" },
              { value: "product", label: "Produk tertentu", desc: "Hanya berlaku untuk 1 produk spesifik" },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="couponScope"
                checked={scopeType === opt.value}
                onChange={() => handleScopeChange(opt.value)}
                className="mt-0.5 accent-primary shrink-0"
              />
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{opt.label}</p>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Category picker */}
        {scopeType === "category" && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Pilih Kategori</label>
            <select
              value={form.applicableCategory ?? ""}
              onChange={(e) => update("applicableCategory", e.target.value || null)}
              className="w-full h-10 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="">— Pilih kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent ? `${c.parent.name} › ${c.name}` : c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-muted mt-1.5">Memuat kategori...</p>
            )}
          </div>
        )}

        {/* Product search */}
        {scopeType === "product" && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Pilih Produk</label>
            {form.applicableProduct && selectedProductName ? (
              <div className="flex items-center justify-between px-3 py-2.5 border border-primary/40 rounded bg-primary/5">
                <div>
                  <p className="text-sm font-medium">{selectedProductName}</p>
                  <p className="text-[10px] text-muted font-mono mt-0.5">{form.applicableProduct}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    update("applicableProduct", null);
                    setSelectedProductName(null);
                    setProductSearch("");
                    setProductResults([]);
                  }}
                  className="text-xs text-muted hover:text-destructive px-2 py-1 hover:bg-destructive/10 rounded transition-colors shrink-0"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ketik nama produk..."
                  className="w-full h-10 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoComplete="off"
                />
                {productSearchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border border-muted border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {productResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-border rounded shadow-lg z-20 divide-y divide-border max-h-52 overflow-y-auto">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          update("applicableProduct", p.id);
                          setSelectedProductName(p.name);
                          setProductSearch("");
                          setProductResults([]);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors"
                      >
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted font-mono">{p.sku}</p>
                      </button>
                    ))}
                  </div>
                )}
                {productSearch.length >= 2 && !productSearchLoading && productResults.length === 0 && (
                  <p className="text-xs text-muted mt-1.5">Produk tidak ditemukan</p>
                )}
                {productSearch.length < 2 && productSearch.length > 0 && (
                  <p className="text-xs text-muted mt-1.5">Ketik minimal 2 karakter untuk mencari</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Batasan Wilayah — hanya tampil untuk FREE_SHIPPING */}
      {form.type === "FREE_SHIPPING" && (
        <section className="bg-white border border-border rounded p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-widest uppercase">Batasan Wilayah</h2>
            <p className="text-xs text-muted mt-0.5">
              Centang wilayah yang boleh menggunakan gratis ongkir ini. Kosongkan untuk berlaku ke semua wilayah.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REGION_GROUPS.map((region) => {
              const checked = form.allowedRegions.includes(region.key);
              return (
                <label
                  key={region.key}
                  className={`flex items-center gap-2.5 px-3 py-2 border rounded cursor-pointer transition-colors text-sm ${
                    checked
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? form.allowedRegions.filter((k) => k !== region.key)
                        : [...form.allowedRegions, region.key];
                      update("allowedRegions", next);
                    }}
                    className="accent-primary shrink-0"
                  />
                  {region.label}
                </label>
              );
            })}
          </div>

          {form.allowedRegions.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted">
                {form.allowedRegions.length} wilayah dipilih — hanya pelanggan di wilayah ini yang dapat menggunakan kupon.
              </p>
              <button
                type="button"
                onClick={() => update("allowedRegions", [])}
                className="text-muted hover:text-destructive underline transition-colors ml-4 shrink-0"
              >
                Hapus semua
              </button>
            </div>
          )}

          {form.allowedRegions.length === 0 && (
            <p className="text-xs text-warning font-medium">
              ⚠ Tidak ada batasan wilayah — gratis ongkir berlaku untuk semua wilayah Indonesia.
            </p>
          )}
        </section>
      )}

      {/* Popup Promo */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-widest uppercase">Popup Promosi</h2>
            <p className="text-xs text-muted mt-0.5">
              Tampilkan voucher ini sebagai popup floating di website — customer login untuk lihat kode.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-0.5">
            <div
              onClick={() => update("showAsPopup", !form.showAsPopup)}
              className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${
                form.showAsPopup ? "bg-primary" : "bg-border"
              }`}
              style={{ height: "22px" }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                  form.showAsPopup ? "translate-x-[18px]" : ""
                }`}
                style={{ width: "18px", height: "18px" }}
              />
            </div>
            <span className="text-sm font-medium">
              {form.showAsPopup ? "Aktif" : "Nonaktif"}
            </span>
          </label>
        </div>

        {form.showAsPopup && (
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Judul Popup <span className="text-muted/60">(maks. 80 karakter)</span>
              </label>
              <input
                type="text"
                value={form.popupTitle ?? ""}
                onChange={(e) => update("popupTitle", e.target.value || null)}
                maxLength={80}
                placeholder="contoh: Flash Deal — Hari Ini Saja!"
                className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted mt-1">
                Kosongkan untuk pakai judul default &quot;Promo Terbatas&quot;.
              </p>
            </div>

            <div className="bg-accent/50 border border-border rounded p-3 text-xs text-muted space-y-1">
              <p className="font-semibold text-primary text-[11px] uppercase tracking-wide">Catatan Popup</p>
              <p>• Popup muncul setelah 1,5 detik — hanya 1 promo popup aktif sekaligus.</p>
              <p>• Urutan prioritas diatur langsung di halaman daftar coupon via tombol ↑↓.</p>
              <p>• Kode voucher baru terlihat setelah customer login &amp; klik Klaim.</p>
              <p>• Kuota pakai <b>Usage Limit</b> di atas; batas waktu pakai <b>End Date</b>.</p>
              <p>• Tambahkan <b>Usage Limit</b> untuk efek kelangkaan (progress bar tampil).</p>
              <p>• Countdown timer otomatis tampil jika sisa waktu &lt; 24 jam.</p>
            </div>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}
