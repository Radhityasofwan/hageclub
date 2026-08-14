import { NextRequest } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// GET /api/payments/qr?data=<qr_string>&size=300 — render QR code PNG
// dipakai untuk menampilkan QRIS di halaman sukses checkout
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data") ?? "";
  const size = Math.min(1024, Math.max(96, Number(searchParams.get("size") ?? "300") || 300));

  if (!data || data.length > 20000) {
    return new Response("Missing or invalid data", { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(data, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[GET /api/payments/qr]", err);
    return new Response("Failed to generate QR", { status: 500 });
  }
}
