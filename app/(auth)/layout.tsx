import Link from "next/link";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <I18nProvider locale={locale}>
      <div className="min-h-screen bg-accent flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="text-xl font-bold tracking-widest mb-8">
          HAGE CLUB
        </Link>
        <div className="w-full max-w-sm bg-white border border-border rounded-sm p-6 sm:p-8">
          {children}
        </div>
      </div>
    </I18nProvider>
  );
}
