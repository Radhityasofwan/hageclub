// Guard untuk mencegah data URL base64 raksasa masuk ke kolom content/JSON —
// baris DB yang sangat besar bisa membuat MySQL filesort meledak (error 1038).
const MAX_DATA_URL_LEN = 100 * 1024;

export function hasOversizedDataUrl(value: unknown, limit = MAX_DATA_URL_LEN): boolean {
  if (typeof value === "string") {
    return value.startsWith("data:image") && value.length > limit;
  }
  if (Array.isArray(value)) return value.some((v) => hasOversizedDataUrl(v, limit));
  if (value && typeof value === "object") {
    return Object.values(value).some((v) => hasOversizedDataUrl(v, limit));
  }
  return false;
}
