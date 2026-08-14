"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface AdminUserFormData {
  email: string;
  password: string;
  role: "ADMIN" | "EDITOR" | "CS";
  firstName: string;
  lastName: string;
  phone: string;
}

interface AdminUserFormProps {
  initialData?: AdminUserFormData & { id?: string };
  onSuccess?: () => void;
}

export function AdminUserForm({ initialData, onSuccess }: AdminUserFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<AdminUserFormData>(
    initialData ?? {
      email: "",
      password: "",
      role: "EDITOR",
      firstName: "",
      lastName: "",
      phone: "",
    }
  );

  function update<K extends keyof AdminUserFormData>(field: K, value: AdminUserFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/users/${initialData.id}`
        : "/api/admin/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Failed to save");
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/users");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Account Info</h2>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          placeholder="admin@hageclub.com"
        />

        <Input
          label={isEditing ? "New Password (leave empty to keep current)" : "Password"}
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          required={!isEditing}
          placeholder={isEditing ? "Leave empty to keep current" : "Min 6 characters"}
        />

        <Select
          label="Role"
          options={[
            { value: "ADMIN", label: "Administrator" },
            { value: "EDITOR", label: "Editor" },
            { value: "CS", label: "Customer Service" },
          ]}
          value={form.role}
          onChange={(e) => update("role", e.target.value as AdminUserFormData["role"])}
        />
      </section>

      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Profile</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            required
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            required
          />
        </div>

        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+62..."
        />
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
