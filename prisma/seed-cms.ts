import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_CMS_PAGES,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_CONTACT_INFO,
} from "../lib/cms-content";

const db = new PrismaClient();

// Isi awal CMS: halaman info footer + FAQ + info kontak.
// Idempotent — hanya membuat yang belum ada (upsert per slug/question).
async function main() {
  console.log("🌱 Seeding CMS content...");

  for (const page of DEFAULT_CMS_PAGES) {
    await db.cmsPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        content: page.content,
        showInFooter: page.showInFooter,
        sortOrder: page.sortOrder,
        isPublished: true,
      },
    });
    console.log(`✅ CmsPage: ${page.slug}`);
  }

  for (let i = 0; i < DEFAULT_FAQ_ITEMS.length; i++) {
    const faq = DEFAULT_FAQ_ITEMS[i];
    const existing = await db.faqItem.findFirst({
      where: { question: faq.question },
    });
    if (!existing) {
      await db.faqItem.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          sortOrder: i + 1,
          active: true,
        },
      });
    }
  }
  console.log(`✅ FaqItem: ${DEFAULT_FAQ_ITEMS.length} items`);

  const existingContact = await db.systemSetting.findUnique({
    where: { key: "contact_info" },
  });
  if (!existingContact) {
    await db.systemSetting.create({
      data: {
        key: "contact_info",
        value: JSON.stringify(DEFAULT_CONTACT_INFO),
        group: "content",
        label: "Contact Info",
        hint: "Informasi kontak halaman Kontak (JSON)",
      },
    });
    console.log("✅ SystemSetting: contact_info");
  } else {
    console.log("⏭️  SystemSetting contact_info sudah ada");
  }

  console.log("🌱 Seed CMS selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
