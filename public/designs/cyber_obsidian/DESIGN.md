---
name: Cyber Obsidian
colors:
  surface: '#0f141b'
  surface-dim: '#0f141b'
  surface-bright: '#353941'
  surface-container-lowest: '#0a0e15'
  surface-container-low: '#181c23'
  surface-container: '#1c2027'
  surface-container-high: '#262a32'
  surface-container-highest: '#31353d'
  on-surface: '#dfe2ed'
  on-surface-variant: '#bacbbc'
  inverse-surface: '#dfe2ed'
  inverse-on-surface: '#2c3139'
  outline: '#859588'
  outline-variant: '#3b4a3f'
  surface-tint: '#12e28c'
  primary: '#46fca3'
  on-primary: '#00391f'
  primary-container: '#00df89'
  on-primary-container: '#005d36'
  inverse-primary: '#006d40'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#d9ddff'
  on-tertiary: '#1a2b6a'
  tertiary-container: '#b4c0ff'
  on-tertiary-container: '#3d4c8c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#56ffa8'
  primary-fixed-dim: '#12e28c'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#00522f'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001354'
  on-tertiary-fixed-variant: '#334282'
  background: '#0f141b'
  on-background: '#dfe2ed'
  surface-variant: '#31353d'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The design system is engineered for a high-performance AI agency, projecting an image of cutting-edge intelligence and rapid growth. The aesthetic combines **Dark Mode Minimalism** with **Glassmorphism**, creating a sophisticated "Command Center" feel. 

The visual language relies on the juxtaposition of deep, infinite backgrounds (Deep Obsidian Black) and vibrant, luminous energy (Cyber Emerald and Cyan). This creates a high-contrast environment that directs user attention toward conversion points. The emotional response is one of precision, futuristic innovation, and data-driven reliability.

## Colors

The palette is optimized for OLED displays and high-impact readability. 

- **Deep Obsidian Black (#070B12):** Used for the primary canvas to provide infinite depth.
- **Cyber Emerald (#00DF89):** The primary action color, signifying growth and "Go" signals. Used for main CTAs and success states.
- **Cyber Cyan (#06B6D4):** A secondary accent used for data visualization, technical details, and interactive hover states.
- **Surface & Text:** Layers are built using semi-transparent slates. Secondary text uses a muted slate to ensure a clear information hierarchy without competing with primary headings.

## Typography

This design system utilizes a high-contrast typographic scale to emphasize authority and technical precision.

- **Headlines:** Montserrat provides a geometric, bold foundation that feels architectural and modern. Use heavy weights (700-800) for "hero" sections to create a sense of scale.
- **Body:** Inter is used for its exceptional legibility in dark mode. Its neutral character ensures that complex AI concepts are easy to digest.
- **Technical Labels:** Geist (Monospace) is used for small labels, data points, and metadata to reinforce the developer-centric, "high-tech" agency vibe.

## Layout & Spacing

The layout follows a **fluid grid system** with generous vertical rhythm to give content "room to breathe," reflecting a premium service.

- **Grid:** A 12-column grid for desktop with 24px gutters.
- **Margins:** Large 80px side margins on desktop to center the gaze.
- **Sectioning:** Use significant vertical padding (120px+) between major sections to prevent visual clutter and maintain the minimalist aesthetic.
- **Mobile:** Transition to a 4-column grid with 20px margins. Elements should stack vertically, maintaining the 8px component radius throughout.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Luminous Glows** rather than traditional drop shadows.

1.  **Base Layer:** Solid Deep Obsidian (#070B12).
2.  **Mid Layer (Glass Cards):** `background: rgba(255, 255, 255, 0.03)` with a `backdrop-filter: blur(12px)`.
3.  **Borders:** Use thin, 1px semi-transparent borders `rgba(255, 255, 255, 0.1)` to define edges without adding bulk.
4.  **Interactive Glow:** Primary buttons and active states should feature a soft outer glow (box-shadow) using the Primary Accent color with a high spread and low opacity (e.g., `0 0 20px rgba(0, 223, 137, 0.3)`).

## Shapes

The design system uses a consistent **8px (0.5rem) radius** for cards, input fields, and standard buttons to maintain a "technical yet accessible" feel. 

- **Functional Elements:** 8px radius for standard components.
- **Interactive Toggles/Badges:** Use **Pill-shaped (3)** rounding for status indicators and toggle switches to differentiate them from structural layout blocks.
- **Iconography:** Use linear, 2px stroke icons with slightly rounded terminals to match the typography.

## Components

- **Glass Cards:** The primary container. Must have a 1px border (`white/10`) and a subtle gradient fill from `white/5` to `transparent`.
- **Glowing Buttons:** Primary CTAs use a solid Cyber Emerald fill with black text. On hover, increase the outer glow intensity. Secondary buttons use a "Ghost" style with an Emerald border and text.
- **Pill Toggles:** High-contrast toggles with a Cyber Cyan active track and a white circular handle.
- **Sticky Navigation:** A glassmorphic bar at the top of the viewport with a `backdrop-filter: blur(20px)` and a bottom border of `white/10`.
- **Input Fields:** Deep slate background (#0F172A) with an 8px radius. On focus, the border transitions to Cyber Cyan with a subtle inner glow.
- **Data Chips:** Small, pill-shaped tags with a Cyber Cyan tint background (10% opacity) and solid Cyan text for categorizing AI services.