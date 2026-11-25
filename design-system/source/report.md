# What was measured on buildledger-sable.vercel.app

2026-11-25 · 9 page visits (5 at 1440px, 3 at 390px, 1 in dark mode) · 2 stylesheets read · built with Next.js, Tailwind classes

Read this, then look at the screenshots before you name anything. Every number below is how much of the site uses the value; trust the screenshots over a heuristic.

## Pages

- ✓ desktop · https://buildledger-sable.vercel.app/ · “BuildLedger”
- ✓ desktop · https://buildledger-sable.vercel.app/projects/new · “Sign in · BuildLedger”
- ✓ desktop · https://buildledger-sable.vercel.app/profile · “Sign in · BuildLedger”
- ✓ desktop · https://buildledger-sable.vercel.app/onboarding · “Sign in · BuildLedger”
- ✓ desktop · https://buildledger-sable.vercel.app/forgot-password · “Forgot password · BuildLedger”
- ✓ phone · https://buildledger-sable.vercel.app/ · “BuildLedger”
- ✓ phone · https://buildledger-sable.vercel.app/projects/new · “Sign in · BuildLedger”
- ✓ phone · https://buildledger-sable.vercel.app/profile · “Sign in · BuildLedger”
- ✓ dark · https://buildledger-sable.vercel.app/ · “BuildLedger”

## Colour roles (first guess: check them)

| Role | Value | Contrast on background | Why |
|---|---|---|---|
| background | `#f5f3ee` | 1:1 | the page background on most pages |
| text | `#16161aa6` | 5.39:1 | body copy (paragraphs and lists) |
| heading | `#16161a` | 16.27:1 | headings (h1–h6) |
| text-muted | `#16161b99` | 4.58:1 | 13% of text: secondary copy |
| text-subtle | `#16161b73` | 2.91:1 | 6% of text: the quietest copy |
| border | `#1a1a1a14` | 1.17:1 | the most used border colour (by length) |
| surface | `#ffffff` | 1.11:1 | panels and sections a step off the background |
| surface-inverse | `#16161a` | 16.27:1 | the contrasting band (dark sections on a light site, or the reverse) |
| text-inverse | `#ffffffa6` | 1.07:1 | text on the contrasting band |
| primary | `#e8590c` | 3.23:1 | the main buttons, and the site's own --brand token |
| primary-foreground | `#ffffff` | 1.11:1 | text on primary buttons |
| primary-hover | `#c44a08` | 4.37:1 | primary buttons on :hover |
| link | `#e8590c` | 3.23:1 | links in running text |

Primary, the candidates (share of the start page's prominent buttons · average share per page · share of links):

- `#e8590c`: start page 65% · per page 93% · links 29%
- `#0069a8`: start page 0% · per page 0% · links 0%
- `#c44a08`: start page 0% · per page 0% · links 0%
- `#ffb86a`: start page 0% · per page 0% · links 0%

If two are close, the site is probably changing its style: pick the one on the start page's main button (look at desktop-home-1.jpg) and say so in DESIGN.md.

Chart colours, in order: `#e8590c` (the primary) · `#0069a8` (blue, 0.9% of colour use) · `#00bc7d` (green, 0% of colour use, mostly in gradients)

## Palette (every colour, most used first)

| Name | Hex | OKLCH | Share | Used for | Pages |
|---|---|---|---|---|---|
| white | `#ffffff` | oklch(100.0% 0.000 0) | 29.9% | bg 96%, text 4% | 5 |
| neutral-950-a65 | `#16161aa6` (oklab(0.20197 0.00214528 -0.00761044 / 0.65)) | oklch(20.2% 0.008 285.7) | 9.8% | text 100% | 1 |
| white-a70 | `#ffffffb2` (oklab(0.999994 0.0000455677 0.0000200868 / 0.7)) | oklch(100.0% 0.000 0) | 8.1% | bg 100% | 1 |
| neutral-950 | `#16161a` | oklch(20.2% 0.008 285.7) | 7.1% | text 65%, bg 35% | 5 |
| neutral-950-a70 | `#15151ab3` (oklab(0.20197 0.00214528 -0.00761044 / 0.7)) | oklch(19.8% 0.010 285.5) | 6% | text 100% | 5 |
| neutral-950-a8 | `#1a1a1a14` (oklab(0.20197 0.00214528 -0.00761044 / 0.08)) | oklch(21.8% 0.000 0) | 7.6% | border 96%, bg 4% | 5 |
| neutral-950-a60 | `#16161b99` (oklab(0.20197 0.00214528 -0.00761044 / 0.6)) | oklch(20.2% 0.010 285.5) | 4% | text 100% | 5 |
| neutral-950-a40 | `#16161966` | oklch(20.2% 0.006 285.9) | 3.2% | icon 100% | 1 |
| neutral-950-a55 | `#16161a8c` (oklab(0.20197 0.00214528 -0.00761044 / 0.55)) | oklch(20.2% 0.008 285.7) | 2.8% | text 63%, icon 37% | 1 |
| white-a85 | `#ffffffd9` (oklab(0.999994 0.0000455678 0.0000200868 / 0.85)) | oklch(100.0% 0.000 0) | 2.5% | text 100% | 5 |
| sand-900-a13 | `#3c2d1e21` | oklch(31.0% 0.033 66.1) | 2.5% | gradient 100% | 5 |
| orange-500 | `#e8590c` | oklch(64.4% 0.192 41.7) | 2% | text 76%, bg 23%, gradient 0% | 5 |
| neutral-950-a45 | `#16161b73` (oklab(0.20197 0.00214528 -0.00761044 / 0.45)) | oklch(20.2% 0.010 285.5) | 1.8% | text 100% | 5 |
| orange-500-a7 | `#e8590c12` | oklch(64.4% 0.192 41.7) | 1.2% | gradient 100% | 5 |
| yellow-300-a6 | `#fab2190f` | oklch(81.1% 0.164 78.5) | 1.2% | gradient 100% | 5 |
| neutral-950-a10 | `#14141d1a` | oklch(19.6% 0.018 284.6) | 1.2% | border 100% | 1 |
| neutral-950-a15 | `#14141b26` (oklab(0.20197 0.00214528 -0.00761044 / 0.15)) | oklch(19.5% 0.014 285.0) | 1% | border 90%, bg 10% | 5 |
| blue-700 | `#0069a8` | oklch(50.4% 0.128 245.5) | 0.9% | icon 100% | 1 |
| black-a6 | `#0000000f` | oklch(0.0% 0.000 0) | 1% | shadow 100% | 5 |
| white-a65 | `#ffffffa6` (oklab(0.999994 0.0000455678 0.0000200868 / 0.65)) | oklch(100.0% 0.000 0) | 0.8% | text 100% | 1 |
| neutral-950-a75 | `#151519bf` (oklab(0.20197 0.00214528 -0.00761044 / 0.75)) | oklch(19.8% 0.008 285.6) | 0.8% | text 100% | 1 |
| white-a90 | `#ffffffe6` (oklab(0.999994 0.0000455678 0.0000200868 / 0.9)) | oklch(100.0% 0.000 0) | 0.7% | bg 100% | 1 |
| slate-950-a6 | `#1111220f` | oklch(18.7% 0.034 282.6) | 0.6% | border 100% | 1 |
| orange-600 | `#c44a08` | oklch(56.8% 0.169 41.7) | 0.4% | text 100% | 1 |
| orange-500-a35 | `#e8590c59` | oklch(64.4% 0.192 41.7) | 0.4% | border 78%, gradient 22% | 1 |
| neutral-950-a80 | `#16161acc` (oklab(0.20197 0.00214528 -0.00761044 / 0.8)) | oklch(20.2% 0.008 285.7) | 0.3% | text 100% | 5 |
| neutral-950-a4 | `#16161a0a` | oklch(20.2% 0.008 285.7) | 0.7% | shadow 100% | 1 |
| neutral-950-a50 | `#16161a80` (oklab(0.20197 0.00214528 -0.00761044 / 0.5)) | oklch(20.2% 0.008 285.7) | 0.3% | text 100% | 1 |
| neutral-100 | `#f5f3ee` | oklch(96.4% 0.007 88.6) | 0.3% | text 100% | 1 |
| white-a5 | `#ffffff0d` | oklch(100.0% 0.000 0) | 0.2% | gradient 100% | 1 |
| neutral-100-2 | `#fff0e5` | oklch(96.4% 0.022 58.8) | 0.1% | bg 100% | 1 |
| black-a15 | `#00000026` | oklch(0.0% 0.000 0) | 0.2% | shadow 100% | 5 |
| orange-300 | `#ffb86a` (lab(80.8059 21.7313 50.4455)) | oklch(83.4% 0.126 67.2) | 0.1% | text 100% | 1 |
| neutral-950-a35 | `#17171a59` (oklab(0.20197 0.00214528 -0.00761044 / 0.35)) | oklch(20.6% 0.006 285.9) | 0.1% | text 100% | 1 |
| neutral-950-a18 | `#16161a2e` | oklch(20.2% 0.008 285.7) | 0.1% | shadow 100% | 1 |
| white-a20 | `#ffffff33` | oklch(100.0% 0.000 0) | 0.1% | border 100% | 1 |
| green-500-a50 | `#00bb7c80` (oklab(0.695996 -0.162107 0.0511875 / 0.5)) | oklch(69.9% 0.157 160.3) | 0.1% | shadow 100% | 1 |
| orange-500-a16 | `#e6570c29` (color(srgb 0.909804 0.34902 0.0470588 / 0.16)) | oklch(63.9% 0.191 41.3) | 0% | gradient 100% | 1 |
| neutral-950-2 | `#1d1b18` | oklch(22.3% 0.006 78.2) | 0% | gradient 100% | 1 |
| green-500 | `#00bc7d` (lab(66.9756 -58.27 19.5419)) | oklch(70.2% 0.158 160.4) | 0% | gradient 58%, bg 42% | 1 |

Gradients (by area):

- `radial-gradient(70% 45% at 85% -5%, rgba(232, 89, 12, 0.07), rgba(0, 0, 0, 0) 70%), radial-gradient(60% 40% at 0px 0px, rgba(250, 178, 25, 0.06), rgba(0, 0, 0, 0) 70%)`
- `radial-gradient(circle, rgba(60, 45, 30, 0.13) 1px, rgba(0, 0, 0, 0) 1.4px)`
- `radial-gradient(60% 80% at 100% 100%, rgba(232, 89, 12, 0.35), rgba(0, 0, 0, 0) 70%), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, rgba(0, 0, 0, 0) 1px), linear-gradient(rgba(255, 255, 255, …`
- `linear-gradient(rgba(0, 0, 0, 0), color(srgb 0.909804 0.34902 0.0470588 / 0.16) 85%, rgb(232, 89, 12) 100%)`

Text on background (most characters first):

- `#15151ab3` on `#ffffff`: 6.77:1
- `#16161b99` on `#ffffff`: 4.73:1
- `#16161aa6` on `#ffffff`: 5.64:1
- `#ffffffd9` on `#ffffff`: 1:1
- `#16161aa6` on `#f5f3ee`: 5.39:1
- `#16161a` on `#ffffff`: 18.04:1
- `#16161b73` on `#ffffff`: 2.95:1
- `#16161a` on `#f5f3ee`: 16.27:1

## Type

- **IBM Plex Sans** (body): 79.7% of text · weights 400, 500, 600 · Self-hosted
  stack: `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`
- **Anek Latin** (headings): 11.3% of text · weights 600, 700 · Self-hosted
  stack: `"Anek Latin", "Anek Latin Fallback", "IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, sans-serif`
- **IBM Plex Mono** (code): 9% of text · weights 400, 500, 600 · Self-hosted
  stack: `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, monospace`
- Free fonts closest to **Anek Latin**, measured weight by weight (width / ink / x-height as % of the original):
  - Instrument Sans (error 0.139): 600→600 (111/99/103), 700→700 (110/99/103)
  - IBM Plex Sans (error 0.148): 600→600 (110/100/103), 700→700 (109/97/106)
  - Inter Tight (error 0.149): 600→600 (106/100/109), 700→700 (106/98/109)
  - Archivo (error 0.17): 600→600 (108/99/106), 700→700 (110/95/106)

| Role | Size | Phone | Line height | Tracking | Weight | Family | Share | Example |
|---|---|---|---|---|---|---|---|---|
| display | 70.5px | 41.6px | 1.1 | -0.01em | 700 | Anek Latin | 0.9% | Every rupee on site, |
| h1 | 48px | 30px | 1.1 | -0.01em | 700 | Anek Latin | 2.8% | Built around how a site actually runs |
| h2 | 27px | 24px | 1.1 | -0.01em | 600 | Anek Latin | 0.5% | ₹ 38,42,600 |
| h3 | 24px |  | 1.1 | -0.01em | 600 | Anek Latin | 0.8% | ₹6,48,200 |
| h4 | 20px |  | 1.1 | -0.01em | 600 | Anek Latin | 5.2% | ₹ |
| body-lg | 16px |  | 1.5 | 0 | 400 | IBM Plex Sans | 7.9% | Fast to fill in standing on site, clear  |
| body | 14px |  | 1.625 | 0 | 400 | IBM Plex Sans | 53.6% | Pick the material from pictures, enter q |
| body-sm | 12px |  | 1.333 | 0 | 400 | IBM Plex Sans | 12.4% | Kakkanad, Kochi · G+1 · 2,400 sq ft |
| overline | 11.5px |  | 1.5 | 0.12em | 500 uppercase | IBM Plex Mono | 6.1% | Site accounts for Indian builders |
| code | 11.5px |  | 1.5 | 0.12em | 500 | IBM Plex Mono | 3.6% | Site accounts for Indian builders |
| caption | 11px |  | 1.5 | 0 | 400 | IBM Plex Sans | 5.4% | 70% of ₹55,00,000 |

All sizes in use: 70.5px (0.9%, h1) · 48px (2.8%, h2/li) · 27px (0.5%, p) · 24px (0.8%, h1/dd) · 20px (5.2%, h3/a/dd) · 18px (3.7%, p) · 16px (7.9%, p/a) · 14px (53.6%, p/a/li) · 12px (12.4%, p/a/li) · 11.5px (6.1%, p/h2/dt) · 11px (5.4%, p/dd/figcaption) · 10px (0.7%, li)
Weights: 400 72.1% · 500 13.4% · 600 9.2% · 700 5.3% · scale ratio ≈ 1.2 · font smoothing antialiased

## Space

Base unit: **4px** (78.9% of spacing values fit it; 4px fits 78.9%, 8px fits 51.7%).
Most used: 2* (7.4%) · 4 (8%) · 6* (12.1%) · 8 (23.4%) · 10* (6.6%) · 12 (9.7%) · 16 (12.4%) · 20 (3.5%) · 24 (4.6%) · 28 (3.8%) · 32 (2.5%) · 40 (0.9%) · 64 (1.7%)   (* off the grid)
Section padding (top/bottom of full-width bands): 64px; on phones 80px, 64px, 40px, 196px

## Shape

Radii: sm 4px (19%) · md 6px (8.1%) · lg 8px (28.5%) · xl 12px (12.7%) · 2xl 16px (7.2%) · full full (23.5%)
Borders: 1px ×202 · styles solid, dashed
Shadows (lowest first):
- sm: `rgba(22, 22, 26, 0.04) 0px 1px 2px 0px, rgba(22, 22, 26, 0.06) 0px 4px 12px -4px` (17.1%)
- md: `rgba(0, 0, 0, 0.04) 0px 1px 2px 0px, rgba(0, 0, 0, 0.12) 0px 12px 32px -12px` (4.9%)
- lg: `rgba(22, 22, 26, 0.05) 0px 1px 2px 0px, rgba(22, 22, 26, 0.18) 0px 24px 48px -16px` (7.3%)
- ring: `rgba(0, 0, 0, 0.06) 0px 0px 0px 1px inset`
- ring: `oklab(0.695996 -0.162107 0.0511875 / 0.5) 0px 0px 0px 1px inset`
- ring: `rgba(16, 185, 129, 0.33) 0px 0px 0px 2.07396px`
Filters: `backdrop-filter: blur(12px)`

## Layout

Content widths (centred blocks): 1152px, 672px, 1120px, 1408px · max-widths 1152px, 672px, 576px
Breakpoints: none found · mobile-first (min-width queries)
Grids: 4 columns ×7, 3 columns ×4, 8 columns ×4, 2 columns ×3
Home page bands, top to bottom: `#ffffffb2` → `#ffffff`

## Motion

Durations: fast 150ms (×564), base 500ms (×32), slow 800ms (×26) · easings `cubic-bezier(0.4, 0, 0.2, 1)` ×601, `cubic-bezier(0.2, 0.7, 0.2, 1)` ×26, `ease` ×9
Transitioned: color, border-color, background-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from · keyframes tape-creep, fade-up, fade-in, scale-in, shimmer, float, live-pulse, meter-grow, marquee, scan · respects prefers-reduced-motion

## Components (most common first)

Buttons:
- **primary** ×5 “Sign in”: bg `#e8590c`, text `#ffffff`, border none, radius 8px, 36px tall, padding 8/137.6/8/137.6, 14px/1.429 500, shadow `rgba(0, 0, 0, 0.15) 0px -1px 0px 0px inset` · hover: bg `#c44a08`, fg `#ffffff`, border `0px solid rgb(255, 255, 255)` · focus: `1px auto rgb(16, 16, 16)` · transition `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **primary** ×2 “Start your first project”: bg `#e8590c`, text `#ffffff`, border none, radius 8px, 48px tall, padding 8/24/8/24, 14px/1.429 500, shadow `rgba(0, 0, 0, 0.15) 0px -1px 0px 0px inset` · transition `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **secondary** ×1 “Sign in”: bg `#ffffff`, text `#16161a`, border 1px solid `#14141b26`, radius 8px, 48px tall, padding 8/25/8/25, 14px/1.429 500 · hover: bg `#fff0e5`, fg `#16161a`, border `1px solid oklab(0.644168 0.143103 0.12743 / 0.4)` · focus: `1px auto rgb(16, 16, 16)` · transition `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **outline** ×1 “Sign in”: bg `none`, text `#ffffff`, border 1px solid `#ffffff33`, radius 8px, 48px tall, padding 0/25/0/25, 16px/1.5 500 · hover: fg `#ffffff`, border `1px solid oklab(0.999994 0.0000455678 0.0000200868 / 0.2)` · focus: `1px auto rgb(16, 16, 16)` · transition `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
Inputs:
- ×7: bg `#ffffff`, border 1px solid `#14141b26`, radius 8px, 38px tall, padding 8/12/8/12, placeholder `#16161a` · focus: 1px none rgb(16, 16, 16) 
Cards and panels:
- ×7: bg `#ffffff` on `#f5f3ee`, border 1px solid `#1a1a1a14`, radius 16px, padding 28/28/28/28, shadow `rgba(22, 22, 26, 0.04) 0px 1px 2px 0px, rgba(22, 22, 26, 0.06) 0px 4px 12px -4px`
- ×4: bg `#ffffff` on `#f5f3ee`, border 1px solid `#1c1c1c12`, radius 12px, padding 32/32/32/32, shadow `rgba(0, 0, 0, 0.04) 0px 1px 2px 0px, rgba(0, 0, 0, 0.12) 0px 12px 32px -12px`
- ×1: bg `none` on `#ffffff`, border 1px dashed `#14141b26`, radius 12px, padding 16/16/16/16
- ×1: bg `#16161a` on `#f5f3ee`, border none, radius 24px, padding 64/56/64/56
Badges:
- ×1 “Active”: bg `#ecfdf5`, text `#007a55`, radius 6, 11px/1.5 500
Links:
- standalone ×10: `#16161a`, no underline, weight 700 · hover `#16161a` none
- standalone ×5: `#e8590c`, no underline, weight 600 · hover `#e8590c` none
- standalone ×1: `#16161a`, no underline, weight 500 · hover `#16161a` none
- standalone ×1: `#16161b99`, no underline, weight 400 · hover `null` underline
Navigation bar: 70px tall, sticky, bg `#ffffffe6`, backdrop blur(12px)
Footer: bg `#ffffff`, text `#16161a`

## Icons and graphics

5 icons measured, drawn at 20px/12px/16px (viewBox 24), 100% use currentColor.
From their pixels: **line icons**, lines ≈ **1.75px thick at 24px** · median ink coverage 3.5%.
By size: 20px ×3 line (1.75px at 24) · 12px ×1 line (1.58px at 24) · 16px ×1 line (1.75px at 24) · 40 logos and brand marks left out.
From their markup: outline 5 · stroke-width ≈ 2px at 24px where stroked · round caps · round joins.
Look at screens/icons.png before you describe them: payment and partner logos often sit among the icons.
Images: 23 (0 SVG files) · large inline SVG illustrations: 16 · videos: 0 · large canvases: 0

## The site's own colour tokens (names say what they're for)

Read as roles: primary ← `--brand` `#e8590c` · background ← `--background` `#f5f3ee` · surface ← `--surface` `#ffffff` · text ← `--foreground` `#16161a`

The site's own system uses the `--color-` prefix: its tokens come first.

- `--foreground`: `#16161a` (used 79×)
- `--brand`: `#e8590c` (used 36×)
- `--brand-soft`: `#fff0e5` (used 11×)
- `--color-emerald-500`: `#00bc7d` (used 11×)
- `--surface`: `#ffffff` (used 11×)
- `--color-white`: `#ffffff` (used 9×)
- `--color-rose-500`: `#ff2056` (used 7×)
- `--color-black`: `#000000` (used 5×)
- `--background`: `#f5f3ee` (used 4×)
- `--color-amber-500`: `#fe9a00` (used 4×)
- `--color-amber-400`: `#ffb900` (used 3×)
- `--brand-strong`: `#c44a08` (used 2×)
- `--color-amber-300`: `#ffd230` (used 2×)
- `--color-emerald-100`: `#d0fae5` (used 2×)
- `--color-emerald-300`: `#5ee9b5` (used 2×)
- `--color-green-500`: `#00c950` (used 2×)
- `--color-orange-300`: `#ffb86a` (used 2×)
- `--color-orange-500`: `#ff6900` (used 2×)
- `--color-red-500`: `#fb2c36` (used 2×)
- `--color-sky-500`: `#00a6f4` (used 2×)
- `--color-violet-500`: `#8e51ff` (used 2×)
- `--color-amber-100`: `#fef3c6` (used 1×)
- `--color-amber-50`: `#fffbeb` (used 1×)
- `--color-amber-800`: `#973c00` (used 1×)
- `--color-amber-950`: `#461901` (used 1×)
- `--color-emerald-50`: `#ecfdf5` (used 1×)
- `--color-emerald-700`: `#007a55` (used 1×)
- `--color-emerald-800`: `#006045` (used 1×)
- `--color-fuchsia-500`: `#e12afb` (used 1×)
- `--color-green-400`: `#05df72` (used 1×)
- `--color-green-700`: `#008236` (used 1×)
- `--color-indigo-500`: `#615fff` (used 1×)
- `--color-orange-100`: `#ffedd4` (used 1×)
- `--color-orange-700`: `#ca3500` (used 1×)
- `--color-red-400`: `#ff6467` (used 1×)
- `--color-red-700`: `#c10007` (used 1×)
- `--color-rose-100`: `#ffe4e6` (used 1×)
- `--color-rose-200`: `#ffccd3` (used 1×)
- `--color-rose-300`: `#ffa1ad` (used 1×)
- `--color-rose-50`: `#fff1f2` (used 1×)

## The site's own CSS variables (most used first)

Naming: `--tw-*` ×63, `--color-*` ×45, `--text-*` ×18, `--container-*` ×8, `--font-*` ×7, `--radius-*` ×5

- `--spacing`: `.25rem` (used 226×)
- `--foreground`: `#16161a` (used 79×)
- `--brand`: `#e8590c` (used 36×)
- `--color-emerald-500`: `#00bc7d` (used 11×)
- `--surface`: `#ffffff` (used 11×)
- `--brand-soft`: `#fff0e5` (used 11×)
- `--status-critical`: `#d03b3b` (used 10×)
- `--color-white`: `#ffffff` (used 9×)
- `--color-rose-500`: `#ff2056` (used 7×)
- `--default-transition-duration`: `.15s` (used 7×)
- `--default-transition-timing-function`: `cubic-bezier(.4, 0, .2, 1)` (used 7×)
- `--color-black`: `#000000` (used 5×)
- `--color-amber-500`: `#fe9a00` (used 4×)
- `--font-weight-semibold`: `600` (used 4×)
- `--background`: `#f5f3ee` (used 4×)
- `--font-body`: `"IBM Plex Sans", "IBM Plex Sans Fallback"` (used 3×)
- `--font-code`: `"IBM Plex Mono", "IBM Plex Mono Fallback"` (used 3×)
- `--color-amber-400`: `#ffb900` (used 3×)
- `--radius-md`: `.375rem` (used 3×)
- `--font-heading`: `"Anek Latin", "Anek Latin Fallback"` (used 2×)
- `--color-red-500`: `#fb2c36` (used 2×)
- `--color-orange-300`: `#ffb86a` (used 2×)
- `--color-orange-500`: `#ff6900` (used 2×)
- `--color-amber-300`: `#ffd230` (used 2×)
- `--color-green-500`: `#00c950` (used 2×)
- `--color-emerald-100`: `#d0fae5` (used 2×)
- `--color-emerald-300`: `#5ee9b5` (used 2×)
- `--color-sky-500`: `#00a6f4` (used 2×)
- `--color-violet-500`: `#8e51ff` (used 2×)
- `--container-xs`: `20rem` (used 2×)

## Screenshots

- source\screens\desktop-home-1.jpg
- source\screens\desktop-home-2.jpg
- source\screens\desktop-home-3.jpg
- source\screens\desktop-home-4.jpg
- source\screens\desktop-projects-new-1.jpg
- source\screens\desktop-projects-new-2.jpg
- source\screens\desktop-profile-1.jpg
- source\screens\desktop-profile-2.jpg
- source\screens\desktop-onboarding-1.jpg
- source\screens\desktop-onboarding-2.jpg
- source\screens\desktop-forgot-password-1.jpg
- source\screens\desktop-forgot-password-2.jpg
- source\screens\phone-home-1.jpg
- source\screens\phone-home-2.jpg
- source\screens\phone-projects-new-1.jpg
- source\screens\phone-projects-new-2.jpg
- source\screens\phone-profile-1.jpg
- source\screens\phone-profile-2.jpg
- source\screens\dark-home-1.jpg
- source\screens\dark-home-2.jpg
- source\screens\icons.png (the site's icons, enlarged)
- source\screens\fonts-anek-latin.png (the paid font on top, then its closest free matches at their matched weights: pick by eye)

## Notes

- The site looks the same with dark mode on, so there's no dark theme to extract (it may switch with a toggle instead; see css.darkSelectors).
- The CSS has dark-mode selectors (.dark) but the page didn't switch with the system setting: dark mode is a toggle, or a class for dark sections only. Check the screenshots before adding a dark theme.

## Fonts to decide

- sans: IBM Plex Sans is free (open licence).
- display: Anek Latin is a paid font: Instrument Sans stands in for it (the closest free match by measurement). To use the real one, license it, add its @font-face, put it first in this stack and set the weights back to the site's.
- mono: IBM Plex Mono is free (open licence).
