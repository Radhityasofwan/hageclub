import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
});

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  const item = await db.faqItem.findUnique({ where: { id } });
  if (!item) return error("FAQ tidak ditemukan", 404);

  const updated = await db.faqItem.update({ where: { id }, data: parsed.data });
  return success(updated, "FAQ diperbarui");
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const { id } = await ctx.params;
  const item = await db.faqItem.findUnique({ where: { id } });
  if (!item) return error("FAQ tidak ditemukan", 404);

  await db.faqItem.delete({ where: { id } });
  return success(null, "FAQ dihapus");
}
