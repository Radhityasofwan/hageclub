import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { searchDestinations, KomshipError } from "@/lib/komship";

export const dynamic = "force-dynamic";

// GET /api/admin/komship/destinations?q= — pencarian lokasi Komship (origin picker)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return success([]);
  }

  try {
    const list = await searchDestinations(q);
    return success(list, undefined, 200);
  } catch (err) {
    console.error("[GET /api/admin/komship/destinations]", err);
    if (err instanceof KomshipError && err.code === "NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, message: err.message, code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    return error(err instanceof Error ? err.message : "Gagal mencari lokasi.", 502);
  }
}
