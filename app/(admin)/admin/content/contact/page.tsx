import Link from "next/link";
import { db } from "@/lib/db";
import { ContactInfoForm } from "@/components/admin/contact-info-form";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const row = await db.systemSetting.findUnique({ where: { key: "contact_info" } });

  let initial = null;
  if (row?.value) {
    try {
      initial = JSON.parse(row.value);
    } catch {
      initial = null;
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/content/pages" className="text-xs text-muted hover:text-primary transition-colors">
        ← Kembali ke Halaman
      </Link>
      <div>
        <h1 className="text-lg font-bold">Info Kontak</h1>
        <p className="text-sm text-muted">
          Informasi yang tampil di sidebar halaman Kontak (WhatsApp, email, telepon, alamat, jam operasional, media sosial).
        </p>
      </div>
      <ContactInfoForm initial={initial} />
    </div>
  );
}
