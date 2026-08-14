"use client";

import { useCallback, useState } from "react";

// Durasi default = durasi .sheet-transition di globals.css (350ms)
const DEFAULT_EXIT_MS = 350;

/**
 * Pola seragam untuk animasi keluar bottom sheet/modal yang di-render
 * secara conditional (`if (!open) return null`): pertahankan elemen tetap
 * ter-mount selama durasi keluar, baru panggil onClose sesudahnya.
 */
export function useSheetExit(isOpen: boolean, onClose: () => void, exitMs = DEFAULT_EXIT_MS) {
  const [leaving, setLeaving] = useState(false);

  const handleClose = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      onClose();
      setLeaving(false);
    }, exitMs);
  }, [leaving, onClose, exitMs]);

  return { leaving, handleClose, visible: isOpen || leaving };
}
