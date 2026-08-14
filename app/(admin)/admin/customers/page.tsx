"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { formatPrice, formatDateTime } from "@/lib/utils";

type Segment = "NEW" | "REGULAR" | "VIP";

interface Customer {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  phone: string | null;
  totalOrders: number;
  paidOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  joinedAt: string;
  segment: Segment;
}

const SEGMENT_STYLE: Record<Segment, string> = {
  VIP: "text-amber-700 bg-amber-50 border-amber-200",
  REGULAR: "text-blue-700 bg-blue-50 border-blue-200",
  NEW: "text-muted bg-accent border-border",
};

function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
}

const SORT_OPTIONS = [
  { value: "joined_desc", label: "Terbaru bergabung" },
  { value: "spent_desc", label: "Pengeluaran terbesar" },
  { value: "orders_desc", label: "Order terbanyak" },
  { value: "last_order_desc", label: "Order terakhir" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("");
  const [sort, setSort] = useState("joined_desc");
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchData(p = 1, s = search, seg = segment, srt = sort) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20", sort: srt });
      if (s) params.set("search", s);
      if (seg) params.set("segment", seg);
      const res = await fetch(`/api/admin/customers?${params}`);
      const json = await res.json();
      const data = json.data ?? {};
      setCustomers(data.customers ?? []);
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

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchData(1, val, segment, sort), 400);
  }

  function handleSegment(val: string) {
    setSegment(val);
    fetchData(1, search, val, sort);
  }

  function handleSort(val: string) {
    setSort(val);
    fetchData(1, search, segment, val);
  }

  function exportCSV() {
    const header = "Name,Email,Phone,Verified,Segment,Orders,Paid Orders,Total Spent,Last Order,Joined";
    const rows = customers.map((c) =>
      [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone ?? ""}"`,
        c.emailVerified ? "Yes" : "No",
        c.segment,
        c.totalOrders,
        c.paidOrders,
        c.totalSpent,
        c.lastOrderAt ? `"${formatDateTime(c.lastOrderAt)}"` : "",
        `"${formatDateTime(c.joinedAt)}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Customers</h1>
          <p className="text-sm text-muted">{total} customer terdaftar</p>
        </div>
        <button
          onClick={exportCSV}
          className="h-9 px-4 border border-border rounded text-xs font-medium hover:bg-accent transition-colors shrink-0"
        >
          Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded p-4">
          <p className="text-xs text-muted mb-1">Total Customer</p>
          <p className="text-xl font-bold">{total}</p>
        </div>
        <div className="bg-white border border-border rounded p-4">
          <p className="text-xs text-muted mb-1">Total Revenue</p>
          <p className="text-xl font-bold">{formatPrice(totalSpentAll)}</p>
        </div>
        <div className="bg-white border border-border rounded p-4">
          <p className="text-xs text-muted mb-1">Avg / Customer</p>
          <p className="text-xl font-bold">{total > 0 ? formatPrice(Math.floor(totalSpentAll / total)) : "Rp 0"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Segment chips */}
        <div className="flex gap-1.5">
          {["", "VIP", "REGULAR", "NEW"].map((s) => (
            <button
              key={s}
              onClick={() => handleSegment(s)}
              className={`h-8 px-3 rounded text-xs font-medium border transition-colors ${
                segment === s
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border text-muted hover:bg-accent"
              }`}
            >
              {s || "Semua"}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari nama, email, telepon..."
          className="h-8 px-3 border border-border rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          className="h-8 px-2 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Kontak</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Segment</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Orders</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Total Spent</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Order Terakhir</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/admin/customers/${c.id}`} className="font-medium text-primary hover:underline text-xs">
                          {c.name}
                        </Link>
                        {!c.emailVerified && (
                          <span className="ml-1.5 text-[10px] text-amber-600 bg-amber-50 px-1 rounded">unverified</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-muted">{c.email}</p>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted">{c.phone}</p>
                        <a
                          href={`https://wa.me/${toWaNumber(c.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-semibold bg-[#25D366] text-white hover:bg-[#20BD5C] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                            <path d="M10 1C5.03 1 1 5.03 1 10c0 1.56.41 3.12 1.19 4.5L1 19l4.66-1.19A8.96 8.96 0 0010 19c4.97 0 9-4.03 9-9s-4.03-9-9-9zm4.4 12.6c-.18.5-.9.95-1.47 1.07-.38.08-.88.14-2.57-.55-2.15-.87-3.54-3.04-3.64-3.18-.1-.14-.83-1.1-.83-2.1 0-1 .52-1.49.71-1.7.18-.2.4-.25.53-.25h.38c.12 0 .29-.05.45.35l.64 1.56c.05.12.08.27.02.41l-.23.45-.34.35c-.1.1-.21.21-.09.41.59.98 1.33 1.62 2.32 2.08.2.1.32.08.44-.05l.47-.55c.12-.14.24-.12.4-.07l1.53.72c.18.08.12.12.33.2.05.34-.1.74-.28 1.24z" />
                          </svg>
                          WA
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SEGMENT_STYLE[c.segment]}`}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-medium">{c.paidOrders}</span>
                    {c.totalOrders !== c.paidOrders && (
                      <span className="text-xs text-muted ml-1">/{c.totalOrders}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-sm">{formatPrice(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted">
                    {c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted">{formatDateTime(c.joinedAt)}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">
                    {loading ? "Memuat..." : "Tidak ada customer ditemukan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <button onClick={() => fetchData(page - 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">
                  ← Prev
                </button>
              )}
              {page < totalPages && (
                <button onClick={() => fetchData(page + 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted">
        <span>Segment: <strong className="text-amber-700">VIP</strong> ≥ Rp5jt paid · <strong className="text-blue-700">REGULAR</strong> ≥ 2 order · <strong>NEW</strong> sisanya</span>
        <span>Orders: <strong>paid</strong>/total</span>
      </div>
    </div>
  );
}
