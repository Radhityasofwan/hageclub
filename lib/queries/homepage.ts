import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { HomepageSection } from "@prisma/client";

export type SectionWithContent = Pick<
  HomepageSection,
  "id" | "type" | "title" | "subtitle" | "content" | "sortOrder" | "active"
>;

const SECTION_SELECT = {
  id: true,
  type: true,
  title: true,
  subtitle: true,
  content: true,
  sortOrder: true,
  active: true,
} as const;

export const getActiveSections = unstable_cache(
  async (): Promise<SectionWithContent[]> => {
    try {
      return await db.homepageSection.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: SECTION_SELECT,
      });
    } catch {
      return [];
    }
  },
  ["homepage-active-sections"],
  { revalidate: 300, tags: ["homepage"] }
);

export const getAllSections = unstable_cache(
  async (): Promise<SectionWithContent[]> => {
    return db.homepageSection.findMany({
      orderBy: { sortOrder: "asc" },
      select: SECTION_SELECT,
    });
  },
  ["homepage-all-sections"],
  { revalidate: 60, tags: ["homepage"] }
);
