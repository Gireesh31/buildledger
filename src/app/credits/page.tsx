import { ExternalLink, Images } from "lucide-react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader, stagger } from "@/components/ui/primitives";
import { imageCredits } from "@/lib/image-credits";

export const metadata: Metadata = { title: "Image credits" };

export default function CreditsPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <PageHeader
          icon={Images}
          accent="violet"
          title="Image credits"
          description="The material and vehicle photos come from Wikimedia Commons and are used under the licences below. Thank you to the photographers."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {imageCredits.map((credit, i) => (
            <li
              key={credit.source}
              className="animate-fade-up flex gap-3 rounded-2xl border border-foreground/[0.07] bg-surface p-3 shadow-sm"
              style={stagger(i, 30)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={credit.image} alt={credit.title} width={96} height={72} loading="lazy" className="product-stage h-18 w-24 shrink-0 rounded-lg object-contain" />
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium" title={credit.title}>
                  {credit.title}
                </p>
                <p className="text-foreground/60">{credit.artist ? `Photo by ${credit.artist}` : "Author listed on the source page"}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {credit.licenseUrl ? (
                    <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      {credit.license}
                    </a>
                  ) : (
                    <span>{credit.license}</span>
                  )}
                  <a href={credit.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground/60 hover:text-brand">
                    Source <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-foreground/50">
          Photos were adapted for the app: backgrounds removed, cropped to the product and resized. Licences marked BY-SA require that shared adaptations use the same licence.
        </p>
      </main>
    </>
  );
}
