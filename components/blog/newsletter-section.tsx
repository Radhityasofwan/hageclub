"use client";

import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Terima kasih sudah berlangganan!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(json.message ?? "Terjadi kesalahan");
      }
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  return (
    <section className="bg-accent border border-border rounded p-8 md:p-12 text-center">
      <h3 className="text-lg font-bold">Ikuti Newsletter</h3>
      <p className="text-sm text-muted mt-2 max-w-md mx-auto">
        Dapatkan artikel terbaru, cerita budaya otomotif, dan info produk eksklusif langsung ke email kamu.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex gap-3 max-w-sm mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          className="flex-1 h-10 px-4 border border-border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-10 px-5 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {status === "loading" ? "..." : "Berlangganan"}
        </button>
      </form>
      {status === "success" && (
        <p className="text-xs text-success mt-3">{message}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-destructive mt-3">{message}</p>
      )}
    </section>
  );
}
