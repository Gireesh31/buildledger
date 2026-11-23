"use client";

import { Gift, Megaphone, Sparkles, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Announcement, AnnouncementKind } from "@/lib/app-config";

const STYLE: Record<AnnouncementKind, { icon: LucideIcon; tag: string; className: string }> = {
  news: { icon: Megaphone, tag: "Announcement", className: "border-sky-500/30 bg-sky-50 dark:bg-sky-500/10" },
  feature: { icon: Sparkles, tag: "New feature", className: "border-violet-500/30 bg-violet-50 dark:bg-violet-500/10" },
  offer: { icon: Gift, tag: "Offer", className: "border-brand/40 bg-brand-soft" },
};

const STORAGE_KEY = "buildledger.dismissedAnnouncements";

const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string | null): string[] | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Announcements, new features and offers the admin published. Each can be closed; it stays closed in this browser. */
export function AnnouncementBar({ announcements }: { announcements: Announcement[] }) {
  // Nothing shows on the server (it can't know what was closed); the browser then reads its list.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const dismissed = parse(raw);

  const visible = announcements.filter((a) => dismissed && !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  function dismiss(id: string) {
    const next = [...(dismissed ?? []), id].slice(-50);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: it just comes back next visit.
    }
    listeners.forEach((l) => l());
  }

  return (
    <ul className="mb-6 flex flex-col gap-3" aria-label="Announcements">
      {visible.map((a) => {
        const { icon: Icon, tag, className } = STYLE[a.kind];
        const external = a.linkUrl?.startsWith("https://");
        return (
          <li key={a.id} className={`animate-fade-up flex items-start gap-3 rounded-xl border px-4 py-3 ${className}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="mr-2 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">{tag}</span>
                <span className="font-semibold">{a.title}</span>
              </p>
              {a.body && <p className="mt-1 whitespace-pre-line text-sm text-foreground/75">{a.body}</p>}
              {a.linkUrl &&
                (external ? (
                  <a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline">
                    {a.linkLabel ?? "Learn more"} ↗
                  </a>
                ) : (
                  <Link href={a.linkUrl} className="mt-1.5 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline">
                    {a.linkLabel ?? "Learn more"} →
                  </Link>
                ))}
            </div>
            <button type="button" onClick={() => dismiss(a.id)} className="rounded-md p-1 text-foreground/50 hover:bg-foreground/10 hover:text-foreground" aria-label={`Close “${a.title}”`}>
              <X className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
