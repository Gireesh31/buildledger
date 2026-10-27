"use client";

import {
  BarChart3,
  Images,
  LayoutDashboard,
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

// Each section keeps its own colour so it's easy to spot.
const tabs: { href: string; label: string; icon: LucideIcon; color: string }[] = [
  { href: "", label: "Overview", icon: LayoutDashboard, color: "text-orange-500" },
  { href: "/materials", label: "Materials", icon: Package, color: "text-amber-500" },
  { href: "/labour", label: "Labour", icon: Users, color: "text-emerald-500" },
  { href: "/transport", label: "Transport", icon: Truck, color: "text-sky-500" },
  { href: "/daily-log", label: "Daily log", icon: NotebookPen, color: "text-violet-500" },
  { href: "/files", label: "Bills & photos", icon: Images, color: "text-rose-500" },
  { href: "/team", label: "Team", icon: UsersRound, color: "text-indigo-500" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "text-fuchsia-500" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-stone-500" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav aria-label="Project sections" className="no-print overflow-x-auto">
      <ul className="flex min-w-max gap-1 py-2">
        {tabs.map(({ href: path, label, icon: Icon, color }) => {
          const href = `${base}${path}`;
          const active = path === "" ? pathname === base : pathname.startsWith(href);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-all duration-200 ${
                  active
                    ? "bg-brand font-medium text-white shadow-sm shadow-brand/30"
                    : "text-foreground/70 hover:bg-brand-soft hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-white" : color}`} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
