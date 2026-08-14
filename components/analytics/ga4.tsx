"use client";

import Script from "next/script";

interface GA4Props {
  measurementId: string | null;
}

export function GA4({ measurementId }: GA4Props) {
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}', {cookie_flags: 'SameSite=None;Secure'});`}
      </Script>
    </>
  );
}
