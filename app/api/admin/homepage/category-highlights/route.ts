import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, banner: true },
  });

  // For each category: resolve the image that will actually appear on homepage
  const results = await Promise.all(
    categories.map(async (cat) => {
      if (cat.banner) {
        return { ...cat, highlightImage: cat.banner, source: "banner" as const };
      }

      // Fallback: cover image of first featured (or newest) product in this category
      const product = await db.product.findFirst({
        where: { status: "PUBLISHED", category: { id: cat.id } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: {
          name: true,
          featured: true,
          images: {
            where: { isCover: true },
            take: 1,
            select: { url: true },
          },
        },
      });

      const img = product?.images[0]?.url ?? null;
      return {
        ...cat,
        highlightImage: img,
        source: img
          ? product?.featured
            ? ("featured_product" as const)
            : ("newest_product" as const)
          : ("none" as const),
      };
    })
  );

  return success(results);
}
