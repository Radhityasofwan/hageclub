import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { getI18n } from "@/lib/i18n/server";
import { getContactInfo } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kontak — HAGE CLUB",
  description: "Hubungi HAGE CLUB melalui WhatsApp, email, atau form kontak.",
};

export default async function ContactPage() {
  const { t } = await getI18n();
  const info = await getContactInfo();

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold">{t("contact.title")}</h1>
        <p className="text-sm text-muted mt-2">
          {t("contact.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-10">
        {/* Form */}
        <div className="bg-white border border-border rounded p-6">
          <ContactForm />
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          {/* WhatsApp */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">WhatsApp</h3>
            <p className="text-xs text-muted mt-1">
              <a
                href={info.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {info.whatsapp.label}
              </a>
            </p>
            {info.whatsapp.note && (
              <p className="text-[10px] text-muted mt-0.5">{info.whatsapp.note}</p>
            )}
          </div>

          {/* Email */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">{t("contact.email")}</h3>
            <p className="text-xs text-muted mt-1">
              <a href={`mailto:${info.email.label}`} className="text-primary hover:underline">
                {info.email.label}
              </a>
            </p>
            {info.email.note && (
              <p className="text-[10px] text-muted mt-0.5">{info.email.note}</p>
            )}
          </div>

          {/* Phone */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">{t("contact.phoneLabel")}</h3>
            <p className="text-xs text-muted mt-1">
              <a href="tel:+62211234567" className="text-primary hover:underline">
                {info.phone.label}
              </a>
            </p>
            {info.phone.note && (
              <p className="text-[10px] text-muted mt-0.5">{info.phone.note}</p>
            )}
          </div>

          {/* Address */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">{t("contact.address")}</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {info.address.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>

          {/* Business Hours */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">{t("contact.businessHours")}</h3>
            <div className="mt-2 text-xs text-muted space-y-1">
              {info.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-3">
                  <span>{h.days}</span>
                  <span>{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">{t("contact.socialMedia")}</h3>
            <div className="mt-2 space-y-1 text-xs text-muted">
              {info.social.map((s) => (
                <p key={s.platform}>
                  {s.platform}: {s.handle}
                </p>
              ))}
            </div>
          </div>

          {/* Response Time */}
          <div className="border border-border rounded p-5 bg-white">
            <h3 className="text-sm font-bold">{t("contact.responseTime")}</h3>
            <p className="text-xs text-muted mt-1">{info.responseTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
