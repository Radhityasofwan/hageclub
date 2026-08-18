import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1C1C1E",
          foreground: "#FFFFFF",
        },
        background: "#FFFFFF",
        accent: {
          DEFAULT: "#F5F5F5",
          foreground: "#1C1C1E",
        },
        muted: {
          DEFAULT: "#8E8E93",
          foreground: "#636366",
        },
        border: "#E5E5EA",
        destructive: {
          DEFAULT: "#FF3B30",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#34C759",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#FF9500",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "8px",
      },
    },
  },
  plugins: [
    function scrollbarHide({ addUtilities }: PluginAPI) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      });
    },
  ],
};

export default config;
