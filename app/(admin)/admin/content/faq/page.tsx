import Link from "next/link";
import { FaqManager } from "@/components/admin/faq-manager";

export const dynamic = "force-dynamic";

export default function AdminFaqPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/content/pages" className="text-xs text-muted hover:text-primary transition-colors">
        ← Kembali ke Halaman
      </Link>
      <FaqManager />
    </div>
  );
}
