"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

const EMPTY_FORM = { question: "", answer: "", sortOrder: 0, active: true };

export function FaqManager() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/faq");
      const json = await res.json();
      if (res.ok) setItems(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function openCreate() {
    const maxSort = items.reduce((m, i) => Math.max(m, i.sortOrder), 0);
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: maxSort + 1 });
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: FaqItem) {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer, sortOrder: item.sortOrder, active: item.active });
    setError("");
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `/api/admin/faq/${editingId}` : "/api/admin/faq";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Gagal menyimpan");
        return;
      }
      setModalOpen(false);
      showMessage("success", editingId ? "FAQ diperbarui" : "FAQ ditambahkan");
      fetchItems();
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus FAQ ini? Tindakan tidak bisa dibatalkan.")) return;
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("success", "FAQ dihapus");
        fetchItems();
      }
    } catch {
      // silent
    }
  }

  async function handleToggleActive(item: FaqItem) {
    try {
      await fetch(`/api/admin/faq/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, active: !item.active }),
      });
      fetchItems();
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">FAQ</h1>
          <p className="text-sm text-muted">{items.length} pertanyaan</p>
        </div>
        <Button onClick={openCreate}>+ Tambah FAQ</Button>
      </div>

      <div className="bg-white border border-border rounded overflow-hidden">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Belum ada FAQ.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase w-12">#</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Pertanyaan</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted">{item.sortOrder}</td>
                  <td className="px-5 py-3 font-medium">{item.question}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        item.active ? "bg-emerald-50 text-emerald-700" : "bg-accent text-muted"
                      }`}
                    >
                      {item.active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(item)} className="text-xs text-muted hover:text-primary">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit FAQ" : "Tambah FAQ"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <Input
            label="Pertanyaan"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            required
          />
          <Textarea
            label="Jawaban"
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            rows={4}
            required
          />
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input
                label="Urutan"
                type="number"
                min={0}
                value={String(form.sortOrder)}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm pb-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="accent-primary"
              />
              Aktif
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
