import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";
import { hasOversizedDataUrl } from "@/lib/content-guard";

export const dynamic = "force-dynamic";

const cmsPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan dash"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  showInFooter: z.boolean(),
  sortOrder: z.number().int().min(0),
  isPublished: z.boolean(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
});

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const { id } = await ctx.params;
  const page = await db.cmsPage.findUnique({ where: { id } });
  if (!page) return error("Halaman tidak ditemukan", 404);

  return success(page);
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = cmsPageSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  if (hasOversizedDataUrl(parsed.data.content)) {
    return error(
      "Gambar terlalu besar — gunakan tombol Upload, bukan paste data URL.",
      400
    );
  }

  const existing = await db.cmsPage.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
  });
  if (existing) {
    return error(`Halaman dengan slug "${parsed.data.slug}" sudah ada.`, 409);
  }

  const page = await db.cmsPage.update({ where: { id }, data: parsed.data });
  return success(page, "Halaman diperbarui");
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const { id } = await ctx.params;
  const page = await db.cmsPage.findUnique({ where: { id } });
  if (!page) return error("Halaman tidak ditemukan", 404);

  await db.cmsPage.delete({ where: { id } });
  return success(null, "Halaman dihapus");
}
