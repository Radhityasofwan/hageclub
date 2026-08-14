import type { Metadata } from "next";
import { getFaqItems } from "@/lib/cms";
import { FaqAccordionList } from "@/components/cms/faq-accordion";
import { buildFAQSchema } from "@/lib/schema";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ — HAGE CLUB",
  description: "Pertanyaan yang sering diajukan tentang HAGE CLUB — produk, pengiriman, pembayaran, dan pengembalian.",
};

export default async function FAQPage() {
  const { t } = await getI18n();
  const items = await getFaqItems();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: buildFAQSchema(
            items.map((f) => ({ question: f.question, answer: f.answer }))
          ),
        }}
      />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold">{t("faq.title")}</h1>
          <p className="text-sm text-muted mt-2">{t("faq.subtitle")}</p>
        </div>

        <FaqAccordionList
          items={items.map((f) => ({ question: f.question, answer: f.answer }))}
        />
      </div>
    </>
  );
}
