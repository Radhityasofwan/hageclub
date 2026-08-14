/**
 * WhatsApp click-to-chat URL builder.
 * Nomor dan pesan diambil dari SystemSetting atau env fallback.
 */

export function getWhatsappUrl(
  number: string | null,
  message?: string
): string | null {
  if (!number) return null;
  const clean = number.replace(/[^0-9]/g, "");
  if (!clean) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${text}`;
}

export function getWhatsappNumber(setting: string | null): string | null {
  if (setting) return setting.replace(/[^0-9]/g, "");
  return null;
}
