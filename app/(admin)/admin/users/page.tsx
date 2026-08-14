"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "CS";
  createdAt: string;
  profile: { firstName: string; lastName: string; phone: string | null } | null;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "text-destructive bg-destructive/10",
  EDITOR: "text-info bg-blue-50",
  CS: "text-warning bg-warning/10",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      const data = json.data ?? {};
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(1); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchData(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Admin Users</h1>
          <p className="text-sm text-muted">{total} total admin users</p>
        </div>
        <Link href="/admin/users/new">
          <Button>+ New User</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email..."
              className="h-9 px-3 border border-border rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); }}
              className="h-9 px-3 border border-border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="CS">Customer Service</option>
            </select>
          </div>
          <button type="submit" className="h-9 px-4 bg-accent rounded text-sm font-medium hover:bg-accent/70 transition-colors">
            Search
          </button>
        </form>
        {roleFilter && (
          <button onClick={() => { setRoleFilter(""); fetchData(1); }} className="h-9 px-3 text-xs text-muted hover:text-primary">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Phone</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-primary hover:underline">
                      {u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_STYLES[u.role] ?? ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{u.profile?.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted">{formatDateTime(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/users/${u.id}`}>
                      <button className="text-xs text-primary hover:underline">Edit</button>
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    {loading ? "Loading..." : "No admin users found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && <button onClick={() => fetchData(page - 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Previous</button>}
              {page < totalPages && <button onClick={() => fetchData(page + 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Next</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
