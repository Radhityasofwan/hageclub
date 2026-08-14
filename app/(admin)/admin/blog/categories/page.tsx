"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { posts: number };
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCategory, setEditCategory] = useState<BlogCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [manualSlug, setManualSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/blog/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreate() {
    setEditCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setManualSlug(false);
    setError("");
    setShowModal(true);
  }

  function openEdit(cat: BlogCategory) {
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setManualSlug(true);
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!name) { setError("Name is required"); return; }
    if (!slug) { setError("Slug is required"); return; }

    setSaving(true);
    setError("");

    try {
      const url = editCategory
        ? `/api/admin/blog/categories/${editCategory.id}`
        : "/api/admin/blog/categories";
      const method = editCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description: description || null }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Failed to save");
        return;
      }

      setShowModal(false);
      fetchCategories();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, postCount: number) {
    if (postCount > 0) {
      alert(`Cannot delete this category. It has ${postCount} post(s).`);
      return;
    }
    if (!confirm("Delete this category?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/blog/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  function slugifyName(value: string) {
    if (manualSlug) return;
    setSlug(
      value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Blog Categories</h1>
          <p className="text-sm text-muted">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate}>+ New Category</Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Slug</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Posts</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{cat.name}</td>
                  <td className="px-5 py-3 text-xs text-muted">{cat.slug}</td>
                  <td className="px-5 py-3 text-right">{cat._count.posts}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="text-xs text-primary hover:underline">Edit</button>
                      <button
                        onClick={() => handleDelete(cat.id, cat._count.posts)}
                        disabled={deleting === cat.id}
                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        {deleting === cat.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                    {loading ? "Loading..." : "No categories yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editCategory ? "Edit Category" : "New Category"}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editCategory ? "Update" : "Create"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Input
            label="Name"
            value={name}
            onChange={(e) => { setName(e.target.value); slugifyName(e.target.value); }}
            placeholder="e.g., Car Culture"
            required
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => { setManualSlug(true); setSlug(e.target.value); }}
            placeholder="car-culture"
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
      </Modal>
    </div>
  );
}
