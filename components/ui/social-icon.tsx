export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string | null;
}

interface SocialIconProps {
  platform: string;
  icon: string | null;
  label: string;
}

/**
 * Renders a custom uploaded icon OR the built-in SVG for a known platform.
 * Sizing is controlled by the parent container — wrap in a sized element.
 */
export function SocialIcon({ platform, icon, label }: SocialIconProps) {
  if (icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={label}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }
  return <BuiltInSvg platform={platform} />;
}

function BuiltInSvg({ platform }: { platform: string }) {
  const p = platform.toLowerCase();

  if (p === "instagram") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <rect x="2" y="2" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14.5" cy="5.5" r="1" fill="currentColor" />
    </svg>
  );

  if (p === "tiktok") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M13.5 4a3 3 0 003 3v2a5 5 0 01-3-1v5a4 4 0 11-4-4h1v2h-1a2 2 0 102 2V4h2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );

  if (p === "whatsapp") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M10 3a7 7 0 015.9 10.7L17 17l-3.3-1.1A7 7 0 1110 3z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M7.5 8c0-.3.2-.5.5-.5h.5c.3 0 .5.2.5.5l.5 1.5-.5.5a4 4 0 002 2l.5-.5 1.5.5c.3 0 .5.2.5.5v.5c0 .3-.2.5-.5.5C10 13.5 7.5 11 7.5 8z"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );

  if (p === "email") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (p === "youtube") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M17.5 6A2.5 2.5 0 0015 3.5H5A2.5 2.5 0 002.5 6v8A2.5 2.5 0 005 16.5h10a2.5 2.5 0 002.5-2.5V6z"
        stroke="currentColor" strokeWidth="1.5"
      />
      <path d="M8.5 7.5l5 2.5-5 2.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );

  if (p === "twitter" || p === "x") return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "100%", height: "100%" }}>
      <path d="M3.5 3.5h2.8l2.9 4 3.5-4H15l-4.5 5.2L16.5 17h-2.8l-3.2-4.3L6.5 17H4l4.8-5.5L3.5 3.5Z" />
    </svg>
  );

  if (p === "facebook") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M18 2H2v16h7.5v-5.5H7V9.5h2.5V7.5A3.5 3.5 0 0113 4h3v3.5h-2c-.6 0-1 .3-1 1v1h3l-.5 3H13V18H18V2Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );

  if (p === "linkedin") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <rect x="2" y="2" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 9v5.5M6 6.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 14.5V11a2.5 2.5 0 015 0v3.5M9.5 9v5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  if (p === "shopee") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M7 7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4.5 7h11l-1.5 9.5h-8L4.5 7Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );

  if (p === "tokopedia") return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M10 2L3 7v11h14V7L10 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M7 18v-7h6v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Generic link icon fallback
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
      <path
        d="M9 11a4 4 0 005.657 0l3-3A4 4 0 0012 2.343l-2 2"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <path
        d="M11 9a4 4 0 00-5.657 0l-3 3A4 4 0 008 17.657l2-2"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  );
}
