"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StockModal } from "@/components/admin/stock-modal";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  status: string;
  price: number;
  category: string;
  coverImage: string | null;
  variants: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    isActive: boolean;
  }[];
  stockHistory: {
    type: string;
    amount: number;
    before: number;
    after: number;
    reason: string | null;
    createdAt: string;
  }[];
}

interface StockModalItem {
  product: { id: string; name: string; stock: number };
  variant?: { id: string; name: string; stock: number } | null;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState("");
  const [stockModal, setStockModal] = useState<StockModalItem | null>(null);

  async function fetchData(p = 1) {
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      if (stock) params.set("stock", stock);

      const res = await fetch(`/api/admin/inventory?${params}`);
      const json = await res.json();
      const data = json.data ?? {};
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchData(1);
  }, [stock]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchData(1);
  }

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Inventory</h1>
          <p className="text-sm text-muted">{total} products tracked</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3">
        <button
          onClick={() => setStock("")}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
            !stock
              ? "bg-primary text-white border-primary"
              : "border-border text-muted hover:border-primary"
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => setStock("low")}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
            stock === "low"
              ? "bg-warning text-white border-warning"
              : "border-border text-muted hover:border-warning"
          }`}
        >
          Low Stock ({lowStockCount})
        </button>
        <button
          onClick={() => setStock("out")}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
            stock === "out"
              ? "bg-destructive text-white border-destructive"
              : "border-border text-muted hover:border-destructive"
          }`}
        >
          Out of Stock ({outOfStockCount})
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name or SKU..."
            className="h-9 px-3 border border-border rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-4 bg-accent rounded text-sm font-medium transition-colors hover:bg-accent/70"
        >
          Search
        </button>
      </form>

      {/* Products table */}
      <div className="bg-white border border-border rounded">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Product</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Category</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Stock</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Variants</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {product.coverImage ? (
                        <img src={product.coverImage} alt="" className="w-9 h-9 object-cover rounded" />
                      ) : (
                        <div className="w-9 h-9 bg-accent rounded flex items-center justify-center">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-muted">
                            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted font-mono text-xs">{product.sku}</td>
                  <td className="px-5 py-3 text-muted text-xs">{product.category}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-medium ${
                      product.stock === 0 ? "text-destructive" :
                      product.stock <= 5 ? "text-warning" : "text-success"
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted">
                    {product.variants.length > 0
                      ? `${product.variants.length} variant(s)`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setStockModal({ product: { id: product.id, name: product.name, stock: product.stock } })
                      }
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <button
                  onClick={() => fetchData(page - 1)}
                  className="h-8 px-3 border border-border rounded text-xs hover:bg-accent"
                >
                  Previous
                </button>
              )}
              {page < totalPages && (
                <button
                  onClick={() => fetchData(page + 1)}
                  className="h-8 px-3 border border-border rounded text-xs hover:bg-accent"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stock Modal */}
      {stockModal && (
        <StockModal
          isOpen={!!stockModal}
          onClose={() => setStockModal(null)}
          product={stockModal.product}
          onSuccess={() => {
            setStockModal(null);
            fetchData(page);
          }}
        />
      )}
    </div>
  );
}
