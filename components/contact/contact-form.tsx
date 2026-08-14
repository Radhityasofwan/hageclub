"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function ContactForm() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: t("contact.sentSuccess") });
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus({ type: "error", message: json.message ?? t("contact.sendError") });
      }
    } catch {
      setStatus({ type: "error", message: t("contact.sendError") });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <div className={`px-4 py-3 rounded text-sm ${
          status.type === "success"
            ? "bg-success/10 text-success border border-success/20"
            : "bg-destructive/10 text-destructive border border-destructive/20"
        }`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("contact.name")}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          placeholder={t("contact.namePlaceholder")}
        />
        <Input
          label={t("contact.email")}
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          placeholder={t("contact.emailPlaceholder")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("contact.phone")}
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder={t("contact.phonePlaceholder")}
        />
        <Input
          label={t("contact.subject")}
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          required
          placeholder={t("contact.subjectPlaceholder")}
        />
      </div>

      <Textarea
        label={t("contact.message")}
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
        required
        rows={5}
        placeholder={t("contact.messagePlaceholder")}
      />

      <Button type="submit" loading={sending}>
        {sending ? t("contact.sending") : t("contact.send")}
      </Button>
    </form>
  );
}
