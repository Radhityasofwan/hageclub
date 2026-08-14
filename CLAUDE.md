# HAGE CLUB — Developer Guide

E-commerce Next.js 14 (App Router) dengan sistem i18n custom (id default, en target). Semua teks UI harus melalui sistem translate ini — JANGAN menulis string hardcoded di JSX.

## i18n — Cara Pakai

**File dictionary:** `messages/id.json` (sumber utama) dan `messages/en.json` (terjemahan). Keduanya harus punya key yang sama — setiap key baru di id.json WAJIB ditambahkan juga di en.json.

**Server Component** (async):
```tsx
import { getI18n } from "@/lib/i18n/server";

export default async function Page() {
  const { t, locale } = await getI18n();
  return <h1>{t("shop.title")}</h1>;
}
```

**Client Component:**
```tsx
"use client";
import { useI18n } from "@/lib/i18n/client";

export function Component() {
  const { t } = useI18n();
  return <button aria-label={t("header.openMenu")}>{t("nav.shop")}</button>;
}
```

**Interpolasi parameter:**
```json
// messages/id.json
{ "shop": { "productsFound": "{count} produk" } }
```
```tsx
t("shop.productsFound", { count: 12 }) // → "12 produk"
```
Plural Inggris: `"{count} product{count}"` → "1 product" / "2 products" (suffix `{count}` dipakai sebagai trick plural).

**Formatting uang/tanggal:** `formatPrice(value, "IDR", locale)` dan `formatDate(date, locale)` — ambil `locale` dari `getI18n()`/`useI18n()`, jangan hardcode `"id-ID"`.

**LanguageSwitcher:** sudah terpasang di header (icon globe) dan footer (ID | EN). Preferensi disimpan di cookie `NEXT_LOCALE`.

## Aturan Penting

1. **Halaman yang memakai `getI18n()` WAJIB dynamic render** — jangan tambahkan `dynamic = "force-static"` (locale terkunci "id" saat build). Pola yang sudah benar:
   ```tsx
   export const dynamic = "force-dynamic";
   ```
   (getI18n membaca header `x-locale` yang diset middleware dari cookie.)

2. **Event handler hanya di client component.** Komponen dengan `onClick`/`useState` wajib `"use client"` + `useI18n()`; jangan render `<button onClick>` langsung di server component — pindah ke client component.

3. **Content (bukan UI text) boleh hardcoded:** nama brand (Polo, Hoodie), teks artikel blog, deskripsi produk/kategori dari DB, paragraf cerita di halaman About. Yang wajib via t(): label, tombol, placeholder, aria-label, judul section, pesan error/validasi, empty state, breadcrumb.

4. **Metadata** tetap Indonesia (strategi saat ini); hanya UI text yang di-translate.

5. **Belum termigrasi** (biarkan seperti adanya, jangan diubah tanpa instruksi): `lib/validation.ts` (Zod), `lib/email-templates.ts`, komponen admin, string content.

## Alur Teknis

- `middleware.ts` membaca cookie `NEXT_LOCALE` → set header `x-locale`
- `lib/i18n/server.ts` → `getI18n()` baca header (Server Components)
- `lib/i18n/client.tsx` → `I18nProvider` (dibungkus di `(public)/layout.tsx` dan `(admin)/layout.tsx`) + `useI18n()`
- `setLocale(l)` menulis cookie dan update state tanpa reload
