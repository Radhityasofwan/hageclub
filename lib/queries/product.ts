import { db } from "@/lib/db";
import type {
  ProductCardData,
  ProductDetail,
  ProductFilters,
  ProductsResult,
  CategoryWithChildren,
} from "@/types/product";
import { Prisma } from "@prisma/client";

// =============================================================================
// SELECT SHAPES
// =============================================================================

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  salePrice: true,
  stock: true,
  status: true,
  featured: true,
  isNew: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true, sortOrder: true, isCover: true },
    orderBy: { sortOrder: "asc" as const },
  },
  _count: { select: { variants: { where: { isActive: true } } } },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  ...productCardSelect,
  sku: true,
  shortDescription: true,
  fullDescription: true,
  sizeGuideImageUrl: true,
  weight: true,
  width: true,
  height: true,
  length: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
      attributes: true,
      isActive: true,
    },
    orderBy: { name: "asc" as const },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
} satisfies Prisma.ProductSelect;

// =============================================================================
// HELPERS
// =============================================================================

function buildWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };

  if (filters.category) {
    where.category = { slug: filters.category, active: true };
  } else {
    where.category = { active: true };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  if (filters.inStock) {
    where.stock = { gt: 0 };
  }

  if (filters.featured) {
    where.featured = true;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { shortDescription: { contains: filters.search } },
      { sku: { contains: filters.search } },
    ];
  }

  // Filter by size/color via variants
  // Catatan: di MySQL, Prisma JSON filter `path` menerima string JSON path
  // (format "$.Key"), bukan array ["Key"] yang merupakan bentuk PostgreSQL.
  const variantFilters: Prisma.ProductVariantWhereInput[] = [];

  if (filters.size?.length) {
    variantFilters.push({
      isActive: true,
      OR: filters.size.map((s) => ({
        attributes: { path: "$.Size", equals: s },
      })),
    });
  }

  if (filters.color?.length) {
    variantFilters.push({
      isActive: true,
      OR: filters.color.map((c) => ({
        attributes: { path: "$.Color", equals: c },
      })),
    });
  }

  if (variantFilters.length) {
    where.variants = { some: { AND: variantFilters } };
  }

  return where;
}

function buildOrderByClause(
  sort?: ProductFilters["sort"]
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "featured":
      return { featured: "desc", createdAt: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    // rating_desc: belum ada data rating; fallback ke terbaru (proxy sama seperti best_selling)
    // best_selling handled separately via OrderItem count
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

function mapProductCard(raw: Prisma.ProductGetPayload<{ select: typeof productCardSelect }>): ProductCardData {
  const { _count, ...rest } = raw;
  return {
    ...rest,
    status: raw.status as ProductCardData["status"],
    hasVariants: _count.variants > 0,
  };
}

// =============================================================================
// QUERIES
// =============================================================================

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductsResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 16));
  const skip = (page - 1) * limit;

  const where = buildWhereClause(filters);

  let orderBy: Prisma.ProductOrderByWithRelationInput;

  if (filters.sort === "best_selling") {
    // Sort by number of times it appears in OrderItems (approximation)
    // For true best_sellers we'd need aggregation; use stock as proxy for now
    orderBy = { createdAt: "desc" };
  } else {
    orderBy = buildOrderByClause(filters.sort);
  }

  const [products, total] = await db.$transaction([
    db.product.findMany({
      where,
      select: productCardSelect,
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return {
    products: products.map(mapProductCard),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const raw = await db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: productDetailSelect,
  });

  if (!raw) return null;

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    sku: raw.sku,
    price: raw.price,
    salePrice: raw.salePrice,
    stock: raw.stock,
    status: raw.status as ProductDetail["status"],
    featured: raw.featured,
    isNew: raw.isNew,
    hasVariants: raw.variants.length > 0,
    shortDescription: raw.shortDescription,
    fullDescription: raw.fullDescription,
    sizeGuideImageUrl: raw.sizeGuideImageUrl,
    weight: raw.weight,
    width: raw.width,
    height: raw.height,
    length: raw.length,
    seoTitle: raw.seoTitle,
    seoDescription: raw.seoDescription,
    category: raw.category,
    images: raw.images,
    variants: raw.variants.map((v) => ({
      ...v,
      attributes: v.attributes as Record<string, string>,
    })),
    tags: raw.tags.map((t) => t.tag),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Satu produk untuk template Featured Product (full screen) di homepage. */
export async function getFeaturedProductCard(
  productId: string
): Promise<ProductCardData | null> {
  const raw = await db.product.findUnique({
    where: { id: productId, status: "PUBLISHED" },
    select: productCardSelect,
  });
  return raw ? mapProductCard(raw) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: { status: "PUBLISHED", featured: true, category: { active: true } },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(mapProductCard);
}

export async function getNewArrivals(limit = 8): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: { status: "PUBLISHED", category: { active: true } },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(mapProductCard);
}

export async function getBestSellers(limit = 8): Promise<ProductCardData[]> {
  // Join with OrderItems to get actual sales count
  const topIds = await db.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (!topIds.length) return getNewArrivals(limit);

  const ids = topIds.map((r) => r.productId);
  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "PUBLISHED", category: { active: true } },
    select: productCardSelect,
  });

  // Restore order from groupBy
  const productMap = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => productMap.get(id))
    .filter(Boolean)
    .map((p) => mapProductCard(p!));
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId,
      id: { not: productId },
      category: { active: true },
    },
    select: productCardSelect,
    orderBy: { featured: "desc" },
    take: limit,
  });
  return products.map(mapProductCard);
}

export async function searchProducts(
  query: string,
  limit = 10
): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: {
      status: "PUBLISHED",
      category: { active: true },
      OR: [
        { name: { contains: query } },
        { shortDescription: { contains: query } },
        { sku: { contains: query } },
      ],
    },
    select: productCardSelect,
    take: limit,
  });
  return products.map(mapProductCard);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await db.product.findMany({
    where: { status: "PUBLISHED", category: { active: true } },
    select: { slug: true },
  });
  return products.map((p) => p.slug);
}

// =============================================================================
// CATEGORIES
// =============================================================================

export async function getCategories(): Promise<CategoryWithChildren[]> {
  const all = await db.category.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      banner: true,
      parentId: true,
      sortOrder: true,
      seoTitle: true,
      seoDescription: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  const rootCategories: CategoryWithChildren[] = [];
  const byId = new Map<string, CategoryWithChildren>();

  for (const cat of all) {
    byId.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of all) {
    const node = byId.get(cat.id)!;
    if (cat.parentId && byId.has(cat.parentId)) {
      byId.get(cat.parentId)!.children.push(node);
    } else {
      rootCategories.push(node);
    }
  }

  return rootCategories;
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithChildren | null> {
  const cat = await db.category.findUnique({
    where: { slug, active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      banner: true,
      parentId: true,
      sortOrder: true,
      seoTitle: true,
      seoDescription: true,
    },
  });
  if (!cat) return null;
  return { ...cat, children: [] };
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const cats = await db.category.findMany({ where: { active: true }, select: { slug: true } });
  return cats.map((c) => c.slug);
}

/** Featured-first highlights — used for homepage catalog tabs */
export async function getCatalogHighlights(
  limit: number = 8,
  categorySlug?: string
): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: {
      status: "PUBLISHED",
      category: {
        active: true,
        ...(categorySlug ? { slug: categorySlug } : {}),
      },
    },
    select: productCardSelect,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return products.map(mapProductCard);
}
