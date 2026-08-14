"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Tombol back navbar: kembali ke halaman sebelumnya yang benar-benar dikunjungi
 * dalam sesi ini. `window.history.state.idx` (mekanisme lama Next.js) tidak
 * andal di App Router, jadi riwayat pathname dilacak sendiri. Saat halaman
 * dibuka langsung (refresh/deep link) riwayat sesi kosong — fallback ke
 * riwayat browser (router.back()), beranda hanya jika tidak ada riwayat sama
 * sekali (tab baru).
 */
export function useSmartBack() {
  const router = useRouter();
  const pathname = usePathname();
  const visitedRef = useRef<string[]>([pathname]);

  useEffect(() => {
    const stack = visitedRef.current;
    const lastIdx = stack.lastIndexOf(pathname);
    if (lastIdx !== -1 && lastIdx !== stack.length - 1) {
      // browser back/forward — potong riwayat ke posisi yang dikunjungi lagi
      stack.length = lastIdx + 1;
    } else if (stack[stack.length - 1] !== pathname) {
      stack.push(pathname);
      if (stack.length > 40) stack.shift(); // batasi agar tidak tumbuh tanpa batas
    }
  }, [pathname]);

  const goBack = useCallback(() => {
    const stack = visitedRef.current;
    const previous = [...stack].reverse().find((p) => p !== pathname);
    if (previous) {
      router.push(previous);
      return;
    }
    // Halaman dibuka langsung / di-refresh: ikuti riwayat browser asli supaya
    // kembali ke halaman sebelumnya, bukan melompat ke beranda.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [pathname, router]);

  return goBack;
}
