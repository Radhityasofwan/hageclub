"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContactInfo } from "@/lib/cms-content";

interface ContactInfoFormProps {
  initial: ContactInfo | null;
}

export function ContactInfoForm({ initial }: ContactInfoFormProps) {
  const [form, setForm] = useState<ContactInfo | null>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState("");

  if (!form) return null;

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/content/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Gagal menyimpan");
        return;
      }
      showMessage("success", "Info kontak disimpan");
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* WhatsApp */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">WhatsApp</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nomor (tampilan)"
            value={form.whatsapp.label}
            onChange={(e) => set("whatsapp", { ...form.whatsapp, label: e.target.value })}
          />
          <Input
            label="URL"
            value={form.whatsapp.url}
            onChange={(e) => set("whatsapp", { ...form.whatsapp, url: e.target.value })}
          />
        </div>
        <Input
          label="Catatan"
          value={form.whatsapp.note}
          onChange={(e) => set("whatsapp", { ...form.whatsapp, note: e.target.value })}
        />
      </section>

      {/* Email & Phone */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Email & Telepon</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            value={form.email.label}
            onChange={(e) => set("email", { ...form.email, label: e.target.value })}
          />
          <Input
            label="Catatan email"
            value={form.email.note}
            onChange={(e) => set("email", { ...form.email, note: e.target.value })}
          />
          <Input
            label="Telepon"
            value={form.phone.label}
            onChange={(e) => set("phone", { ...form.phone, label: e.target.value })}
          />
          <Input
            label="Catatan telepon"
            value={form.phone.note}
            onChange={(e) => set("phone", { ...form.phone, note: e.target.value })}
          />
        </div>
      </section>

      {/* Address */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Alamat</h2>
        <Textarea
          label="Alamat (satu baris per bagian)"
          value={form.address.lines.join("\n")}
          onChange={(e) => set("address", { lines: e.target.value.split("\n") })}
          rows={4}
        />
      </section>

      {/* Business hours */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Jam Operasional</h2>
        <div className="space-y-3">
          {form.hours.map((h, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <Input
                label={i === 0 ? "Hari" : undefined}
                value={h.days}
                onChange={(e) =>
                  set("hours", form.hours.map((x, j) => (j === i ? { ...x, days: e.target.value } : x)))
                }
              />
              <Input
                label={i === 0 ? "Jam" : undefined}
                value={h.time}
                onChange={(e) =>
                  set("hours", form.hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Media Sosial</h2>
        <div className="space-y-3">
          {form.social.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <Input
                label={i === 0 ? "Platform" : undefined}
                value={s.platform}
                onChange={(e) =>
                  set("social", form.social.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))
                }
              />
              <Input
                label={i === 0 ? "Handle" : undefined}
                value={s.handle}
                onChange={(e) =>
                  set("social", form.social.map((x, j) => (j === i ? { ...x, handle: e.target.value } : x)))
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Response time */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Waktu Respons</h2>
        <Textarea
          label="Teks waktu respons"
          value={form.responseTime}
          onChange={(e) => set("responseTime", e.target.value)}
          rows={2}
        />
      </section>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={saving}>
          Simpan Info Kontak
        </Button>
      </div>
    </form>
  );
}
