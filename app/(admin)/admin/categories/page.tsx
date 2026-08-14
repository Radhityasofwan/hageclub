"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CategoryForm } from "@/components/admin/category-form";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  parent: { id: string; name: string } | null;
  _count: { products: number; children: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      setCategories(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message ?? "Failed to delete");
        return;
      }
      setDeleteConfirm(null);
      fetchCategories();
    } catch {
      alert("Failed to delete category");
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message ?? "Failed to toggle category");
        return;
      }
      fetchCategories();
    } catch {
      alert("Failed to toggle category");
    }
  }

  async function moveCategory(id: string, direction: "up" | "down", parentId: string | null) {
    if (reordering) return;

    const siblings = categories.filter((c) => c.parentId === parentId);
    const index = siblings.findIndex((c) => c.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const updates = reordered.map((cat, i) => ({ id: cat.id, sortOrder: i }));

    // Optimistic update
    setCategories((prev) => {
      const result = [...prev];
      const posA = result.findIndex((c) => c.id === siblings[index].id);
      const posB = result.findIndex((c) => c.id === siblings[swapIndex].id);
      [result[posA], result[posB]] = [result[posB], result[posA]];
      return result;
    });

    setReordering(true);
    try {
      await fetch("/api/admin/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updates }),
      });
    } catch {
      fetchCategories();
    } finally {
      setReordering(false);
    }
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setShowForm(true);
  }

  function openCreate() {
    setEditingCategory(null);
    setShowForm(true);
  }

  function onFormSuccess() {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  }

  // Build tree for display
  const roots = categories.filter((c) => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  for (const cat of categories) {
    if (cat.parentId) {
      const existing = childrenMap.get(cat.parentId) ?? [];
      existing.push(cat);
      childrenMap.set(cat.parentId, existing);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Categories</h1>
          <p className="text-sm text-muted">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate}>+ New Category</Button>
      </div>

      {/* Category tree */}
      <div className="bg-white border border-border rounded divide-y divide-border">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            No categories yet. Create your first category to organize products.
          </div>
        ) : (
          roots.map((root, rootIndex) => (
            <div key={root.id}>
              <CategoryRow
                category={root}
                childCount={root._count.children}
                productCount={root._count.products}
                isFirst={rootIndex === 0}
                isLast={rootIndex === roots.length - 1}
                reordering={reordering}
                onMoveUp={() => moveCategory(root.id, "up", null)}
                onMoveDown={() => moveCategory(root.id, "down", null)}
                onEdit={() => openEdit(root)}
                onDelete={() => setDeleteConfirm(root.id)}
                onToggleActive={() => toggleActive(root.id, root.active)}
              />
              {childrenMap.get(root.id)?.map((child, childIndex, arr) => (
                <div key={child.id} className="ml-8 border-l border-border">
                  <CategoryRow
                    category={child}
                    isChild
                    childCount={child._count.children}
                    productCount={child._count.products}
                    isFirst={childIndex === 0}
                    isLast={childIndex === arr.length - 1}
                    reordering={reordering}
                    onMoveUp={() => moveCategory(child.id, "up", root.id)}
                    onMoveDown={() => moveCategory(child.id, "down", root.id)}
                    onEdit={() => openEdit(child)}
                    onDelete={() => setDeleteConfirm(child.id)}
                    onToggleActive={() => toggleActive(child.id, child.active)}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Category Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? "Edit Category" : "New Category"}
        size="md"
      >
        <CategoryForm
          initialData={
            editingCategory
              ? {
                  id: editingCategory.id,
                  name: editingCategory.name,
                  slug: editingCategory.slug,
                  description: editingCategory.description,
                  banner: editingCategory.banner,
                  parentId: editingCategory.parentId,
                  sortOrder: editingCategory.sortOrder,
                  active: editingCategory.active,
                  seoTitle: editingCategory.seoTitle,
                  seoDescription: editingCategory.seoDescription,
                }
              : undefined
          }
          categories={categories}
          onSuccess={onFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to delete this category? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CategoryRow({
  category,
  isChild,
  childCount,
  productCount,
  isFirst,
  isLast,
  reordering,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  category: Category;
  isChild?: boolean;
  childCount: number;
  productCount: number;
  isFirst: boolean;
  isLast: boolean;
  reordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-accent/30 transition-colors">
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst || reordering}
          className="text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Geser ke atas"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast || reordering}
          className="text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Geser ke bawah"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Name / slug */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isChild && (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-muted shrink-0">
            <path d="M1 8h14M8 1v14" strokeLinecap="round" />
          </svg>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn("text-sm font-medium truncate", !category.active && "text-muted")}>
              {category.name}
            </p>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0",
              category.active ? "bg-green-100 text-green-700" : "bg-accent text-muted"
            )}>
              {category.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-xs text-muted font-mono">/{category.slug}</p>
        </div>
      </div>

      {/* Stats + actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex gap-2 text-xs text-muted">
          <span>{productCount} products</span>
          {childCount > 0 && <span>{childCount} sub</span>}
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={onToggleActive}
            className={cn(
              "p-1.5 rounded transition-colors",
              category.active
                ? "text-muted hover:text-destructive hover:bg-destructive/10"
                : "text-muted hover:text-primary hover:bg-accent"
            )}
            title={category.active ? "Deactivate" : "Activate"}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              {category.active ? (
                <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-muted hover:text-primary hover:bg-accent rounded transition-colors"
            title="Edit"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-muted hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Delete"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M2 4h12M5 4V2h6v2M3 6l1 8h8l1-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
