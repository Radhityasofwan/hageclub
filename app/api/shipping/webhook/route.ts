import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSettingValues } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Webhook Komship Delivery — Komerce PUT {order_no, cnote, status} ke URL ini
// (daftarkan URL di dashboard Komerce atau via tombol "Daftarkan Webhook" di
// Settings → Pengiriman). Wajib merespons 200 agar Komerce tidak mengirim
// ulang; kegagalan dicatat di log server, bukan ditolak balik.
const VALID_STATUSES = ["Diajukan", "Dijemput", "Dikirim", "Dibatalkan", "Selesai"];

export async function POST(request: NextRequest) {
  return handleWebhook(request);
}

export async function PUT(request: NextRequest) {
  return handleWebhook(request);
}

// Verifikasi opsional (defense-in-depth) — dokumentasi resmi section 15 TIDAK
// mewajibkan tanda tangan, jadi alur resmi tidak pernah diputus:
// 1. Bila request membawa x-webhook-secret → wajib cocok dengan
//    rajaongkir_webhook_secret (env/DB). Salah → 401.
// 2. Bila request membawa x-api-key / x-callback-api-key → wajib cocok dengan
//    komship_api_key. Salah → 401.
// 3. Tanpa header auth → diterima (sesuai dokumen), tercatat di log.
async function isWebhookAuthorized(request: NextRequest): Promise<boolean> {
  const { rajaongkir_webhook_secret: secret, komship_api_key: komshipKey } =
    await getSettingValues(["rajaongkir_webhook_secret", "komship_api_key"]);

  const sentSecret = request.headers.get("x-webhook-secret");
  if (sentSecret) {
    if (!secret || sentSecret !== secret) {
      console.error("[webhook komship] ditolak: x-webhook-secret tidak cocok");
      return false;
    }
    return true;
  }

  const sentKey =
    request.headers.get("x-api-key") ??
    request.headers.get("x-callback-api-key");
  if (sentKey) {
    if (!komshipKey || sentKey !== komshipKey) {
      console.error("[webhook komship] ditolak: API key tidak cocok");
      return false;
    }
    return true;
  }

  return true;
}

async function handleWebhook(request: NextRequest) {
  if (!(await isWebhookAuthorized(request))) {
    return new Response(JSON.stringify({ success: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    console.error("[webhook komship] invalid JSON body");
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const orderNo = typeof body.order_no === "string" ? body.order_no : "";
  const cnote = typeof body.cnote === "string" ? body.cnote : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!orderNo) {
    console.error("[webhook komship] missing order_no", body);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const order = await db.order.findFirst({ where: { deliveryOrderNo: orderNo } });
    if (!order) {
      console.error(`[webhook komship] order ${orderNo} tidak ditemukan (deliveryOrderNo)`);
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: { deliveryStatus?: string; trackingNumber?: string } = {};
    if (VALID_STATUSES.includes(status)) data.deliveryStatus = status;
    if (cnote && cnote !== order.trackingNumber) data.trackingNumber = cnote;

    if (Object.keys(data).length > 0) {
      await db.order.update({ where: { id: order.id }, data });
      console.log(
        `[webhook komship] ${order.orderNumber}: status="${status}" cnote="${cnote || "-"}"`
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Tetap 200: kesalahan internal tidak boleh memicu retry webhook dari Komerce
    console.error("[webhook komship] error:", err);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
