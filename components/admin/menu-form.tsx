"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadField } from "@/components/admin/upload-field";
import { SocialLinksField } from "@/components/admin/social-links-field";
import type { SocialLink } from "@/components/ui/social-icon";

export type MenuFlags = {
  home: boolean;
  categories: boolean;
  blog: boolean;
  about: boolean;
  contact: boolean;
  social: boolean;
  account: boolean;
};

export const MENU_ITEM_KEYS: (keyof MenuFlags)[] = [
  "home",
  "categories",
  "blog",
  "about",
  "contact",
  "social",
  "account",
];

const MENU_GROUPS: {
  label: string;
  description: string;
  items: { key: keyof MenuFlags; label: string; hint: string }[];
}[] = [
  {
    label: "Navigasi",
    description: "Item menu utama di sidebar (drawer) saat tombol hamburger dibuka.",
    items: [
      { key: "home", label: "Beranda", hint: "Link ke halaman utama." },
      { key: "categories", label: "Kategori", hint: "Section judul + daftar kategori produk." },
      { key: "blog", label: "Blog", hint: "Link ke halaman blog." },
      { key: "about", label: "Tentang Kami", hint: "Link ke halaman tentang brand." },
      { key: "contact", label: "Kontak", hint: "Link ke halaman kontak." },
    ],
  },
  {
    label: "Bagian Bawah Sidebar",
    description: "Elemen di bagian bawah drawer.",
    items: [
      { key: "social", label: "Ikon Sosial Media", hint: "Tampilkan ikon media sosial brand." },
      { key: "account", label: "Akun / Login", hint: "Link akun atau tombol masuk." },
    ],
  },
];

interface MenuFormProps {
  initial: Partial<MenuFlags>;
  logoUrl?: string;
  socialLinks?: SocialLink[];
}

export function MenuForm({ initial, logoUrl: initialLogoUrl = "", socialLinks: initialSocialLinks = [] }: MenuFormProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks);
  const [flags, setFlags] = useState<MenuFlags>(() => {
    const all = {} as MenuFlags;
    for (const key of MENU_ITEM_KEYS) {
      all[key] = initial[key] ?? true;
    }
    return all;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function toggle(key: keyof MenuFlags) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...flags, logoUrl: logoUrl || null, socialLinks: JSON.stringify(socialLinks) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.message ?? "Gagal menyimpan" });
        return;
      }
      setMessage({ type: "success", text: "Menu berhasil disimpan" });
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`px-4 py-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Logo Sidebar */}
      <div className="bg-white border border-border rounded p-5">
        <h2 className="text-sm font-semibold text-primary mb-0.5">Logo Sidebar</h2>
        <p className="text-xs text-muted mb-4">
          Tampil di header drawer menu (hamburger). Gunakan logo versi gelap — background sidebar putih.
          Kosongkan untuk tampilkan teks nama brand.
        </p>

        {/* Live preview */}
        <div className="mb-4 rounded border border-border overflow-hidden">
          <div className="bg-white border-b border-border h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Preview logo sidebar"
                  className="h-7 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <span className="text-sm font-bold tracking-wider text-primary">HAGE CLUB</span>
              )}
            </div>
            <div className="w-6 h-4 flex flex-col justify-between shrink-0 opacity-30">
              <span className="block h-px bg-primary rounded" />
              <span className="block h-px bg-primary rounded" />
              <span className="block h-px bg-primary rounded" />
            </div>
          </div>
          <p className="text-[10px] text-muted text-center py-1.5 bg-accent/40">Preview header sidebar</p>
        </div>

        <UploadField
          value={logoUrl}
          onChange={setLogoUrl}
          folder="brand"
          previewClassName="w-28 h-10"
          hint="Rekomendasi: PNG/SVG transparan, rasio landscape. Tinggi ideal 40–60 px."
        />
      </div>

      {MENU_GROUPS.map((group) => (
        <div key={group.label} className="bg-white border border-border rounded p-5">
          <h2 className="text-sm font-semibold text-primary">{group.label}</h2>
          <p className="text-xs text-muted mb-2">{group.description}</p>
          <div className="divide-y divide-border">
            {group.items.map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between gap-4 py-3 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted">{item.hint}</p>
                </div>
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={flags[item.key]}
                    onChange={() => toggle(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-accent rounded-full peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white border border-border rounded p-5">
        <SocialLinksField value={socialLinks} onChange={setSocialLinks} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Simpan
        </Button>
      </div>
    </form>
  );
}
