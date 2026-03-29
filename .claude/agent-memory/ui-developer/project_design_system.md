---
name: Elevated Standard design system tokens
description: Full token mapping for the NovaPay light banking theme — colors, typography, spacing, radius, shadows, and CSS utility classes
type: project
---

NovaPay uses the "Elevated Standard" light banking design system. Tokens live in two files:
- `D:\NovaApp-Task\tailwind.config.ts` — Tailwind tokens
- `D:\NovaApp-Task\app\globals.css` — CSS custom properties + utility classes

**Why:** Project was migrated from a dark purple/teal theme to a light blue banking theme. All components must align to the new system.

**How to apply:** Always reference tokens below. Never introduce magic numbers, dark backgrounds, or the old purple (#6C3CE1) / teal (#00D4AA) palette.

## Color Tokens (Tailwind class names)

IMPORTANT: tailwind.config.ts uses **hyphenated keys** (e.g. `"secondary-container"`).
Use hyphens in all class names: `bg-secondary-container`, `text-on-surface`, etc.

| Token name (hyphenated)      | Value    | Usage                                    |
|------------------------------|----------|------------------------------------------|
| `primary`                    | #0058bc  | buttons, links, active states            |
| `primary-container`          | #d8e2ff  | tinted surfaces, selected fills          |
| `on-primary`                 | #ffffff  | text on primary backgrounds              |
| `on-primary-container`       | #001a41  | text on primary-container                |
| `secondary-container`        | #d8e2ff  | selected chips, tinted surfaces          |
| `on-secondary-container`     | #001a41  | text on secondary-container              |
| `secondary-fixed`            | #d8e2ff  | quick-action chips (fully rounded)       |
| `on-secondary-fixed`         | #001a41  | text on secondary-fixed chips            |
| `surface`                    | #f7f9fb  | main app background                      |
| `surface-container-lowest`   | #ffffff  | cards, inputs, modals, drawers           |
| `surface-container-low`      | #f2f4f6  | input rest state, list item fills        |
| `surface-container`          | #eceef0  | grouped sections                         |
| `surface-container-high`     | #e6e8ea  | progress tracks, raised elements         |
| `on-surface`                 | #191c1e  | primary text (never pure black)          |
| `on-surface-variant`         | #414755  | secondary/muted text, labels             |
| `error`                      | #ba1a1a  | error states                             |
| `success`                    | #006d3b  | success states                           |

## CSS Custom Properties (globals.css :root)

| Variable              | Value                                  |
|-----------------------|----------------------------------------|
| `--outline-variant`   | rgba(65, 71, 85, 0.15)                 |
| `--surface-tint`      | rgba(0, 88, 188, 0.10)                 |
| `--gradient-primary`  | linear-gradient(135deg, #0058bc, #0070eb) |
| `--gradient-text`     | linear-gradient(135deg, #0058bc, #0070eb) |
| `--glass-bg`          | rgba(255, 255, 255, 0.80)              |
| `--glass-blur`        | 12px                                   |

## Typography

- Display/Headline font: **Manrope** (`font-display` Tailwind class)
- Body/Label font: **Inter** (`font-sans` or default body)
- Font size classes: `text-display-lg`, `text-display-md`, `text-display-sm`, `text-headline-lg/md/sm`, `text-title-lg/md/sm`, `text-body-lg/md/sm`, `text-label-lg/md/sm`

## Spacing Scale

Extends Tailwind default: spacing-1 (0.25rem) through spacing-12 (3rem).

## Border Radius Scale

sm (0.25rem), DEFAULT (0.5rem), md (0.75rem), lg (1rem), xl (1.5rem), full (9999px).
NO 90-degree corners anywhere — minimum `rounded-sm`.

## Shadows (Tailwind + utility classes)

- `shadow-ambient` / `shadow-ambient` Tailwind: `0 12px 32px rgba(25,28,30,0.04)` — resting cards
- `shadow-elevated` / `shadow-elevated` Tailwind: `0 8px 24px rgba(25,28,30,0.06)` — hover state
- `shadow-focus-ring` Tailwind: `0 0 0 3px rgba(0,88,188,0.25)` — focus indicator

## Utility Classes (globals.css)

- `.glass` — white glassmorphism for nav/overlays (no border, depth via blur + shadow)
- `.gradient-text` — primary gradient clipped to text
- `.gradient-btn` — primary CTA with hover/active/focus-visible states
- `.surface-lowest / low / base / high` — surface hierarchy via bg color
- `.shadow-ambient` / `.shadow-elevated` — shadow utilities
- `.animate-float` — GPU-only float animation (transform only)

## Design Rules (enforce always)

1. NO 1px solid borders for containment — use background color shifts
2. NO horizontal divider lines — use spacing
3. NO pure black (#000000) — use `on_surface` (#191c1e)
4. NO old colors: #6C3CE1, #0F0E17, #1A1928, #00D4AA
5. Primary buttons use `--gradient-primary` (135deg)
6. Glassmorphism = white base (not dark) + 12px blur

## Admin Component Patterns (D:\NovaApp-Task\components\admin\)

All admin components fully migrated to Elevated Standard light theme (2026-03-29).

- **StatCard** — white (`bg-surface-container-lowest`) card, tonal left accent strip (no shadow). Accent color uses semantic: primary/success/warning/error strip.
- **StatusBadge** — semantic container tones (no border): success=bg-[#c8f5de] text-[#005229], warning=bg-[#ffefd5] text-[#7a5900], danger=bg-[#ffdad6] text-[#ba1a1a], info=bg-secondary-container text-on-secondary-container, neutral=bg-surface-container text-on-surface-variant
- **Tabs** — pill trough `bg-surface-container-low`, active pill = `bg-secondary-container text-on-secondary-container`, inactive = `text-on-surface-variant`
- **DataTable** — no borders; alternating row bg: even=`bg-surface-container-lowest`, odd=`bg-surface-container-low`; header=`bg-surface-container-low text-on-surface-variant`
- **Modal** — `bg-surface-container-lowest` panel, `shadow-ambient`, scrim = `bg-on-surface/30`
- **AdminSidebar** — `bg-surface-container-lowest`, active nav = `bg-secondary-container text-on-secondary-container`, inactive = `text-on-surface-variant hover:bg-surface-container`
- Panel cards (Fraud, KYC, Settings, Analytics): `bg-surface-container-low` on `bg-surface` page
- Primary CTA: `gradient-btn` class
- Secondary: `bg-surface-container-high text-on-surface-variant`
- Destructive: `bg-[#ffdad6] text-[#ba1a1a]` (error container)
- Positive: `bg-[#c8f5de] text-[#005229]` (success container)
- Warning: `bg-[#ffefd5] text-[#7a5900]` (warning container)
- Admin page root: `bg-surface text-on-surface`, loading spinner uses `border-primary`
- Mobile pages (app/mobile/page.tsx, app/mobile/stream/page.tsx): same light tokens, `bg-surface` base
