import type { Metadata } from "next";
import { getFaqItems } from "@/lib/cms";
import { FaqAccordionList } from "@/components/cms/faq-accordion";
import { buildFAQSchema } from "@/lib/schema";
import { TranslatedText } from "@/components/ui/translated-text";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FAQ — HAGE CLUB",
  description: "Pertanyaan yang sering diajukan tentang HAGE CLUB — produk, pengiriman, pembayaran, dan pengembalian.",
};

export default async function FAQPage() {
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
          <h1 className="text-2xl font-bold"><TranslatedText k="faq.title" /></h1>
          <p className="text-sm text-muted mt-2"><TranslatedText k="faq.subtitle" /></p>
        </div>

        <FaqAccordionList
          items={items.map((f) => ({ question: f.question, answer: f.answer }))}
        />
      </div>
    </>
  );
}
