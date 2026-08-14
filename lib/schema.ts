const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ProductSchemaOpts {
  name: string;
  description: string;
  sku: string;
  price: number;
  currency?: string;
  images: string[];
  url: string;
  brand?: string;
  category?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  condition?: "NewCondition" | "UsedCondition";
}

interface ArticleSchemaOpts {
  headline: string;
  description: string | null;
  author: string;
  datePublished: string;
  image: string | null;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function buildOrganizationSchema(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HAGE CLUB",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Premium automotive lifestyle fashion brand.",
    foundingDate: "2025",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@hageclub.com",
    },
    sameAs: [
      "https://instagram.com/hageclub",
      "https://tiktok.com/@hageclub",
    ],
  });
}

export function buildWebsiteSchema(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HAGE CLUB",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

export function buildProductSchema(opts: ProductSchemaOpts): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    sku: opts.sku,
    image: opts.images,
    url: opts.url,
    brand: {
      "@type": "Brand",
      name: opts.brand ?? "HAGE CLUB",
    },
    ...(opts.category && { category: opts.category }),
    offers: {
      "@type": "Offer",
      price: opts.price,
      priceCurrency: opts.currency ?? "IDR",
      availability: `https://schema.org/${opts.availability ?? "InStock"}`,
      itemCondition: `https://schema.org/${opts.condition ?? "NewCondition"}`,
      url: opts.url,
    },
  });
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

export function buildArticleSchema(opts: ArticleSchemaOpts): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    author: {
      "@type": "Person",
      name: opts.author,
    },
    datePublished: opts.datePublished,
    ...(opts.image && { image: opts.image }),
    publisher: {
      "@type": "Organization",
      name: "HAGE CLUB",
      logo: `${BASE_URL}/logo.png`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": opts.url,
    },
  });
}

export function buildFAQSchema(faqs: FAQItem[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });
}

export function buildWebPageSchema(opts: {
  name: string;
  description?: string;
  url?: string;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    ...(opts.description && { description: opts.description }),
    ...(opts.url && { url: opts.url }),
    publisher: {
      "@type": "Organization",
      name: "HAGE CLUB",
    },
  });
}
