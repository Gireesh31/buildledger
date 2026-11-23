"use client";

import { LayoutDashboard, ListChecks, Megaphone, ToggleRight, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/forms", label: "Forms", icon: ListChecks },
  { href: "/admin/features", label: "Features", icon: ToggleRight },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="overflow-x-auto">
      <p className="mb-2 text-sm font-medium text-brand">Admin panel</p>
      <ul className="flex gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active ? "bg-foreground font-medium text-background" : "text-foreground/70 hover:bg-brand-soft hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
