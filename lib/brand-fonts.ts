export interface FontOption {
  id: string
  name: string
  desc: string
  cssVar: string
  role: "display" | "body"
  headingWeight: string
  headingTracking: string
}

export const DISPLAY_FONTS: FontOption[] = [
  { id: "space-grotesk",    name: "Space Grotesk",    desc: "Sporty & geometric modern",    cssVar: "--font-space-grotesk",    role: "display", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "barlow-condensed", name: "Barlow Condensed", desc: "Motorsport industrial",         cssVar: "--font-barlow-condensed", role: "display", headingWeight: "800", headingTracking: "0.05em"  },
  { id: "syne",             name: "Syne",             desc: "Editorial & premium",           cssVar: "--font-syne",             role: "display", headingWeight: "700", headingTracking: "-0.01em" },
  { id: "raleway",          name: "Raleway",          desc: "Elegan & refined luxury",       cssVar: "--font-raleway",          role: "display", headingWeight: "700", headingTracking: "0.02em"  },
  { id: "bebas-neue",       name: "Bebas Neue",       desc: "Street culture bold",           cssVar: "--font-bebas-neue",       role: "display", headingWeight: "400", headingTracking: "0.08em"  },
  { id: "josefin-sans",     name: "Josefin Sans",     desc: "Geometrik minimalis",           cssVar: "--font-josefin-sans",     role: "display", headingWeight: "600", headingTracking: "0.1em"   },
  { id: "exo-2",            name: "Exo 2",            desc: "Tech automotive dashboard",     cssVar: "--font-exo-2",            role: "display", headingWeight: "700", headingTracking: "0em"     },
  { id: "montserrat",           name: "Montserrat",           desc: "Versatile & classic bold",       cssVar: "--font-montserrat",           role: "display", headingWeight: "700", headingTracking: "-0.01em" },
  { id: "rajdhani",             name: "Rajdhani",             desc: "Technical & automotive",         cssVar: "--font-rajdhani",             role: "display", headingWeight: "700", headingTracking: "0.03em"  },
  { id: "russo-one",            name: "Russo One",            desc: "Bold sporty impact",             cssVar: "--font-russo-one",            role: "display", headingWeight: "400", headingTracking: "0em"     },
  { id: "big-shoulders-display",name: "Big Shoulders Display",desc: "Condensed industrial power",     cssVar: "--font-big-shoulders-display",role: "display", headingWeight: "800", headingTracking: "0.02em"  },
  { id: "oswald",               name: "Oswald",               desc: "Clean condensed premium",        cssVar: "--font-oswald",               role: "display", headingWeight: "700", headingTracking: "0.02em"  },
  { id: "teko",                 name: "Teko",                 desc: "Technical condensed precision",  cssVar: "--font-teko",                 role: "display", headingWeight: "700", headingTracking: "0.05em"  },
  { id: "anton",              name: "Anton",              desc: "Street bold high impact",      cssVar: "--font-anton",              role: "display", headingWeight: "400", headingTracking: "0.04em"  },
  { id: "cormorant-garamond", name: "Cormorant Garamond", desc: "Luxury serif editorial",        cssVar: "--font-cormorant-garamond", role: "display", headingWeight: "600", headingTracking: "0.06em"  },
  { id: "ledger",             name: "Ledger",             desc: "Serif editorial klasik",        cssVar: "--font-ledger",             role: "display", headingWeight: "400", headingTracking: "0.02em"  },
  { id: "google-sans",        name: "Google Sans",        desc: "Geometric signature clean",     cssVar: "--font-google-sans",        role: "display", headingWeight: "700", headingTracking: "-0.01em" },
]

export const BODY_FONTS: FontOption[] = [
  { id: "outfit",            name: "Outfit",            desc: "Modern & nyaman dibaca",      cssVar: "--font-outfit",            role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "dm-sans",           name: "DM Sans",           desc: "Clean editorial",             cssVar: "--font-dm-sans",           role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "plus-jakarta-sans", name: "Plus Jakarta Sans", desc: "Premium contemporary",        cssVar: "--font-plus-jakarta-sans", role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "inter",             name: "Inter",             desc: "Universal sangat terbaca",    cssVar: "--font-inter",             role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "nunito-sans",       name: "Nunito Sans",       desc: "Friendly & clear",            cssVar: "--font-nunito-sans",       role: "body", headingWeight: "700", headingTracking: "-0.01em" },
  { id: "karla",     name: "Karla",     desc: "Humanist grotesque",              cssVar: "--font-karla",     role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "jost",      name: "Jost",      desc: "Geometric Futura-like, premium",  cssVar: "--font-jost",      role: "body", headingWeight: "700", headingTracking: "-0.01em" },
  { id: "urbanist",  name: "Urbanist",  desc: "Ultra-modern grotesque",          cssVar: "--font-urbanist",  role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "manrope",   name: "Manrope",   desc: "Geometric premium contemporary",  cssVar: "--font-manrope",   role: "body", headingWeight: "700", headingTracking: "-0.02em" },
  { id: "work-sans", name: "Work Sans", desc: "Professional & versatile",        cssVar: "--font-work-sans", role: "body", headingWeight: "700", headingTracking: "-0.01em" },
  { id: "oxygen",    name: "Oxygen",    desc: "Humanist sans bersih",            cssVar: "--font-oxygen",    role: "body", headingWeight: "700", headingTracking: "-0.02em" },
]

export const DEFAULT_DISPLAY_FONT = "space-grotesk"
export const DEFAULT_BODY_FONT = "outfit"

export const FONT_CSS_VAR: Record<string, string> = {
  ...Object.fromEntries(DISPLAY_FONTS.map(f => [f.id, f.cssVar])),
  ...Object.fromEntries(BODY_FONTS.map(f => [f.id, f.cssVar])),
}

export const ALL_FONT_IDS = new Set([
  ...DISPLAY_FONTS.map(f => f.id),
  ...BODY_FONTS.map(f => f.id),
])
