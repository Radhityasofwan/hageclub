import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/seo — list all SEO settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const settings = await db.seoSetting.findMany({
      orderBy: { page: "asc" },
    });

    return success(settings);
  } catch (err) {
    console.error("[GET /api/admin/seo]", err);
    return error("Failed to fetch SEO settings", 500);
  }
}
