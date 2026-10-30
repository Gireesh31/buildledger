import type { Metadata } from "next";
import { Anek_Latin, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Suspense } from "react";
import { BackgroundFX } from "@/components/layout/BackgroundFX";
import { PageMotion } from "@/components/layout/PageMotion";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

// IBM Plex Sans for body text and figures, Anek Latin (an Indian-made grotesque with a width axis)
// for headings, IBM Plex Mono for labels, measurements and scanned bill text. latin-ext carries ₹.
const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const anek = Anek_Latin({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "BuildLedger", template: "%s · BuildLedger" },
  description: "Track construction materials, labour, transport and site progress for every project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexSans.variable} ${anek.variable} ${plexMono.variable} h-full antialiased`}>
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
