import Link from "next/link";
import { CmsPageForm } from "@/components/admin/cms-page-form";

export const dynamic = "force-dynamic";

export default function NewCmsPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/content/pages" className="text-xs text-muted hover:text-primary transition-colors">
        ← Kembali ke Halaman
      </Link>
      <div>
        <h1 className="text-lg font-bold">Halaman Baru</h1>
        <p className="text-sm text-muted">Buat halaman statis baru untuk situs.</p>
      </div>
      <CmsPageForm />
    </div>
  );
}
