import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SECRET = "hageclub-db-patch-2026";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Add missing Profile columns
  const patches: Array<{ key: string; sql: string }> = [
    {
      key: "Profile.city",
      sql: "ALTER TABLE `Profile` ADD COLUMN `city` VARCHAR(191) NULL",
    },
    {
      key: "Profile.birthDate",
      sql: "ALTER TABLE `Profile` ADD COLUMN `birthDate` DATETIME(3) NULL",
    },
    {
      key: "Profile.adminNotes",
      sql: "ALTER TABLE `Profile` ADD COLUMN `adminNotes` LONGTEXT NULL",
    },
  ];

  for (const { key, sql } of patches) {
    try {
      await db.$executeRawUnsafe(sql);
      results[key] = "added";
    } catch (err) {
      const msg = (err as Error)?.message ?? "";
      // Duplicate column = already exists, that's fine
      if (msg.includes("Duplicate column")) {
        results[key] = "already_exists";
      } else {
        results[key] = `error: ${msg.substring(0, 200)}`;
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
