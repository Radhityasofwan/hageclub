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

const allFontClasses = [
  spaceGrotesk.variable, barlowCondensed.variable, syne.variable,
  raleway.variable, bebasNeue.variable, josefinSans.variable,
  exo2.variable, montserrat.variable,
  rajdhani.variable, russoOne.variable, bigShouldersDisplay.variable,
  oswald.variable, teko.variable, anton.variable, cormorantGaramond.variable,
  outfit.variable, dmSans.variable, plusJakartaSans.variable,
  inter.variable, nunitoSans.variable, karla.variable,
  jost.variable, urbanist.variable, manrope.variable, workSans.variable,
  ledger.variable, googleSans.variable, oxygen.variable,
].join(" ");

export async function generateMetadata(): Promise<Metadata> {
  let favicon = "/favicon.svg";
  try {
    const settings = await getSettingValues(["brand_favicon"]);
    if (settings.brand_favicon) favicon = settings.brand_favicon;
  } catch {
    // fallback favicon if settings query fails
  }

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
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const locale = headersList.get("x-locale") ?? "id";

  const fontSettings = await getSettingValues(["brand_font_display", "brand_font_body"]);
  const displayId = ALL_FONT_IDS.has(fontSettings.brand_font_display ?? "")
    ? (fontSettings.brand_font_display as string)
    : DEFAULT_DISPLAY_FONT;
  const bodyId = ALL_FONT_IDS.has(fontSettings.brand_font_body ?? "")
    ? (fontSettings.brand_font_body as string)
    : DEFAULT_BODY_FONT;

  const displayFont = DISPLAY_FONTS.find(f => f.id === displayId) ?? DISPLAY_FONTS[0];

  const fontCss = `:root{--font-display:var(${FONT_CSS_VAR[displayId]});--font-sans:var(${FONT_CSS_VAR[bodyId]});--heading-weight:${displayFont.headingWeight};--heading-tracking:${displayFont.headingTracking};}`;

  return (
    <html lang={locale} className={allFontClasses}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: fontCss }} />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
