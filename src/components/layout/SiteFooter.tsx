import { ArrowRight, Camera, IndianRupee, Smartphone } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/primitives";
import { ConstructionScene } from "./ConstructionScene";
import { CurrentYear } from "./CurrentYear";
import { Logo } from "./AppHeader";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Dashboard" },
      { href: "/projects/new", label: "New project" },
      { href: "/onboarding", label: "Getting started" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/profile", label: "Profile" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
      { href: "/forgot-password", label: "Forgot password" },
    ],
  },
];

const highlights = [
  { icon: IndianRupee, text: "Amounts in ₹ with Indian grouping" },
  { icon: Camera, text: "Scan bills to fill forms" },
  { icon: Smartphone, text: "Works on your phone" },
];

export function SiteFooter() {
  return (
    <footer className="scene-sky no-print relative mt-16 overflow-hidden border-t border-foreground/[0.07]">
      <div className="h-0.5 bg-brand" aria-hidden />
      <ConstructionScene />

      {/* Content sits above the scene; the bottom padding leaves room for the site. */}
      <div className="relative mx-auto max-w-6xl px-4 pb-[200px] pt-12 sm:pb-[270px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-foreground/[0.07] bg-surface/70 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-semibold">Every bag of cement, every truck, every wage.</p>
            <p className="text-sm text-foreground/60">Keep your whole site on one ledger and know where every rupee went.</p>
          </div>
          <Link href="/projects/new" className={`${buttonClass("primary")} shrink-0`}>
            Start a project <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-xs text-sm text-foreground/65">
              Track materials, labour, transport and daily progress for every construction site, in one place.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">{column.title}</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-foreground/75 transition-colors hover:text-brand">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Built for site work</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/75">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-soft">
                    <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright line sits on the ground strip of the scene. */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 py-2 text-[11px] text-white/80 sm:py-3 sm:text-xs">
          <p>
            © <CurrentYear /> BuildLedger. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Built for site engineers and contractors in India
          </p>
        </div>
      </div>
    </footer>
  );
}
