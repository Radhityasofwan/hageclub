import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/seo/[page]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { page } = await params;
    const setting = await db.seoSetting.findUnique({ where: { page } });

    return success(setting);
  } catch (err) {
    console.error("[GET /api/admin/seo/[page]]", err);
    return error("Failed to fetch SEO setting", 500);
  }
}

// PUT /api/admin/seo/[page] — upsert SEO setting
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { page } = await params;
    const body = await request.json();
    const { seoTitle, metaDescription, ogImage, canonicalUrl, robots, structuredData } = body;

    const data: Prisma.SeoSettingCreateInput = {
      page,
      seoTitle: seoTitle ?? null,
      metaDescription: metaDescription ?? null,
      ogImage: ogImage ?? null,
      canonicalUrl: canonicalUrl ?? null,
      robots: robots ?? null,
      structuredData: structuredData ?? null,
    };

    // Fix: Prisma's createInput includes page, but upsert needs valid create fields
    const setting = await db.seoSetting.upsert({
      where: { page },
      update: {
        seoTitle: data.seoTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        canonicalUrl: data.canonicalUrl,
        robots: data.robots,
        structuredData: data.structuredData as Prisma.InputJsonValue,
      },
      create: {
        page,
        seoTitle: data.seoTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        canonicalUrl: data.canonicalUrl,
        robots: data.robots,
        structuredData: data.structuredData as Prisma.InputJsonValue,
      },
    });

    return success(setting, "SEO setting saved");
  } catch (err) {
    console.error("[PUT /api/admin/seo/[page]]", err);
    return error("Failed to save SEO setting", 500);
  }
}
