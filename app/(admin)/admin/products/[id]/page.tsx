import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        shortDescription: true,
        fullDescription: true,
        sizeGuideImageUrl: true,
        price: true,
        salePrice: true,
        weight: true,
        width: true,
        height: true,
        length: true,
        status: true,
        stock: true,
        featured: true,
        isNew: true,
        categoryId: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, isCover: true, sortOrder: true },
        },
        variants: {
          where: { isActive: true },
          select: {
            name: true,
            sku: true,
            price: true,
            stock: true,
            attributes: true,
            isActive: true,
          },
        },
      },
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-xs text-muted hover:text-primary transition-colors"
        >
          ← Back to Products
        </Link>
        <h1 className="text-lg font-bold mt-1">Edit: {product.name}</h1>
      </div>

      <ProductForm
        initialData={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.shortDescription ?? "",
          fullDescription: product.fullDescription ?? "",
          price: product.price,
          salePrice: product.salePrice,
          weight: product.weight,
          width: product.width,
          height: product.height,
          length: product.length,
          status: product.status,
          stock: product.stock,
          featured: product.featured,
          isNew: product.isNew ?? false,
          categoryId: product.categoryId,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          seoKeywords: product.seoKeywords ?? "",
          sizeGuideImageUrl: product.sizeGuideImageUrl ?? "",
          images: product.images.map((img) => ({
            url: img.url,
            isCover: img.isCover,
            sortOrder: img.sortOrder,
          })),
          variants: product.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            attributes: v.attributes as Record<string, string>,
            isActive: v.isActive,
          })),
        }}
        categories={categories}
      />
    </div>
  );
}
