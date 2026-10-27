import { ArrowLeft, HardHat } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { buttonClass } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <span className="animate-fade-up flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
          <HardHat className="h-8 w-8" aria-hidden />
        </span>
        <p className="animate-fade-up mt-6 text-sm font-semibold text-brand" style={{ animationDelay: "60ms" }}>
          404
        </p>
        <h1 className="animate-fade-up mt-1 text-3xl font-semibold tracking-tight" style={{ animationDelay: "120ms" }}>
          This page isn’t on site
        </h1>
        <p className="animate-fade-up mt-2 max-w-md text-foreground/60" style={{ animationDelay: "180ms" }}>
          It may have been moved or removed. Head back to your dashboard to find your projects.
        </p>
        <Link href="/" className={`animate-fade-up mt-8 ${buttonClass("primary")}`} style={{ animationDelay: "240ms" }}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to dashboard
        </Link>
      </main>
    </>
  );
}
