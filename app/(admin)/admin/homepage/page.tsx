"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HomepageSectionForm } from "@/components/admin/homepage-section-form";
import { getSectionTypeLabel } from "@/components/homepage/section-renderer";

interface Section {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
}

interface AnnouncementState {
  active: boolean;
  text: string;
  duration: number;
}

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reordering, setReordering] = useState(false);

  // Announcement bar state
  const [announcement, setAnnouncement] = useState<AnnouncementState>({
    active: true,
    text: "Free shipping untuk pembelian di atas Rp500.000",
    duration: 7,
  });
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [announcementSaving, setAnnouncementSaving] = useState(false);


  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/homepage");
      const json = await res.json();
      if (res.ok) {
        setSections(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcement");
      const json = await res.json();
      if (res.ok && json.data) {
        setAnnouncement(json.data);
      }
    } catch {
      // ignore
    } finally {
      setAnnouncementLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
    fetchAnnouncement();
  }, [fetchSections, fetchAnnouncement]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSaveAnnouncement() {
    setAnnouncementSaving(true);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcement),
      });
      const json = await res.json();
      if (!res.ok) {
        showMessage("error", json.message ?? "Gagal menyimpan");
        return;
      }
      showMessage("success", "Notification bar berhasil diperbarui");
    } catch {
      showMessage("error", "Terjadi kesalahan");
    } finally {
      setAnnouncementSaving(false);
    }
  }

  async function handleSave(data: {
    type: string;
    title: string;
    subtitle: string;
    content: Record<string, unknown>;
    active: boolean;
  }) {
    setSaving(true);
    try {
      if (editingSection) {
        const res = await fetch(`/api/admin/homepage/${editingSection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const json = await res.json();
          showMessage("error", json.message ?? "Failed to update");
          return;
        }
        showMessage("success", "Section updated");
      } else {
        const res = await fetch("/api/admin/homepage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const json = await res.json();
          showMessage("error", json.message ?? "Failed to create");
          return;
        }
        showMessage("success", "Section created");
      }
      setShowForm(false);
      setEditingSection(null);
      fetchSections();
    } catch {
      showMessage("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(section: Section) {
    try {
      const res = await fetch(`/api/admin/homepage/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !section.active }),
      });
      if (!res.ok) return;
      showMessage("success", section.active ? "Section hidden" : "Section shown");
      fetchSections();
    } catch {
      showMessage("error", "Failed to toggle");
    }
  }

  async function handleDelete(section: Section) {
    if (!confirm(`Delete "${section.title || getSectionTypeLabel(section.type)}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/homepage/${section.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showMessage("error", "Failed to delete");
        return;
      }
      showMessage("success", "Section deleted");
      fetchSections();
    } catch {
      showMessage("error", "Something went wrong");
    }
  }

  async function moveSection(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    reordered.forEach((s, i) => (s.sortOrder = i));

    setSections(reordered);
    setReordering(true);

    try {
      await fetch("/api/admin/homepage/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: reordered.map((s, i) => ({ id: s.id, sortOrder: i })),
        }),
      });
    } catch {
      fetchSections(); // revert on error
    } finally {
      setReordering(false);
    }
  }

  function openEdit(section: Section) {
    setEditingSection(section);
    setShowForm(true);
  }

  function openCreate() {
    setEditingSection(null);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-primary">Homepage Sections</h1>
          <p className="text-xs text-muted mt-0.5">
            Manage all homepage content sections. Sections render in order.
          </p>
        </div>
        <Button onClick={openCreate}>Add Section</Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Announcement Bar Card */}
      <div className="mb-6 bg-white border border-border rounded overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-accent/30">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-primary/5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 4h8a1 1 0 011 1v4a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#1C1C1E" strokeWidth="1.2" />
              <path d="M11 5.5l2-1.5v5l-2-1.5" stroke="#1C1C1E" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary">Notification Bar</p>
            <p className="text-[10px] text-muted">Strip notifikasi di atas navbar</p>
          </div>
          {/* Live preview badge */}
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              announcement.active
                ? "bg-green-100 text-green-700"
                : "bg-accent text-muted"
            }`}
          >
            {announcement.active ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        {announcementLoading ? (
          <div className="px-4 py-5 flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Toggle active */}
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={announcement.active}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-accent rounded-full peer-checked:bg-primary transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">Tampilkan notification bar</p>
                <p className="text-[10px] text-muted">Matikan untuk menyembunyikan dari semua halaman</p>
              </div>
            </label>

            {/* Text input */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Teks Notifikasi
              </label>
              <input
                type="text"
                value={announcement.text}
                onChange={(e) =>
                  setAnnouncement((prev) => ({ ...prev, text: e.target.value }))
                }
                maxLength={300}
                placeholder="Contoh: Free shipping untuk pembelian di atas Rp500.000"
                className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted">Teks singkat, maks 300 karakter</p>
                <span className="text-[10px] text-muted">{announcement.text.length}/300</span>
              </div>
            </div>

            {/* Duration input */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Durasi Tampil (detik)
              </label>
              <input
                type="number"
                value={announcement.duration}
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    duration: Math.max(2, Math.min(60, Number(e.target.value) || 7)),
                  }))
                }
                min={2}
                max={60}
                className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-muted mt-1">
                Notifikasi otomatis hilang setelah durasi ini jika tidak ditutup customer (2-60 detik)
              </p>
            </div>

            {/* Live preview */}
            {announcement.text && (
              <div className="rounded overflow-hidden">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Preview
                </p>
                <div className="h-9 bg-primary flex items-center justify-center px-8 gap-2.5 rounded">
                  <svg width="13" height="11" viewBox="0 0 15 12" fill="none" aria-hidden="true" className="opacity-70">
                    <rect x="0.75" y="0.75" width="8.5" height="7.5" rx="0.75" stroke="white" strokeWidth="1.2" />
                    <path d="M9.25 3h3l2 3v2.25H9.25V3Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
                    <circle cx="3.25" cy="10.25" r="1.25" fill="white" />
                    <circle cx="11.25" cy="10.25" r="1.25" fill="white" />
                  </svg>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <p className="text-xs text-white/90 tracking-wide truncate max-w-[70%]">
                    {announcement.text}
                  </p>
                </div>
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSaveAnnouncement}
                loading={announcementSaving}
                disabled={!announcement.text.trim()}
              >
                Simpan
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section list */}
      {sections.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded">
          <p className="text-sm text-muted">No homepage sections yet.</p>
          <p className="text-xs text-muted mt-1">Click &ldquo;Add Section&rdquo; to start building your homepage.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`bg-white border border-border rounded flex items-center gap-4 px-4 py-3 ${
                !section.active ? "opacity-50" : ""
              }`}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0 || reordering}
                  className="text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => moveSection(index, "down")}
                  disabled={index === sections.length - 1 || reordering}
                  className="text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Drag indicator */}
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="text-muted/30 shrink-0">
                <circle cx="4" cy="4" r="1.5" fill="currentColor" />
                <circle cx="8" cy="4" r="1.5" fill="currentColor" />
                <circle cx="4" cy="10" r="1.5" fill="currentColor" />
                <circle cx="8" cy="10" r="1.5" fill="currentColor" />
                <circle cx="4" cy="16" r="1.5" fill="currentColor" />
                <circle cx="8" cy="16" r="1.5" fill="currentColor" />
              </svg>

              {/* Type badge */}
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-accent rounded text-muted uppercase shrink-0 min-w-[90px] text-center">
                {getSectionTypeLabel(section.type)}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {section.title || getSectionTypeLabel(section.type)}
                </p>
                {section.subtitle && (
                  <p className="text-xs text-muted truncate">{section.subtitle}</p>
                )}
              </div>

              {/* Order number */}
              <span className="text-[10px] text-muted">#{section.sortOrder + 1}</span>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(section)}
                  className={`w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors ${
                    section.active ? "text-green-600" : "text-muted"
                  }`}
                  title={section.active ? "Active (click to hide)" : "Inactive (click to show)"}
                >
                  {section.active ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M12 4L5 11L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(section)}
                  className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-primary hover:bg-accent transition-colors"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10 1l3 3-8 8H2V9l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Delete (admin only) */}
                <button
                  onClick={() => handleDelete(section)}
                  className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-red-500 hover:bg-accent transition-colors"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M11 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <HomepageSectionForm
          section={editingSection}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}
