"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDateShort, cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  isNew: boolean;
  category: { id: string; name: string; active: boolean };
  coverImage: string | null;
  createdAt: string;
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger"> = {
  PUBLISHED: "success",
  DRAFT: "default",
  ARCHIVED: "danger",
};

export function ProductList({
  categories,
  canDelete = false,
}: {
  categories: Category[];
  canDelete?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(
    async (opts: { page: number; search: string; status: string; categoryId: string }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(opts.page), limit: "20" });
        if (opts.search) params.set("search", opts.search);
        if (opts.status) params.set("status", opts.status);
        if (opts.categoryId) params.set("categoryId", opts.categoryId);

        const res = await fetch(`/api/admin/products?${params}`);
        const json = await res.json();
        if (json.success) {
          setProducts(json.data.products);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProducts({ page, search, status, categoryId });
  }, [page, status, categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchProducts({ page: 1, search: value, status, categoryId });
    }, 400);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setCategoryId("");
    setPage(1);
    fetchProducts({ page: 1, search: "", status: "", categoryId: "" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setTotal((t) => t - 1);
        setDeleteTarget(null);
        if (products.length === 1 && page > 1) {
          setPage((p) => p - 1);
        }
      } else {
        setDeleteError(json.message ?? "Failed to delete product");
      }
    } catch {
      setDeleteError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = search || status || categoryId;

  return (
    <>
      {/* Filter bar */}
      <div className="bg-white border border-border rounded p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Name or SKU..."
              className="h-9 px-3 border border-border rounded text-sm w-56 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="h-9 px-3 text-sm text-muted hover:text-primary transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase w-12">
                  Image
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">
                  Product
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">
                  SKU
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">
                  Category
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">
                  Price
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">
                  Stock
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">
                  Created
                </th>
                {canDelete && <th className="px-3 py-3 w-10" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={canDelete ? 9 : 8} className="px-5 py-4">
                      <div className="h-3 bg-accent rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 9 : 8} className="px-5 py-8 text-center text-sm text-muted">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      product.category.active
                        ? "hover:bg-accent/30"
                        : "bg-accent/40 opacity-60 hover:opacity-80"
                    )}
                  >
                    <td className="px-5 py-3">
                      {product.coverImage ? (
                        <img
                          src={product.coverImage}
                          alt=""
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-accent rounded flex items-center justify-center">
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="w-4 h-4 text-muted"
                          >
                            <rect x="1" y="3" width="14" height="10" rx="1" />
                            <circle cx="5.5" cy="6.5" r="1.5" />
                            <path
                              d="M1 11l4-3 3 2.5L11 7l4 4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {product.name}
                      </a>
                      {product.featured && (
                        <span className="ml-2 text-[9px] font-semibold text-warning bg-warning/10 px-1 py-0.5 rounded uppercase">
                          Featured
                        </span>
                      )}
                      {product.isNew && (
                        <span className="ml-1 text-[9px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.5 rounded uppercase">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted font-mono text-xs">{product.sku}</td>
                    <td className="px-5 py-3 text-xs">
                      <span className={product.category.active ? "text-muted" : "text-destructive/70"}>
                        {product.category.name}
                      </span>
                      {!product.category.active && (
                        <span className="ml-1.5 text-[9px] font-semibold text-destructive bg-destructive/10 px-1 py-0.5 rounded uppercase">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-medium">
                        {formatPrice(product.salePrice ?? product.price)}
                      </span>
                      {product.salePrice && (
                        <span className="ml-1 text-xs text-muted line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={product.stock > 0 ? "text-success" : "text-destructive"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANTS[product.status] ?? "default"} size="sm">
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted">
                      {formatDateShort(product.createdAt)}
                    </td>
                    {canDelete && (
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => {
                            setDeleteError("");
                            setDeleteTarget(product);
                          }}
                          className="p-1.5 rounded text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete product"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="w-4 h-4"
                          >
                            <path
                              d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {page} of {totalPages} &middot; {total} products
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Product"
        size="sm"
        closeOnBackdrop={!deleting}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Delete{" "}
          <span className="font-semibold text-primary">&ldquo;{deleteTarget?.name}&rdquo;</span>?
          This action cannot be undone.
        </p>
        {deleteError && (
          <p className="mt-3 text-xs text-destructive">{deleteError}</p>
        )}
      </Modal>
    </>
  );
}
