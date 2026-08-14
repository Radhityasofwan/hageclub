import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-xs text-muted hover:text-primary transition-colors"
        >
          ← Back to Products
        </Link>
        <h1 className="text-lg font-bold mt-1">New Product</h1>
        <p className="text-sm text-muted mt-0.5">
          Add a new product to your catalog.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
