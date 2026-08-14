"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadField } from "@/components/admin/upload-field";
import { PAYMENT_METHODS, SHIPPING_COURIERS, type FooterPaymentMethod } from "@/lib/footer-catalog";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkItem {
  label: string;
  href: string;
}

interface SocialItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string | null;
}

interface MethodConfig {
  id: string;
  imageUrl?: string | null;
}

interface FooterData {
  // Brand
  tagline: string;
  copyright: string;
  madeWithCare: string;
  socialLinks: SocialItem[];
  // Navigasi
  navHeading: string;
  navShowProducts: boolean;
  navShowCategories: boolean;
  navLinks: LinkItem[];
  // Payment & Shipping
  paymentHeading: string;
  paymentMethods: MethodConfig[];
  shippingHeading: string;
  shippingCouriers: MethodConfig[];
  // Legal
  legalHeading: string;
  legalShowCms: boolean;
  legalLinks: LinkItem[];
}

// Key lama arsitektur kolom 1–4 — dihapus dari DB saat save
const LEGACY_KEYS = [
  "footer_col1_heading",
  "footer_col1_show_categories",
  "footer_col1_links",
  "footer_col2_heading",
  "footer_col2_show_cms",
  "footer_col2_show_blog",
  "footer_col2_links",
  "footer_col3_heading",
  "footer_col3_show_faq",
  "footer_col3_show_contact",
  "footer_col3_links",
  "footer_col4_heading",
  "footer_col4_links",
];

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "facebook",  label: "Facebook" },
  { value: "twitter",   label: "Twitter / X" },
  { value: "youtube",   label: "YouTube" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "shopee",    label: "Shopee" },
  { value: "tokopedia", label: "Tokopedia" },
  { value: "email",     label: "Email" },
  { value: "other",     label: "Lainnya" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white";
const textareaCls =
  "w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white resize-none";

function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 relative shrink-0 w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
      <div>
        <span className="text-sm font-medium leading-tight">{label}</span>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

function SectionCard({
  title, subtitle, children, badge,
}: { title: string; subtitle?: string; children: React.ReactNode; badge?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-border rounded-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-accent border border-border rounded text-muted uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        <svg
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && <div className="border-t border-border divide-y divide-border">{children}</div>}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4 space-y-4">{children}</div>;
}

function LinkListEditor({
  links, onChange, placeholder = "Contoh: /halaman",
}: { links: LinkItem[]; onChange: (v: LinkItem[]) => void; placeholder?: string }) {
  function add() { onChange([...links, { label: "", href: "" }]); }
  function update(i: number, f: "label" | "href", v: string) {
    onChange(links.map((l, idx) => idx === i ? { ...l, [f]: v } : l));
  }
  function remove(i: number) { onChange(links.filter((_, idx) => idx !== i)); }

  return (
    <div className="px-5 py-4">
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text" value={link.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label"
              className={`${inputCls} flex-1`}
            />
            <input
              type="text" value={link.href}
              onChange={(e) => update(i, "href", e.target.value)}
              placeholder={placeholder}
              className={`${inputCls} flex-[2]`}
            />
            <button
              type="button" onClick={() => remove(i)}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm border border-border text-muted hover:text-red-500 hover:border-red-300 transition-colors"
              aria-label="Hapus"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button" onClick={add}
        className="mt-3 h-8 px-3 text-xs font-medium border border-dashed border-border rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 text-muted"
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
          <path d="M6 1v10M1 6h10" strokeLinecap="round" />
        </svg>
        Tambah Link
      </button>
    </div>
  );
}

function SocialListEditor({
  links, onChange,
}: { links: SocialItem[]; onChange: (v: SocialItem[]) => void }) {
  function add() {
    onChange([...links, { id: crypto.randomUUID(), platform: "instagram", label: "", url: "", icon: null }]);
  }
  function update(i: number, f: keyof SocialItem, v: string | null) {
    onChange(links.map((l, idx) => idx === i ? { ...l, [f]: v } : l));
  }
  function remove(i: number) { onChange(links.filter((_, idx) => idx !== i)); }

  return (
    <div className="px-5 py-4">
      <div className="space-y-3">
        {links.map((link, i) => (
          <div key={link.id} className="flex items-center gap-2">
            <select
              value={link.platform}
              onChange={(e) => update(i, "platform", e.target.value)}
              className="h-9 border border-border rounded-sm px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white w-36 shrink-0"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              type="text" value={link.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label (contoh: @hageclub)"
              className={`${inputCls} flex-1`}
            />
            <input
              type="text" value={link.url}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="URL atau no. WA"
              className={`${inputCls} flex-[2]`}
            />
            <button
              type="button" onClick={() => remove(i)}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm border border-border text-muted hover:text-red-500 hover:border-red-300 transition-colors"
              aria-label="Hapus"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button" onClick={add}
        className="mt-3 h-8 px-3 text-xs font-medium border border-dashed border-border rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 text-muted"
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
          <path d="M6 1v10M1 6h10" strokeLinecap="round" />
        </svg>
        Tambah Akun Sosial
      </button>
      <p className="mt-2 text-xs text-muted">
        Kosongkan daftar ini untuk menggunakan social links dari pengaturan Brand.
      </p>
    </div>
  );
}

/** Daftar metode pembayaran / ekspedisi: checkbox per item + upload logo opsional. */
function MethodListEditor({
  methods, catalog, onChange,
}: {
  methods: MethodConfig[];
  catalog: FooterPaymentMethod[];
  onChange: (v: MethodConfig[]) => void;
}) {
  function toggle(id: string, enabled: boolean) {
    onChange(enabled ? [...methods, { id, imageUrl: null }] : methods.filter((m) => m.id !== id));
  }
  function setImage(id: string, url: string) {
    onChange(methods.map((m) => (m.id === id ? { ...m, imageUrl: url || null } : m)));
  }

  return (
    <div className="px-5 py-4 space-y-2">
      {catalog.map((c) => {
        const enabled = methods.some((m) => m.id === c.id);
        const imageUrl = methods.find((m) => m.id === c.id)?.imageUrl ?? "";
        return (
          <div key={c.id} className="border border-border rounded-sm">
            <button
              type="button"
              onClick={() => toggle(c.id, !enabled)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
            >
              <span
                className={`shrink-0 w-4 h-4 flex items-center justify-center rounded-[3px] border transition-colors ${
                  enabled ? "bg-primary border-primary" : "bg-white border-border"
                }`}
              >
                {enabled && (
                  <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" className="w-2.5 h-2.5">
                    <path d="M1.5 5.2l2.2 2.3 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</span>
            </button>
            {enabled && (
              <div className="px-3 pb-3">
                <UploadField
                  value={imageUrl}
                  onChange={(url) => setImage(c.id, url)}
                  folder="uploads"
                  previewClassName="w-10 h-8"
                  hint="Logo (opsional). Kosongkan untuk memakai chip teks warna brand."
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────

export function FooterSettingsForm(initial: FooterData) {
  const [data, setData] = useState<FooterData>(initial);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function set<K extends keyof FooterData>(key: K, value: FooterData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Validasi link custom
    const allLinks = [...data.navLinks, ...data.legalLinks];
    for (const l of allLinks) {
      if ((l.label && !l.href) || (!l.label && l.href)) {
        showToast("error", "Setiap link harus punya label dan URL.");
        return;
      }
    }
    for (const s of data.socialLinks) {
      if (!s.label || !s.url) {
        showToast("error", "Setiap akun sosial harus punya label dan URL.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            { key: "footer_tagline",            value: data.tagline.trim()      || null },
            { key: "footer_copyright",           value: data.copyright.trim()    || null },
            { key: "footer_made_with_care",      value: data.madeWithCare.trim() || null },
            { key: "footer_social_links",        value: data.socialLinks.length  ? JSON.stringify(data.socialLinks)  : null },
            { key: "footer_nav_heading",         value: data.navHeading.trim()   || null },
            { key: "footer_nav_show_products",   value: data.navShowProducts     ? "true" : "false" },
            { key: "footer_nav_show_categories", value: data.navShowCategories   ? "true" : "false" },
            { key: "footer_nav_links",           value: data.navLinks.length     ? JSON.stringify(data.navLinks)     : null },
            { key: "footer_payment_heading",     value: data.paymentHeading.trim()    || null },
            { key: "footer_payment_methods",     value: JSON.stringify(data.paymentMethods) },
            { key: "footer_shipping_heading",    value: data.shippingHeading.trim()   || null },
            { key: "footer_shipping_couriers",   value: JSON.stringify(data.shippingCouriers) },
            { key: "footer_legal_heading",       value: data.legalHeading.trim() || null },
            { key: "footer_legal_show_cms",      value: data.legalShowCms        ? "true" : "false" },
            { key: "footer_legal_links",         value: data.legalLinks.length   ? JSON.stringify(data.legalLinks)   : null },
          ],
          deleteKeys: LEGACY_KEYS,
        }),
      });
      const json = await res.json();
      if (res.ok) showToast("success", "Footer berhasil disimpan.");
      else showToast("error", json.message ?? "Gagal menyimpan.");
    } catch {
      showToast("error", "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {toast && (
        <div className={`text-sm px-4 py-3 rounded-sm border ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {toast.message}
        </div>
      )}

      {/* Brand */}
      <SectionCard title="Brand" subtitle="Logo, tagline, teks bawah footer, dan media sosial.">
        <FieldRow label="Tagline" hint="Teks deskripsi di bawah logo.">
          <textarea rows={2} value={data.tagline} onChange={(e) => set("tagline", e.target.value)}
            className={textareaCls} placeholder="Puncak Kenyamanan Terbaik..." />
        </FieldRow>
        <FieldRow label="Teks Copyright" hint="Tahun saat ini ditambahkan otomatis di depan.">
          <input type="text" value={data.copyright} onChange={(e) => set("copyright", e.target.value)}
            className={inputCls} placeholder="HAGE CLUB. All rights reserved." />
        </FieldRow>
        <FieldRow label="Teks &quot;Made with care&quot;" hint="Teks di pojok kanan bawah footer.">
          <input type="text" value={data.madeWithCare} onChange={(e) => set("madeWithCare", e.target.value)}
            className={inputCls} placeholder="Dibuat dengan cinta di Indonesia" />
        </FieldRow>
        <div className="px-5 pt-2 pb-1">
          <p className="text-sm font-medium">Media Sosial</p>
          <p className="text-xs text-muted mt-0.5">Tampil sebagai ikon di kolom brand footer.</p>
        </div>
        <SocialListEditor links={data.socialLinks} onChange={(v) => set("socialLinks", v)} />
      </SectionCard>

      {/* Navigasi */}
      <SectionCard title="Navigasi" subtitle="Link internal: produk, kategori, dan link tambahan.">
        <FieldRow label="Judul Kolom">
          <input type="text" value={data.navHeading} onChange={(e) => set("navHeading", e.target.value)}
            className={inputCls} placeholder="Belanja" />
        </FieldRow>
        <ToggleRow>
          <Toggle checked={data.navShowProducts} onChange={(v) => set("navShowProducts", v)}
            label="Tampilkan link Semua Produk" hint="Link ke /shop" />
          <Toggle checked={data.navShowCategories} onChange={(v) => set("navShowCategories", v)}
            label="Tampilkan kategori produk aktif"
            hint="Menampilkan semua kategori yang aktif di toko secara otomatis." />
        </ToggleRow>
        <div className="px-5 pt-2 pb-1">
          <p className="text-sm font-medium">Link Tambahan</p>
          <p className="text-xs text-muted mt-0.5">Link ekstra yang muncul setelah kategori.</p>
        </div>
        <LinkListEditor links={data.navLinks} onChange={(v) => set("navLinks", v)} />
      </SectionCard>

      {/* Payment & Shipping */}
      <SectionCard title="Payment & Shipping" subtitle="Logo metode pembayaran dan ekspedisi.">
        <FieldRow label="Judul Metode Pembayaran">
          <input type="text" value={data.paymentHeading} onChange={(e) => set("paymentHeading", e.target.value)}
            className={inputCls} placeholder="Metode Pembayaran" />
        </FieldRow>
        <div className="px-5 pt-2 pb-1">
          <p className="text-sm font-medium">Metode Pembayaran</p>
          <p className="text-xs text-muted mt-0.5">
            Centang metode yang ingin ditampilkan. Kosongkan semua untuk menyembunyikan bagian ini.
          </p>
        </div>
        <MethodListEditor
          methods={data.paymentMethods}
          catalog={PAYMENT_METHODS}
          onChange={(v) => set("paymentMethods", v)}
        />
        <FieldRow label="Judul Metode Pengiriman">
          <input type="text" value={data.shippingHeading} onChange={(e) => set("shippingHeading", e.target.value)}
            className={inputCls} placeholder="Metode Pengiriman" />
        </FieldRow>
        <div className="px-5 pt-2 pb-1">
          <p className="text-sm font-medium">Ekspedisi</p>
          <p className="text-xs text-muted mt-0.5">
            Centang ekspedisi yang ingin ditampilkan. Kosongkan semua untuk menyembunyikan bagian ini.
          </p>
        </div>
        <MethodListEditor
          methods={data.shippingCouriers}
          catalog={SHIPPING_COURIERS}
          onChange={(v) => set("shippingCouriers", v)}
        />
      </SectionCard>

      {/* Legal */}
      <SectionCard title="Legal" subtitle="Halaman kebijakan dan syarat.">
        <FieldRow label="Judul Kolom">
          <input type="text" value={data.legalHeading} onChange={(e) => set("legalHeading", e.target.value)}
            className={inputCls} placeholder="Terms & Conditions" />
        </FieldRow>
        <ToggleRow>
          <Toggle checked={data.legalShowCms} onChange={(v) => set("legalShowCms", v)}
            label="Tampilkan halaman CMS"
            hint="Halaman statis (About, Privacy Policy, dll.) yang dicentang 'Tampil di Footer' akan muncul otomatis." />
        </ToggleRow>
        <div className="px-5 pt-2 pb-1">
          <p className="text-sm font-medium">Link Tambahan</p>
        </div>
        <LinkListEditor links={data.legalLinks} onChange={(v) => set("legalLinks", v)} />
      </SectionCard>

      <div className="flex justify-end pt-1">
        <button
          type="submit" disabled={saving}
          className="h-9 px-6 bg-primary text-white text-sm font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Semua"}
        </button>
      </div>
    </form>
  );
}
