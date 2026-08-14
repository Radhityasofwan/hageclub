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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const items = await db.faqItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return success(items);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  const item = await db.faqItem.create({ data: parsed.data });
  return success(item, "FAQ ditambahkan", 201);
}
