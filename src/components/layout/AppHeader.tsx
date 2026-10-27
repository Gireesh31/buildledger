import { HardHat } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "@/components/auth/UserMenu";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link href="/" className={`font-display group flex items-center gap-2 font-bold tracking-tight ${size === "lg" ? "text-xl" : "text-base"}`}>
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-sm shadow-orange-500/30 transition-transform duration-300 group-hover:-rotate-6 ${
          size === "lg" ? "h-10 w-10" : "h-8 w-8"
        }`}
      >
        <HardHat className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.2} />
      </span>
      <span>
        Build<span className="text-brand">Ledger</span>
      </span>
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-foreground/[0.07] bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <Suspense fallback={<span className="skeleton h-8 w-28 rounded-lg" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
