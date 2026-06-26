import type { Config } from "tailwindcss";
import { COLORS } from "@uganda-cbc-sms/brand";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: COLORS.primary.DEFAULT,
          dark: COLORS.primary.dark,
          light: COLORS.primary.light,
        },
        accent: {
          DEFAULT: COLORS.accent.DEFAULT,
          deep: COLORS.accent.deep,
          light: COLORS.accent.light,
        },
        neutral: COLORS.neutral,
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-1": ["clamp(2.25rem,5vw,3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-2": ["clamp(1.875rem,3.5vw,2.5rem)", { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "700" }],
        "heading-1": ["clamp(1.5rem,2.5vw,2rem)", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }],
        "heading-2": ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-3": ["1.0625rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.65" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "600" }],
      },
      spacing: {
        section: "5rem",
        "section-sm": "3.5rem",
      },
      maxWidth: {
        prose: "38rem",
        content: "72rem",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 4px 8px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.08)",
        elevated: "0 8px 24px rgba(15, 23, 42, 0.1), 0 2px 8px rgba(15, 23, 42, 0.04)",
      },
      backgroundImage: {
        "grid-subtle":
          "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.65s ease-out forwards",
        "slide-down": "slide-down 0.22s ease-out forwards",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
