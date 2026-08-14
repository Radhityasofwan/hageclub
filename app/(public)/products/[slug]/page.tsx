import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries/product";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductActions } from "./product-actions";
import { Badge } from "@/components/ui/badge";
import { getI18n } from "@/lib/i18n/server";
import { buildProductMetadata } from "@/lib/seo";
import { buildProductSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { getSettingValue } from "@/lib/settings";
import { db } from "@/lib/db";

interface ProductPageProps {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { t } = await getI18n();

  const [product, waNumber, couponCount] = await Promise.all([
    getProductBySlug(params.slug),
    getSettingValue("whatsapp_number"),
    db.coupon.count({ where: { isActive: true } }),
  ]);

  if (!product) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";

  const productSchema = buildProductSchema({
    name: product.name,
    description: product.shortDescription ?? "",
    sku: product.sku,
    price: product.salePrice ?? product.price,
    images: product.images.map((img) => img.url),
    url: `${appUrl}/products/${product.slug}`,
    availability: product.stock > 0 ? "InStock" : "OutOfStock",
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Beranda", url: appUrl },
    { name: "Belanja", url: `${appUrl}/shop` },
    { name: product.category.name, url: `${appUrl}/shop/${product.category.slug}` },
    { name: product.name, url: `${appUrl}/products/${product.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbSchema }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-6">
        {/* Main layout: gallery (sticky) | info — 2 kolom mulai tablet (md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8 lg:gap-12 items-start">
          {/* Gallery — sticky on tablet/desktop so it stays visible while scrolling info */}
          <div className="md:sticky md:top-24 md:max-w-[580px]">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Product info — chip kategori → judul → harga → pilihan → CTA */}
          <div className="space-y-0">
            {/* Kategori sebagai chip subtle (link) + badge baru; status stok ada di bawah */}
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Link
                  href={`/shop/${product.category.slug}`}
                  className="inline-flex items-center px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-muted hover:bg-accent hover:text-foreground transition-colors"
                >
                  {product.category.name}
                </Link>
                {product.isNew && (
                  <Badge variant="info" size="sm">{t("product.newBadge")}</Badge>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-snug text-foreground">
                {product.name}
              </h1>
            </div>

            {/* Interactive section: price, coupon, stock, size, qty, CTA, desc, ongkir, accordion, WA */}
            <ProductActions
              product={product}
              sizeGuideImageUrl={product.sizeGuideImageUrl}
              waNumber={waNumber}
              fullDescription={product.fullDescription}
              couponCount={couponCount}
            />
          </div>
        </div>

      </div>
    </>
  );
}
