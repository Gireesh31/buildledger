import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import { BackgroundFX } from "@/components/layout/BackgroundFX";
import { PageMotion } from "@/components/layout/PageMotion";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

// Source Sans 3 for body text and figures (clear at small sizes, carries ₹), Fraunces (a classic
// old-style serif) for headings, IBM Plex Mono only for scanned bill text and codes.
// Only the latin files are preloaded: latin-ext (which carries ₹) is still declared and the browser
// fetches it only when a page shows such a character.
const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

// Headings only. The optical-size axis gives big titles finer detail and small ones sturdier strokes.
const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Labels and figures only, mostly below the fold: not worth holding up the first paint.
const plexMono = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "BuildLedger", template: "%s · BuildLedger" },
  description: "Track construction materials, labour, transport and site progress for every project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${fraunces.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BackgroundFX />
        {/* PageMotion uses no request-time data; the boundary just keeps it off the critical path. */}
        <Suspense fallback={null}>
          <PageMotion />
        </Suspense>
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
