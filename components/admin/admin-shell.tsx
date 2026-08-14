"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export interface NavItemData {
  label: string;
  href: string;
  icon: string;
}

export interface NavGroupData {
  label: string;
  items: NavItemData[];
}

interface AdminShellProps {
  email: string;
  role: string;
  mainItems: NavItemData[];
  systemGroups: NavGroupData[];
  children: React.ReactNode;
}

export function AdminShell({
  email,
  role,
  mainItems,
  systemGroups,
  children,
}: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-accent">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-primary text-white">
        <SidebarInner
          mainItems={mainItems}
          systemGroups={systemGroups}
          onNav={() => {}}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[240px] bg-primary text-white shadow-2xl flex flex-col">
            <SidebarInner
              mainItems={mainItems}
              systemGroups={systemGroups}
              onNav={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Right column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-5 shrink-0">
          <button
            className="lg:hidden p-2 -ml-1 rounded text-muted hover:text-primary hover:bg-accent transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-5 h-5"
            >
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            </svg>
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted hidden sm:block truncate max-w-[200px]">
              {email}
            </span>
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 bg-accent border border-border rounded-sm text-muted uppercase tracking-wide shrink-0">
              {role}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 lg:p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}

/* ── Sidebar inner (shared between desktop + mobile drawer) ── */
interface SidebarInnerProps {
  mainItems: NavItemData[];
  systemGroups: NavGroupData[];
  onNav: () => void;
}

function SidebarInner({ mainItems, systemGroups, onNav }: SidebarInnerProps) {
  const pathname = usePathname();
  const [systemOpen, setSystemOpen] = useState(() =>
    systemGroups.some((g) => g.items.some((item) => isItemActive(item.href, pathname)))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0">
        <p className="text-sm font-bold tracking-[0.18em] uppercase text-white leading-none">
          HAGE CLUB
        </p>
        <p className="text-[9px] text-white/35 tracking-[0.15em] uppercase mt-1">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {mainItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isItemActive(item.href, pathname)}
              onClick={onNav}
            />
          ))}
        </div>

        {systemGroups.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <button
              onClick={() => setSystemOpen((v) => !v)}
              className="group w-full flex items-center justify-between px-3 py-1.5 mb-1"
            >
              <span className="text-[9px] text-white/30 uppercase tracking-[0.18em] group-hover:text-white/55 transition-colors">
                System
              </span>
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`w-3 h-3 text-white/30 group-hover:text-white/55 transition-all duration-200 ${
                  systemOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {systemOpen && (
              <div className="space-y-0">
                {systemGroups.map((group, gi) => (
                  <div key={group.label} className={gi > 0 ? "mt-3" : ""}>
                    <p className="px-3 pb-1 text-[9px] font-semibold text-white/25 uppercase tracking-[0.14em]">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <SidebarLink
                          key={item.href}
                          item={item}
                          active={isItemActive(item.href, pathname)}
                          onClick={onNav}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-white/10 shrink-0">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-white/35 hover:text-white/65 transition-colors"
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-3.5 h-3.5 shrink-0"
          >
            <path d="M1 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View Store
        </a>
      </div>
    </div>
  );
}

function isItemActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  // /admin/settings (root) hanya aktif jika path persis sama
  if (href === "/admin/settings") return pathname === "/admin/settings";
  return pathname.startsWith(href);
}

/* ── Individual nav link ── */
function SidebarLink({
  item,
  active,
  onClick,
  compact,
}: {
  item: NavItemData;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-3 rounded transition-colors ${
        compact ? "py-1.5 text-xs" : "py-2 text-sm"
      } ${
        active
          ? "bg-white/10 text-white"
          : "text-white/55 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      {active && (
        <span className="absolute left-0 inset-y-[6px] w-[2px] bg-white/75 rounded-r" />
      )}
      <span className="w-4 h-4 shrink-0 flex items-center justify-center">
        <AdminIcon name={item.icon} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/* ── SVG icon registry ── */
function AdminIcon({ name }: { name: string }) {
  const p = {
    viewBox: "0 0 16 16" as const,
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.5,
    className: "w-full h-full",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...p}>
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      );
    case "product":
      return (
        <svg {...p}>
          <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" />
        </svg>
      );
    case "category":
      return (
        <svg {...p}>
          <path d="M1 1h5v5H1zM10 1h5v5h-5zM1 10h5v5H1zM10 10h5v5h-5z" />
        </svg>
      );
    case "order":
      return (
        <svg {...p}>
          <path d="M2 2h12v12H2zM5 6h6M5 9h4" strokeLinecap="round" />
        </svg>
      );
    case "customer":
      return (
        <svg {...p}>
          <circle cx="8" cy="5" r="3" />
          <path d="M1 14c0-3 3-5 7-5s7 2 7 5" strokeLinecap="round" />
        </svg>
      );
    case "coupon":
      return (
        <svg {...p}>
          <path
            d="M1 6V3h3M12 3h3v3M1 10v3h3M12 13h3v-3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 5l6 6M6 5.5a.5.5 0 11-1 0 .5.5 0 011 0zM11 10.5a.5.5 0 11-1 0 .5.5 0 011 0z"
            strokeLinecap="round"
          />
        </svg>
      );
    case "inventory":
      return (
        <svg {...p}>
          <path d="M2 5h12v9H2z" />
          <path d="M5 5V3h6v2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 9h6M5 12h4" strokeLinecap="round" />
        </svg>
      );
    case "blog":
      return (
        <svg {...p}>
          <path d="M2 2h12v12H2z" />
          <path d="M5 5h6M5 8h6M5 11h3" strokeLinecap="round" />
        </svg>
      );
    case "content":
      return (
        <svg {...p}>
          <path d="M2 2h12v12H2z" />
          <path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round" />
        </svg>
      );
    case "media":
      return (
        <svg {...p}>
          <rect x="1" y="3" width="14" height="10" rx="1" />
          <circle cx="5.5" cy="6.5" r="1.5" />
          <path
            d="M1 11l4-3 3 2.5L11 7l4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "homepage":
      return (
        <svg {...p}>
          <path d="M1 8l7-6 7 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 6.5V13a1 1 0 001 1h9a1 1 0 001-1V6.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14V9h4v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "menu":
      return (
        <svg {...p}>
          <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
        </svg>
      );
    case "brand":
      return (
        <svg {...p}>
          <path d="M2 2h12v12H2z" />
          <path d="M5 8h6M8 5v6" strokeLinecap="round" />
        </svg>
      );
    case "footer":
      return (
        <svg {...p}>
          <path d="M1 2h14v10H1z" />
          <path d="M1 14h14" strokeLinecap="round" />
          <path d="M4 6h8M4 9h5" strokeLinecap="round" />
        </svg>
      );
    case "store":
      return (
        <svg {...p}>
          <path d="M1 4h14l-1.5 4H2.5L1 4z" strokeLinejoin="round" />
          <path d="M2.5 8v6h11V8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14v-4h4v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "truck":
      return (
        <svg {...p}>
          <rect x="1" y="3" width="9" height="8" rx="1" />
          <path d="M10 5.5h2.5l2 3v2.5H10v-5.5Z" strokeLinejoin="round" />
          <circle cx="4" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="11.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...p}>
          <rect x="1" y="3" width="9" height="8" rx="1" />
          <path d="M10 5.5h2.5l2 3v2.5H10v-5.5Z" strokeLinejoin="round" />
          <circle cx="4" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="11.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M1 8h4M3.5 6.5v3" strokeLinecap="round" />
        </svg>
      );
    case "payment":
      return (
        <svg {...p}>
          <rect x="1" y="3" width="14" height="10" rx="1.5" />
          <path d="M1 6h14M4 11h4" strokeLinecap="round" />
        </svg>
      );
    case "qrisly":
      return (
        <svg {...p}>
          <rect x="2" y="2" width="5" height="5" rx="0.5" />
          <rect x="9" y="2" width="5" height="5" rx="0.5" />
          <rect x="2" y="9" width="5" height="5" rx="0.5" />
          <path d="M10 9h2M9 12h2M12 11v3M14 9v2" strokeLinecap="round" />
        </svg>
      );
    case "email":
      return (
        <svg {...p}>
          <rect x="1" y="3" width="14" height="10" rx="1.5" />
          <path d="M1 6l7 4.5L15 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...p}>
          <path d="M3 13V9M7.5 13V5M12 13V7M16.5 13V3" strokeLinecap="round" />
        </svg>
      );
    case "seo":
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="5" />
          <path d="M14 14l-3-3" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <circle cx="6" cy="5" r="2.5" />
          <circle cx="11" cy="5" r="2.5" />
          <path d="M1 13c0-2.5 2-4 5-4M9 13c0-2.5 2-4 5-4" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="5" />
        </svg>
      );
  }
}
