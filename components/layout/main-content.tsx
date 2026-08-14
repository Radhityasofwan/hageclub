"use client";

import { usePathname } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";

const ANNOUNCEMENT_HEIGHT = 36;
const HEADER_HEIGHT = 64;

export function MainContent({ children }: { children: React.ReactNode }) {
  // Pathname dari client (reaktif) — prop dari layout server stale saat navigasi client-side
  const isHome = usePathname() === "/";
  const announcementVisible = useUiStore((s) => s.announcementVisible);
  const announcementClosing = useUiStore((s) => s.announcementClosing);
  const announcementEntered = useUiStore((s) => s.announcementEntered);

  // Sinkron dengan announcement bar — konten ikut turun/naik halus.
  // Di landing page padding dihilangkan agar hero full-bleed di bawah navbar transparan.
  const announcementShown =
    announcementVisible && !announcementClosing && announcementEntered;
  const paddingTop = isHome
    ? announcementShown
      ? ANNOUNCEMENT_HEIGHT
      : 0
    : announcementShown
      ? ANNOUNCEMENT_HEIGHT + HEADER_HEIGHT
      : HEADER_HEIGHT;

  return (
    <main
      style={{
        paddingTop,
        transition: "padding-top 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="min-h-screen"
    >
      {children}
    </main>
  );
}
