import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasOversizedDataUrl } from "@/lib/content-guard";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await db.homepageSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, subtitle, content, sortOrder, active } = body;

    if (content && hasOversizedDataUrl(content)) {
      return NextResponse.json(
        { message: "Gambar terlalu besar — gunakan tombol Upload, bukan paste data URL." },
        { status: 400 }
      );
    }

    const section = await db.homepageSection.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content !== undefined && { content }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ data: section });
  } catch (error) {
    console.error("Error updating homepage section:", error);
    return NextResponse.json({ message: "Failed to update section" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await db.homepageSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 });
    }

    const body = await request.json();

    // Toggle active state if no explicit value
    if (body.active === undefined && Object.keys(body).length === 0) {
      body.active = !existing.active;
    }

    const section = await db.homepageSection.update({
      where: { id },
      data: {
        ...(body.active !== undefined && { active: Boolean(body.active) }),
      },
    });

    return NextResponse.json({ data: section });
  } catch (error) {
    console.error("Error toggling homepage section:", error);
    return NextResponse.json({ message: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await db.homepageSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 });
    }

    await db.homepageSection.delete({ where: { id } });

    return NextResponse.json({ message: "Section deleted" });
  } catch (error) {
    console.error("Error deleting homepage section:", error);
    return NextResponse.json({ message: "Failed to delete section" }, { status: 500 });
  }
}
