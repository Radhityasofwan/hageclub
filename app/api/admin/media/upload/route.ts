import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import { success, error } from "@/lib/api-response";
import * as fs from "fs";
import * as path from "path";

// POST /api/admin/media/upload
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return error("No file provided", 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG", 400);
    }

    // Validate file size (max 40MB)
    const maxSize = 40 * 1024 * 1024;
    if (file.size > maxSize) {
      return error("File too large. Max 40MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== "your-cloud-name";

    let url: string;
    let publicId: string;

    if (hasCloudinary) {
      const result = await uploadImage(buffer, folder);
      url = result.url;
      publicId = result.publicId;
    } else {
      // Mode lokal (tanpa Cloudinary): simpan sebagai file di public/uploads —
      // URL pendek agar muat di content JSON (base64 raksasa ditolak content-guard).
      const MIME_EXT: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
      };
      const ext = MIME_EXT[file.type] ?? "bin";
      const baseName =
        path
          .basename(file.name, path.extname(file.name))
          .replace(/[^a-z0-9-_]/gi, "")
          .slice(0, 40) || "image";
      const fileName = `${Date.now()}-${baseName}.${ext}`;
      const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
      const subDir = safeFolder && safeFolder !== "uploads" ? safeFolder : "";
      const dir = path.join(process.cwd(), "public", "uploads", subDir);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), buffer);
      url = `/uploads/${subDir ? subDir + "/" : ""}${fileName}`;
      publicId = fileName;
    }

    const media = await db.media.create({
      data: {
        url,
        publicId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        folder,
        uploadedBy: session.user.id,
      },
    });

    return success(media, "File uploaded", 201);
  } catch (err) {
    console.error("[POST /api/admin/media/upload]", err);
    return error("Failed to upload file", 500);
  }
}
