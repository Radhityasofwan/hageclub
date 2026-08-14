import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    redirect("/verify-email?error=missing_token");
  }

  try {
    const record = await db.emailVerificationToken.findUnique({ where: { token } });

    if (!record) {
      redirect("/verify-email?error=invalid_token");
    }

    if (record.usedAt) {
      redirect("/verify-email?error=already_used");
    }

    if (record.expiresAt < new Date()) {
      redirect("/verify-email?error=expired");
    }

    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      db.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    redirect("/verify-email?success=1");
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[verify-email]", err);
    redirect("/verify-email?error=server_error");
  }
}
