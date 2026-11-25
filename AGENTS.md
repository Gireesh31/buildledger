<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design system
Before any UI work on the website or the mobile app, read DESIGN.md. Build only from its tokens: on the website use the theme in src/app/globals.css (Tailwind classes like bg-brand, text-foreground, shadow-card, font-display), in the mobile app use mobile/src/theme.ts (colors, radius, fonts, shadow). design-system/tokens.css and theme.css hold the same values for other tools. Never hard-code a colour, font size, radius or shadow; if a value is missing, add a token in globals.css and theme.ts, and to design-system/roles.json. Check new screens against design-system/preview.html.
