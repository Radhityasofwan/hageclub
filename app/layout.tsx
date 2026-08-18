import type { Metadata } from "next";
import {
  Space_Grotesk, Barlow_Condensed, Syne, Raleway,
  Bebas_Neue, Josefin_Sans, Exo_2, Montserrat,
  Rajdhani, Russo_One, Big_Shoulders_Display, Oswald, Teko, Anton, Cormorant_Garamond,
  Outfit, DM_Sans, Plus_Jakarta_Sans, Inter,
  Nunito_Sans, Karla, Jost, Urbanist, Manrope, Work_Sans,
} from "next/font/google";
import localFont from "next/font/local";
import { SessionProvider } from "@/components/providers/session-provider";
import { getSettingValues } from "@/lib/settings";
import {
  DISPLAY_FONTS,
  DEFAULT_DISPLAY_FONT, DEFAULT_BODY_FONT,
  FONT_CSS_VAR, ALL_FONT_IDS,
} from "@/lib/brand-fonts";
import "./globals.css";

// ── Display fonts ──────────────────────────────────────────────────────────────
const spaceGrotesk    = Space_Grotesk    ({ weight: ["400","500","600","700"],              subsets: ["latin"], display: "swap", variable: "--font-space-grotesk"    });
const barlowCondensed = Barlow_Condensed ({ weight: ["400","500","600","700","800","900"],  subsets: ["latin"], display: "swap", variable: "--font-barlow-condensed" });
const syne            = Syne             ({ weight: ["400","500","600","700","800"],        subsets: ["latin"], display: "swap", variable: "--font-syne"             });
const raleway         = Raleway          ({ weight: ["300","400","500","600","700","800"],  subsets: ["latin"], display: "swap", variable: "--font-raleway"          });
const bebasNeue       = Bebas_Neue       ({ weight: ["400"],                               subsets: ["latin"], display: "swap", variable: "--font-bebas-neue"       });
const josefinSans     = Josefin_Sans     ({ weight: ["300","400","500","600","700"],        subsets: ["latin"], display: "swap", variable: "--font-josefin-sans"     });
const exo2            = Exo_2            ({ weight: ["300","400","500","600","700","800"],  subsets: ["latin"], display: "swap", variable: "--font-exo-2"            });
const montserrat      = Montserrat       ({ weight: ["300","400","500","600","700","800"],  subsets: ["latin"], display: "swap", variable: "--font-montserrat"       });

// ── Body fonts ─────────────────────────────────────────────────────────────────
const outfit          = Outfit           ({ weight: ["300","400","500","600","700"],        subsets: ["latin"], display: "swap", variable: "--font-outfit"           });
const dmSans          = DM_Sans          ({                                                subsets: ["latin"], display: "swap", variable: "--font-dm-sans"          });
const plusJakartaSans = Plus_Jakarta_Sans({ weight: ["300","400","500","600","700","800"],  subsets: ["latin"], display: "swap", variable: "--font-plus-jakarta-sans" });
const inter           = Inter            ({                                                subsets: ["latin"], display: "swap", variable: "--font-inter"            });
const nunitoSans      = Nunito_Sans      ({                                                subsets: ["latin"], display: "swap", variable: "--font-nunito-sans"      });
const karla               = Karla                ({ weight: ["300","400","500","600","700","800"],         subsets: ["latin"], display: "swap", variable: "--font-karla"               });
const rajdhani            = Rajdhani             ({ weight: ["400","500","600","700"],                    subsets: ["latin"], display: "swap", variable: "--font-rajdhani"            });
const russoOne            = Russo_One            ({ weight: ["400"],                                      subsets: ["latin"], display: "swap", variable: "--font-russo-one"           });
const bigShouldersDisplay = Big_Shoulders_Display({ weight: ["400","500","600","700","800","900"],        subsets: ["latin"], display: "swap", variable: "--font-big-shoulders-display" });
const oswald              = Oswald               ({ weight: ["200","300","400","500","600","700"],        subsets: ["latin"], display: "swap", variable: "--font-oswald"              });
const teko                = Teko                 ({ weight: ["300","400","500","600","700"],              subsets: ["latin"], display: "swap", variable: "--font-teko"                });
const anton               = Anton                ({ weight: ["400"],                                      subsets: ["latin"], display: "swap", variable: "--font-anton"               });
const cormorantGaramond   = Cormorant_Garamond   ({ weight: ["300","400","500","600","700"],              subsets: ["latin"], display: "swap", variable: "--font-cormorant-garamond"  });
const jost                = Jost                 ({                                                       subsets: ["latin"], display: "swap", variable: "--font-jost"                });
const urbanist            = Urbanist             ({ weight: ["100","200","300","400","500","600","700","800","900"], subsets: ["latin"], display: "swap", variable: "--font-urbanist"  });
const manrope             = Manrope              ({                                                       subsets: ["latin"], display: "swap", variable: "--font-manrope"             });
const workSans            = Work_Sans            ({                                                       subsets: ["latin"], display: "swap", variable: "--font-work-sans"           });

// ── Local fonts ───────────────────────────────────────────────────────────────
const ledger     = localFont({ src: "./fonts/ledger-regular.ttf",        weight: "400",     display: "swap", variable: "--font-ledger"         });
const googleSans = localFont({ src: "./fonts/google-sans-variable.ttf",  weight: "100 900", display: "swap", variable: "--font-google-sans"    });
const oxygen     = localFont({
  src: [
    { path: "./fonts/oxygen-light.ttf",   weight: "300", style: "normal" },
    { path: "./fonts/oxygen-regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/oxygen-bold.ttf",    weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-oxygen",
});

// Map font ID → CSS variable class
const fontVariableById: Record<string, string> = {
  "space-grotesk": spaceGrotesk.variable,
  "barlow-condensed": barlowCondensed.variable,
  "syne": syne.variable,
  "raleway": raleway.variable,
  "bebas-neue": bebasNeue.variable,
  "josefin-sans": josefinSans.variable,
  "exo-2": exo2.variable,
  "montserrat": montserrat.variable,
  "rajdhani": rajdhani.variable,
  "russo-one": russoOne.variable,
  "big-shoulders-display": bigShouldersDisplay.variable,
  "oswald": oswald.variable,
  "teko": teko.variable,
  "anton": anton.variable,
  "cormorant-garamond": cormorantGaramond.variable,
  "outfit": outfit.variable,
  "dm-sans": dmSans.variable,
  "plus-jakarta-sans": plusJakartaSans.variable,
  "inter": inter.variable,
  "nunito-sans": nunitoSans.variable,
  "karla": karla.variable,
  "jost": jost.variable,
  "urbanist": urbanist.variable,
  "manrope": manrope.variable,
  "work-sans": workSans.variable,
  "ledger": ledger.variable,
  "google-sans": googleSans.variable,
  "oxygen": oxygen.variable,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingValues(["brand_favicon"]);
  const favicon = settings.brand_favicon ?? "/favicon.svg";

  return {
    title: {
      default: "HAGE CLUB — The Pinnacle of Refined Comfort",
      template: "%s | HAGE CLUB",
    },
    description:
      "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
    keywords: ["hage club", "automotive lifestyle", "fashion", "polo", "hoodie", "jacket"],
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: process.env.NEXT_PUBLIC_APP_URL,
      siteName: "HAGE CLUB",
      title: "HAGE CLUB — The Pinnacle of Refined Comfort",
      description:
        "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
    },
    twitter: {
      card: "summary_large_image",
      title: "HAGE CLUB — The Pinnacle of Refined Comfort",
      description:
        "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
    },
    robots: { index: true, follow: true },
    icons: { icon: favicon },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // No headers() call here — root layout is not forced dynamic.
  // Font settings fetched from in-memory cache (5-min TTL).
  const fontSettings = await getSettingValues(["brand_font_display", "brand_font_body"]);
  const displayId = ALL_FONT_IDS.has(fontSettings.brand_font_display ?? "")
    ? (fontSettings.brand_font_display as string)
    : DEFAULT_DISPLAY_FONT;
  const bodyId = ALL_FONT_IDS.has(fontSettings.brand_font_body ?? "")
    ? (fontSettings.brand_font_body as string)
    : DEFAULT_BODY_FONT;

  const displayFont = DISPLAY_FONTS.find(f => f.id === displayId) ?? DISPLAY_FONTS[0];
  const fontCss = `:root{--font-display:var(${FONT_CSS_VAR[displayId]});--font-sans:var(${FONT_CSS_VAR[bodyId]});--heading-weight:${displayFont.headingWeight};--heading-tracking:${displayFont.headingTracking};}`;

  // Public pages: only inject the 2 active fonts into the HTML class list.
  // Next.js only emits @font-face CSS for fonts whose .variable class is rendered,
  // so inactive fonts are excluded from the CSS payload (significant size reduction).
  const fontClasses = [
    fontVariableById[displayId] ?? spaceGrotesk.variable,
    displayId !== bodyId ? (fontVariableById[bodyId] ?? outfit.variable) : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // lang="id" is the default; I18nProvider corrects it client-side from cookie for EN users.
    <html lang="id" className={fontClasses}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: fontCss }} />
        {/* Preconnect to image CDN for faster LCP */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
