import { Images } from "lucide-react";
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
          description="The material and vehicle pictures were created with Canva AI for BuildLedger."
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {imageCredits.map((credit, i) => (
            <li
              key={credit.image}
              className="animate-fade-up flex min-w-0 flex-col gap-2 rounded-xl border border-foreground/[0.07] bg-surface p-3 shadow-sm"
              style={stagger(i, 30)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={credit.image} alt={credit.title} width={200} height={150} loading="lazy" className="product-stage aspect-[4/3] w-full rounded-lg object-contain" />
              <p className="truncate text-sm font-medium" title={credit.title}>
                {credit.title}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
