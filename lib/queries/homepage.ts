import { db } from "@/lib/db";
import type { HomepageSection } from "@prisma/client";

export type SectionWithContent = Pick<
  HomepageSection,
  "id" | "type" | "title" | "subtitle" | "content" | "sortOrder" | "active"
>;

export async function getActiveSections(): Promise<SectionWithContent[]> {
  try {
    return await db.homepageSection.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        content: true,
        sortOrder: true,
        active: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getAllSections(): Promise<SectionWithContent[]> {
  const sections = await db.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      type: true,
      title: true,
      subtitle: true,
      content: true,
      sortOrder: true,
      active: true,
    },
  });
  return sections;
}
