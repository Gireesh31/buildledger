import { ArrowRight, Camera, IndianRupee, Smartphone } from "lucide-react";
import Link from "next/link";
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
    <footer className="site-footer no-print relative mt-16 overflow-hidden border-t border-foreground/[0.07]">
      <ConstructionScene />

      {/* Content sits in the sky above the scene; the bottom padding leaves room for the site. */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 pb-[196px] pt-10 sm:grid-cols-4 sm:pb-[256px] lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 flex flex-col items-start gap-3 sm:col-span-4 lg:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-foreground/60">Materials, labour, transport and daily progress for every construction site, in one place.</p>
          <Link href="/projects/new" className="group mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            Start a project <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="eyebrow text-foreground/45">{column.title}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-foreground/70 transition-colors hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 lg:col-span-1">
          <h2 className="eyebrow text-foreground/45">Built for site work</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/70">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright line sits on the soil at the bottom of the scene. */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-1.5 text-[11px] text-white/85 sm:text-xs">
          <p>
            © <CurrentYear /> BuildLedger. All rights reserved.
          </p>
          <p className="hidden sm:block">Built for site engineers and contractors in India</p>
        </div>
      </div>
    </footer>
  );
}
