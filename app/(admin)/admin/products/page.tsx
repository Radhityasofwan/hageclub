import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ProductList } from "@/components/admin/product-list";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Products</h1>
          <p className="text-sm text-muted">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 h-10 px-4 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Product
        </Link>
      </div>

      <ProductList categories={categories} canDelete={session.user.role === "ADMIN"} />
    </div>
  );
}
