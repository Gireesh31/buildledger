"use client";

import {
  BarChart3,
  ChevronDown,
  Images,
  LayoutDashboard,
  MoreHorizontal,
  NotebookPen,
  Package,
  Settings,
  Users,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Tab {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short?: string;
  icon: LucideIcon;
  color: string;
}

// The everyday sections are always visible; the rest sit in the "More" menu at the corner.
// Each section keeps its own colour so it's easy to spot.
const mainTabs: Tab[] = [
  { href: "", label: "Overview", icon: LayoutDashboard, color: "text-orange-500" },
  { href: "/materials", label: "Materials", icon: Package, color: "text-amber-500" },
  { href: "/labour", label: "Labour", icon: Users, color: "text-emerald-500" },
  { href: "/transport", label: "Transport", icon: Truck, color: "text-sky-500" },
];

const moreTabs: Tab[] = [
  { href: "/daily-log", label: "Daily log", icon: NotebookPen, color: "text-violet-500" },
  { href: "/files", label: "Bills & photos", icon: Images, color: "text-rose-500" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "text-fuchsia-500" },
  { href: "/team", label: "Team", icon: UsersRound, color: "text-indigo-500" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-stone-500" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const isActive = (path: string) => (path === "" ? pathname === base : pathname.startsWith(`${base}${path}`));
  const activeMore = moreTabs.find((tab) => isActive(tab.href));

  return (
    <nav aria-label="Project sections" className="no-print">
      {/* Phones: five equal cells, icon over label. Wider screens: pills, with "More" at the right corner. */}
      <ul className="grid grid-cols-5 gap-1 py-2 sm:flex sm:items-center sm:gap-1">
        {mainTabs.map((tab) => (
          <li key={tab.label}>
            <TabLink tab={tab} href={`${base}${tab.href}`} active={isActive(tab.href)} />
          </li>
        ))}
        <li className="sm:ml-auto">
          <MoreMenu base={base} active={activeMore} isActive={isActive} />
        </li>
      </ul>
    </nav>
  );
}

function TabLink({ tab, href, active }: { tab: Tab; href: string; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] transition-all duration-200 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3.5 sm:py-2 sm:text-sm ${
        active ? "bg-foreground font-medium text-background" : "text-foreground/70 hover:bg-brand-soft hover:text-foreground"
      }`}
    >
      <Icon className={`h-5 w-5 sm:h-4 sm:w-4 ${active ? "text-white" : tab.color}`} aria-hidden />
      <span className="whitespace-nowrap">{tab.short ?? tab.label}</span>
    </Link>
  );
}

/** Corner dropdown for the less-used sections. Shows the current section's name when one of them is open. */
function MoreMenu({ base, active, isActive }: { base: string; active?: Tab; isActive: (path: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a click outside or with Escape (choosing an item closes it too).
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Icon = active?.icon ?? MoreHorizontal;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] transition-all duration-200 sm:flex-row sm:gap-1.5 sm:rounded-full sm:border sm:px-3.5 sm:py-2 sm:text-sm ${
          active
            ? "bg-foreground font-medium text-background sm:border-foreground"
            : "text-foreground/70 hover:bg-brand-soft hover:text-foreground sm:border-foreground/15"
        }`}
      >
        <Icon className={`h-5 w-5 sm:h-4 sm:w-4 ${active ? "text-white" : "text-foreground/60"}`} aria-hidden />
        <span className="flex items-center gap-0.5 whitespace-nowrap">
          {active ? <span className="max-w-16 truncate sm:max-w-none">{active.label}</span> : "More"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      {open && (
        <ul
          role="menu"
          className="animate-scale-in absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-foreground/[0.08] bg-surface p-1.5 shadow-xl"
        >
          {moreTabs.map((tab) => {
            const TabIcon = tab.icon;
            const current = isActive(tab.href);
            return (
              <li key={tab.label} role="none">
                <Link
                  role="menuitem"
                  href={`${base}${tab.href}`}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    current ? "bg-brand-soft font-medium text-brand" : "text-foreground/80 hover:bg-brand-soft"
                  }`}
                >
                  <TabIcon className={`h-4 w-4 ${tab.color}`} aria-hidden />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
