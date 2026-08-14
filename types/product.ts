export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  attributes: Record<string, string>;
  isActive: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

/** Lightweight type for cards and listings */
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  isNew: boolean;
  hasVariants: boolean;
  createdAt: Date;
  category: ProductCategory;
  images: ProductImage[];
}

/** Full product with all relations for PDP */
export interface ProductDetail extends ProductCardData {
  shortDescription: string | null;
  fullDescription: string | null;
  sizeGuideImageUrl: string | null;
  weight: number;
  width: number | null;
  height: number | null;
  length: number | null;
  variants: ProductVariant[];
  tags: ProductTag[];
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string[];
  color?: string[];
  inStock?: boolean;
  featured?: boolean;
  sort?:
    | "featured"
    | "newest"
    | "oldest"
    | "best_selling"
    | "rating_desc"
    | "price_asc"
    | "price_desc"
    | "name_asc"
    | "name_desc";
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResult {
  products: ProductCardData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner: string | null;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  children: CategoryWithChildren[];
}
