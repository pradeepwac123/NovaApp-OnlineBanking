import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Color Tokens ─────────────────────────────────────────────────────
      // Elevated Standard design system — light banking theme
      // Keys use hyphens so Tailwind generates bg-primary, text-on-surface, etc.
      colors: {
        // Primary brand — blue (#0058bc)
        "primary":              "#0058bc",
        "primary-container":    "#d8e2ff",
        "on-primary":           "#ffffff",
        "on-primary-container": "#001a41",

        // Secondary / accent surfaces
        "secondary":                  "#565e71",
        "secondary-container":        "#d8e2ff",
        "on-secondary":               "#ffffff",
        "on-secondary-container":     "#001a41",
        "secondary-fixed":            "#d8e2ff",
        "on-secondary-fixed":         "#001a41",

        // Surface hierarchy — background layering via color shifts, not borders.
        // Use these instead of borders to separate sections and cards.
        "surface":                   "#f7f9fb",  // main app background
        "surface-container-lowest":  "#ffffff",  // cards, modals, inputs
        "surface-container-low":     "#f2f4f6",  // content area fills
        "surface-container":         "#eceef0",  // grouped sections
        "surface-container-high":    "#e6e8ea",  // raised elements / tracks

        // Text tokens — never use pure black (#000) or pure white (#fff) for text
        "on-surface":         "#191c1e",  // primary text
        "on-surface-variant": "#414755",  // secondary / label text

        // Semantic states
        "error":   "#ba1a1a",
        "success": "#006d3b",
        "warning": "#7d5700",
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        // Display & headline copy — Manrope for visual weight and character
        display: ["Manrope", "sans-serif"],
        // Body, labels, UI chrome — Inter for legibility at small sizes
        sans: ["Inter", "sans-serif"],
      },

      // ─── Font Size Scale ──────────────────────────────────────────────────
      // Each entry: [fontSize, { lineHeight }]
      fontSize: {
        // Display — hero sections, large numerical callouts
        "display-lg": ["3.5rem",   { lineHeight: "1.1",  fontWeight: "700" }],
        "display-md": ["2.75rem",  { lineHeight: "1.15", fontWeight: "700" }],
        "display-sm": ["2.25rem",  { lineHeight: "1.2",  fontWeight: "700" }],

        // Headline — section titles, card headers
        "headline-lg": ["2rem",   { lineHeight: "1.25", fontWeight: "600" }],
        "headline-md": ["1.75rem", { lineHeight: "1.3",  fontWeight: "600" }],
        "headline-sm": ["1.5rem",  { lineHeight: "1.35", fontWeight: "600" }],

        // Title — sub-sections, widget headers
        "title-lg": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["1rem",     { lineHeight: "1.5", fontWeight: "600" }],
        "title-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "600" }],

        // Body — prose, descriptions
        "body-lg": ["1rem",     { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.75rem",  { lineHeight: "1.5", fontWeight: "400" }],

        // Label — form labels, tags, status chips
        "label-lg": ["0.875rem",  { lineHeight: "1.4", fontWeight: "500" }],
        "label-md": ["0.75rem",   { lineHeight: "1.4", fontWeight: "500" }],
        "label-sm": ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },

      // ─── Spacing Scale ────────────────────────────────────────────────────
      // Extends Tailwind's default scale — use these tokens for all padding,
      // margin, and gap values. Never use arbitrary pixel values.
      spacing: {
        "1":  "0.25rem",  //  4px
        "2":  "0.5rem",   //  8px
        "3":  "0.75rem",  // 12px
        "4":  "1rem",     // 16px
        "5":  "1.25rem",  // 20px
        "6":  "1.5rem",   // 24px
        "8":  "2rem",     // 32px
        "10": "2.5rem",   // 40px
        "12": "3rem",     // 48px
      },

      // ─── Border Radius Scale ──────────────────────────────────────────────
      // NO 90-degree corners. Minimum rounding is "sm" on all elements.
      borderRadius: {
        sm:      "0.25rem",  //  4px — minimum rounding (e.g. chips, badges)
        DEFAULT: "0.5rem",   //  8px — default cards, inputs
        md:      "0.75rem",  // 12px — prominent cards
        lg:      "1rem",     // 16px — modals, large panels
        xl:      "1.5rem",   // 24px — hero cards, full-bleed sections
        full:    "9999px",   // pills, avatar circles
      },

      // ─── Box Shadow Tokens ────────────────────────────────────────────────
      // Depth is expressed via shadow, NOT borders. Two tiers:
      // ambient  — resting state, subtle lift for cards/sections
      // elevated — hover/active state, interactive feedback
      boxShadow: {
        // ambient — resting state lift for floating elements (drawers, dropdowns)
        ambient:  "0 12px 32px rgba(25, 28, 30, 0.04)",
        // elevated — hover/active state lift
        elevated: "0 8px 24px rgba(25, 28, 30, 0.06)",
        // card — blue-tinted shadow for the decorative virtual card face
        card:     "0 8px 32px rgba(0, 88, 188, 0.14)",
        // focus-ring — primary focus indicator
        "focus-ring": "0 0 0 3px rgba(0, 88, 188, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
