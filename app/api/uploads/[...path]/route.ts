import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
};

// GET /api/uploads/[...path] — serve file upload runtime dari public/uploads.
// Static layer hosting hanya menyajikan file dari snapshot deploy; file yang
// ditulis saat runtime hanya bisa dilayani dari dalam app.
// UPLOAD_DIR: direktori persisten di luar build (hosting mengganti direktori
// app tiap deploy); fallback ke public/uploads bila tidak diset.
export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path ?? [];
  if (segments.some((s) => s === ".." || s.includes("\\"))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const uploadsRoot =
    process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadsRoot, ...segments);
  if (!filePath.startsWith(uploadsRoot + path.sep)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const body = fs.readFileSync(filePath);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
