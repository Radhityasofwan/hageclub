import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/cron/publish-scheduled
// Protected by Bearer token matching CRON_SECRET env variable
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const result = await db.blogPost.updateMany({
      where: {
        status: "SCHEDULED",
        publishedAt: { lte: now },
      },
      data: { status: "PUBLISHED" },
    });

    return Response.json({
      success: true,
      published: result.count,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("[CRON publish-scheduled]", err);
    return Response.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}
