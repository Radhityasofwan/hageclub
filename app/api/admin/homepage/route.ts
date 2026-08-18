import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasOversizedDataUrl } from "@/lib/content-guard";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sections = await db.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: sections });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, title, subtitle, content, active } = body;

    if (!type) {
      return NextResponse.json({ message: "Type is required" }, { status: 400 });
    }

    if (content && hasOversizedDataUrl(content)) {
      return NextResponse.json(
        { message: "Gambar terlalu besar — gunakan tombol Upload, bukan paste data URL." },
        { status: 400 }
      );
    }

    const validTypes = ["hero", "catalog", "features", "brand_story", "testimonials", "banner", "stats"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ message: `Invalid type: ${type}` }, { status: 400 });
    }

    // Get the highest sort order
    const last = await db.homepageSection.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const section = await db.homepageSection.create({
      data: {
        type,
        title: title ?? "",
        subtitle: subtitle ?? "",
        content: content ?? {},
        sortOrder: (last?.sortOrder ?? -1) + 1,
        active: active ?? true,
      },
    });

    revalidateTag("homepage");
    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    console.error("Error creating homepage section:", error);
    return NextResponse.json({ message: "Failed to create section" }, { status: 500 });
  }
}
