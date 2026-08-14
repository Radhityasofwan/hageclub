"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminUserForm } from "@/components/admin/admin-user-form";

interface AdminUserData {
  id: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "CS";
  profile: { firstName: string; lastName: string; phone: string | null } | null;
}

export default function EditAdminUserPage() {
  const params = useParams();
  const [user, setUser] = useState<AdminUserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${params.id}`);
      const json = await res.json();
      if (json.success) setUser(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-accent rounded w-48" /><div className="h-64 bg-accent rounded" /></div>;
  }

  if (!user) {
    return <div className="text-center py-8 text-sm text-muted">User not found.<br /><Link href="/admin/users" className="text-primary hover:underline mt-2 inline-block">← Back to Users</Link></div>;
  }

  const name = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : user.email.split("@")[0];

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-xs text-muted hover:text-primary transition-colors">← Back to Users</Link>

      <div>
        <h1 className="text-lg font-bold">{name}</h1>
        <p className="text-sm text-muted">{user.email} — {user.role}</p>
      </div>

      <AdminUserForm
        initialData={{
          id: user.id,
          email: user.email,
          role: user.role,
          password: "",
          firstName: user.profile?.firstName ?? "",
          lastName: user.profile?.lastName ?? "",
          phone: user.profile?.phone ?? "",
        }}
      />
    </div>
  );
}
