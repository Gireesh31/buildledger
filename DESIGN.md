---
version: alpha
name: "BuildLedger"
description: "BuildLedger's design system: concrete greys, forest green and brass, Fraunces headings and Source Sans 3 text. Shared by the website and the mobile app."
colors:
  background: "#f4f4f2"
  text: "#1b1f1ca6"
  heading: "#1b1f1c"
  text-muted: "#1b1f1c99"
  text-subtle: "#1b1f1c73"
  border: "#1b1f1c14"
  surface: "#ffffff"
  surface-inverse: "#163d27"
  text-inverse: "#ffffffb3"
  primary: "#1f5135"
  primary-foreground: "#ffffff"
  primary-hover: "#163d27"
  link: "#1f5135"
  primary-soft: "#e8f0ea"
  ink: "#1a2420"
  accent: "#8a6410"
  accent-soft: "#f6eedb"
  success: "#1e7a46"
  warning: "#c08a12"
  critical: "#b42318"
  brass: "#b8860b"
  chart-1: "#2f6b4a"
  chart-2: "#b8860b"
  chart-3: "#5f655f"
typography:
  display:
    fontFamily: "\"Fraunces\", \"Source Sans 3\", Georgia, serif"
    fontSize: 70.5px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.01em
  h1:
    fontFamily: "\"Fraunces\", \"Source Sans 3\", Georgia, serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.01em
  h2:
    fontFamily: "\"Fraunces\", \"Source Sans 3\", Georgia, serif"
    fontSize: 27px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.01em
  h3:
    fontFamily: "\"Fraunces\", \"Source Sans 3\", Georgia, serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.01em
  h4:
    fontFamily: "\"Fraunces\", \"Source Sans 3\", Georgia, serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.01em
  body-lg:
    fontFamily: "\"Source Sans 3\", ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "\"Source Sans 3\", ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "\"Source Sans 3\", ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.333
  overline:
    fontFamily: "\"Source Sans 3\", ui-sans-serif, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.5
  code:
    fontFamily: "\"IBM Plex Mono\", ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 11.5px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.12em
  caption:
    fontFamily: "\"Source Sans 3\", ui-sans-serif, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  2xl: 16px
  full: 9999px
spacing:
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "7": 28px
  "8": 32px
  "10": 40px
  "16": 64px
  section: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.heading}"
    rounded: "{rounded.lg}"
    padding: "8px 25px"
    height: 48px
  button-secondary-hover:
    backgroundColor: "#fff0e5"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0px 25px"
    height: 48px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.2xl}"
    padding: 28px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.heading}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: 38px
  badge:
    backgroundColor: "#ecfdf5"
    textColor: "#007a55"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  link:
    textColor: "{colors.link}"
  band-inverse:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
  navigation:
    backgroundColor: "#ffffffe6"
    height: 70px
---

<!-- extract-design: the front matter above is generated from design-system/roles.json. Change roles.json, then run extract.mjs --rebuild to refresh it. The prose below is yours. -->

# BuildLedger design system

> Concrete & green: chosen on 2026-11-25 to replace the earlier safety-orange look. Spacing and layout were measured from the live website (9 page visits at 1440px and 390px); colours and fonts come from `src/app/globals.css` and `mobile/src/theme.ts`. The website and the mobile app share this one system.

## Overview

A calm, established look, like the office of a builder who has been around for decades. Pages are plain concrete grey (`{colors.background}` `#f4f4f2`), content sits on white cards with hairline borders, and the one action colour is a deep forest green (`{colors.primary}` `#1f5135`). Headlines are set in Fraunces, a classic serif, which is what makes it feel printed and trustworthy rather than app-generated. Brass (`{colors.brass}` `#b8860b`) is a small highlight, never a fill for large areas. There are no glows, gradients, dot grids or glassy panels: depth comes from borders and one soft shadow.

## Colors

| Token | Value | Use it for |
|---|---|---|
| `{colors.background}` | `#f4f4f2` | the page, everywhere |
| `{colors.surface}` | `#ffffff` | cards, forms, the header and the footer |
| `{colors.heading}` | `#1b1f1c` | headings and totals |
| `{colors.text}` | `#1b1f1c` at 65% | body copy |
| `{colors.text-muted}` | `#1b1f1c` at 60% | secondary copy: quantities, dates, captions (4.28:1, keep it 14px+) |
| `{colors.text-subtle}` | `#1b1f1c` at 45% | placeholders only |
| `{colors.border}` | `#1b1f1c` at 8% | card and table borders |
| `{colors.primary}` | `#1f5135` | the one main action per screen, the open tab, links, the budget bar |
| `{colors.primary-hover}` | `#163d27` | hover and pressed; also the closing panel on the home page |
| `{colors.primary-soft}` | `#e8f0ea` | icon tiles, selected rows, the secondary button's hover |
| `{colors.ink}` | `#1a2420` | the app's dark home header and dark callouts (amounts owed) |
| `{colors.brass}` | `#b8860b` | small highlights: a beacon, a marker, an accent line. Never body text on white (3.0:1) |
| `{colors.accent}` | `#8a6410` | brass that is dark enough for text (5.0:1) |
| `{colors.accent-soft}` | `#f6eedb` | tint behind brass items and notices |
| `{colors.success}` | `#1e7a46` | paid, active, saved |
| `{colors.warning}` | `#c08a12` | partly paid, due soon (badges with dark text, not text on its own) |
| `{colors.critical}` | `#b42318` | unpaid, balance due, delete, errors |

- White on `{colors.primary}` is 9.6:1, so button labels can be any weight.
- Payment status colours mean status only; never use them as decoration.
- Charts start with `{colors.chart-1}` green, then brass, then grey.
- Icon chips use a calm set: green, slate, stone and brass, with rose only for things that need attention. No rainbow of section colours.

## Typography

- **Headings and big numbers**: Fraunces, weight 600 (bold classes on headings render at 600), tracking -0.01em, line height 1.15. Never set body text in Fraunces.
- **Text, labels, tables, buttons**: Source Sans 3, 400 for text, 600 for labels and buttons. 14–16px, line height 1.5–1.6.
- **Codes and scanned bill text**: IBM Plex Mono, only there.
- Small labels above a section or number (`.eyebrow`) are Source Sans 3 600 at 13px in sentence case: no uppercase, no letter-spacing, no mono.
- Money is always `₹` with Indian digit grouping (₹38,42,600). Both fonts carry ₹. Amounts use tabular figures so columns line up.
- Sentence case everywhere.

| Token | Size | Phone | Weight | Font |
|---|---|---|---|---|
| `{typography.display}` | 70.5px | 41.6px | 600 | Fraunces |
| `{typography.h1}` | 48px | 30px | 600 | Fraunces |
| `{typography.h2}` | 27px | 24px | 600 | Fraunces |
| `{typography.h3}` | 24px | same | 600 | Fraunces |
| `{typography.body-lg}` | 16px | same | 400 | Source Sans 3 |
| `{typography.body}` | 14px | same | 400 | Source Sans 3 |
| `{typography.overline}` | 13px | same | 600 | Source Sans 3 |

## Layout

- 4px grid; steps 4, 8, 12, 16, 20, 24, 28, 32, 40, 64px.
- 64px between sections, 24–28px inside cards. Content width 1152px.
- Sections are separated by space and hairlines, not colour bands. The header is solid white with a 1px line under it.
- Hero text is left-aligned on desktop and centred on phones; forms sit in one centred white card about 380px wide; on phones buttons go full width.

## Elevation & Depth

- Cards: 1px `{colors.border}` plus `--shadow-sm` (`0 1px 2px` at 5%). That's all.
- Dialogs and floating callouts: `--shadow-lg`.
- Hover on a clickable card: a darker border and a small shadow, 1px lift at most.
- Nothing glows, nothing is blurred glass, no coloured shadows.

## Shapes

Website corners: 6px badges, 8px buttons and fields, 12px small cards, 16px main cards. App corners: 8 / 12 / 14px (`radius.sm/md/lg` in `mobile/src/theme.ts`).

## Components

- **Primary button**: `{colors.primary}` fill, white Source Sans 3 600 label, 8px corners, 40–48px tall; hover `{colors.primary-hover}`.
- **Secondary button**: white with a 1px border, ink label; hover `{colors.primary-soft}`.
- **Field**: white, 1px border, 8px corners, 38–44px tall; focus ring in green.
- **Project card**: white 16px card; an icon tile in `{colors.primary-soft}`; the name in 16px 600; location in muted text; a status badge; then two labelled totals in Fraunces and a green budget bar on a light grey track.
- **Entry row**: a square white thumbnail with a border, the item over "qty × rate" in muted text, the amount right-aligned in 600.
- **Status badge**: 6px corners, soft tint fill, darker text of the same hue, a small dot.
- **Project tabs**: icons all in one muted colour; the open tab is a green pill with white text.

## Do's and Don'ts

### Do

- Use the tokens for every colour, size, space, radius and shadow; if one is missing, add it to `globals.css`, `theme.ts` and `design-system/roles.json`.
- Keep one green button per screen; everything else is secondary or a link.
- Lead with money: big Fraunces `₹` totals, quantities as "120 bags × ₹390".
- Pair every card shadow with a hairline border.
- Keep pages plain grey with white cards.

### Don't

- No gradients, glows, dot grids, blurred glass or coloured shadows.
- No uppercase spaced-out labels and no mono type outside codes.
- No rainbow icon colours per section.
- No orange: it was the old brand.
- No brass text on white, and no Fraunces for body text.
- No numbers without ₹ and Indian grouping.

## Motion

150ms for hovers, 250–500ms for things appearing, `cubic-bezier(0.2, 0.7, 0.2, 1)`. Content fades up a little on scroll. Everything respects `prefers-reduced-motion`.

## Iconography & Graphics

- Icons are Lucide on both the website and the app: line style, 1.75px stroke, round caps and joins, in the text colour or green.
- Illustrations are flat line drawings of cranes, scaffolding and buildings in concrete greys with small brass accents (a hanging load, a beacon). They sit behind content at the bottom of the hero and in the footer, never over text.
- Material and vehicle pictures are realistic product photos on pure white in small square tiles with a border.
- Avoid gradients, 3D, cartoon people and stock photos of workers.

## Known Gaps

- Signed-in pages (dashboard, materials, transport, labour, reports, admin) were not measured; they use the same tokens.
- No dark mode.
- The logo tile, favicon and app icon artwork still need redrawing in green; the tile on the site follows `{colors.primary}` already.

## Files

- `design-system/tokens.css`, `theme.css`, `design.tokens.json`: the same tokens for other tools.
- `design-system/roles.json`: the choices behind the names. Change it and run `extract.mjs --rebuild`.
- `design-system/preview.html`: a sample page built only from the tokens.
- The live sources are `src/app/globals.css` (website) and `mobile/src/theme.ts` (app).

## Mobile app

The app (`mobile/`) uses the same system through `mobile/src/theme.ts`. React Native can't read CSS variables, so the values are copied there: when a token changes here, change it there too.

| Token | In `mobile/src/theme.ts` |
|---|---|
| `{colors.primary}` | `colors.brand` |
| `{colors.primary-hover}` | `colors.brandStrong` |
| `{colors.primary-soft}` | `colors.brandSoft` |
| `{colors.brass}` | `colors.brass` (and `colors.brassLight` on dark backgrounds) |
| `{colors.ink}` | `colors.ink` |
| `{colors.background}` | `colors.background` |
| `{colors.surface}` | `colors.surface` |
| `{colors.heading}` | `colors.text` |
| `{colors.critical}` | `colors.critical` |
| fonts sans / display / mono | `fonts.regular`…`fonts.bold` / `fonts.display` / `fonts.mono` |
