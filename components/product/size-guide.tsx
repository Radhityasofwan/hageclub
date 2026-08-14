"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/client";

interface SizeGuideProps {
  imageUrl?: string | null;
}

export function SizeGuide({ imageUrl }: SizeGuideProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Tidak tampil jika admin belum upload gambar panduan ukuran
  if (!imageUrl) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline underline-offset-2 hover:text-foreground transition-colors"
      >
        {t("product.sizeGuide")}
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("product.sizeGuide")}
        size="lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={t("product.sizeGuide")}
          className="w-full h-auto object-contain rounded-sm"
        />
      </Modal>
    </>
  );
}
