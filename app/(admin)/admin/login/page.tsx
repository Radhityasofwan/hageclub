"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "SERVER_ERROR") {
          setError("Server error — check runtime logs");
        } else {
          setError("Invalid email or password");
        }
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-border rounded p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold tracking-widest uppercase">HAGE CLUB</h1>
          <p className="text-xs text-muted tracking-widest uppercase mt-1">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="admin@hageclub.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button variant="primary" type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <a
          href="/"
          className="block text-center text-xs text-muted hover:text-primary mt-6 transition-colors"
        >
          ← Back to Store
        </a>
      </div>
    </div>
  );
}
