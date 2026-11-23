"use client";

import { ChevronLeft, ChevronRight, Gift, Megaphone, Sparkles, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Announcement, AnnouncementKind, AnnouncementMedia } from "@/lib/app-config";

const STYLE: Record<AnnouncementKind, { icon: LucideIcon; tag: string }> = {
  news: { icon: Megaphone, tag: "Announcement" },
  feature: { icon: Sparkles, tag: "New feature" },
  offer: { icon: Gift, tag: "Offer" },
};

const STORAGE_KEY = "buildledger.dismissedAnnouncements";
const ROTATE_MS = 8000;

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

/**
 * Announcements, new features and offers the admin published, shown inside the dashboard's animated
 * header: one at a time with its images and videos, turning over on its own. Each can be closed;
 * it stays closed in this browser.
 */
export function AnnouncementBar({ announcements }: { announcements: Announcement[] }) {
  // Nothing shows on the server (it can't know what was closed); the browser then reads its list.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const dismissed = parse(raw);
  const visible = announcements.filter((a) => dismissed && !dismissed.includes(a.id));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = visible.length;
  const current = visible[Math.min(index, count - 1)];

  // Turn over every few seconds, unless the pointer or keyboard focus is on it, or a video is in it.
  const hasVideo = current?.media.some((m) => m.type === "video");
  useEffect(() => {
    if (count < 2 || paused || hasVideo) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [count, paused, hasVideo, index]);

  if (!current) return null;

  function dismiss(id: string) {
    const next = [...(dismissed ?? []), id].slice(-50);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: it just comes back next visit.
    }
    setIndex(0);
    listeners.forEach((l) => l());
  }

  const { icon: Icon, tag } = STYLE[current.kind];
  const external = current.linkUrl?.startsWith("https://");
  const go = (step: number) => setIndex((i) => (Math.min(i, count - 1) + step + count) % count);

  return (
    <section
      aria-label="Announcements"
      aria-roledescription="carousel"
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <article
        key={current.id}
        aria-roledescription="slide"
        aria-label={`${Math.min(index, count - 1) + 1} of ${count}`}
        className="animate-fade-up flex flex-col gap-4 rounded-xl border border-foreground/10 bg-surface/85 p-4 shadow-card backdrop-blur-sm md:flex-row"
      >
        {current.media.length > 0 && <MediaGallery key={current.id} media={current.media} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
              <Icon className="h-3.5 w-3.5" aria-hidden /> {tag}
            </p>
            <button
              type="button"
              onClick={() => dismiss(current.id)}
              className="rounded-md p-1 text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
              aria-label={`Close “${current.title}”`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-snug">{current.title}</h2>
          {current.body && <p className="mt-1 whitespace-pre-line text-sm text-foreground/75">{current.body}</p>}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
            {current.linkUrl ? (
              external ? (
                <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand underline-offset-2 hover:underline">
                  {current.linkLabel ?? "Learn more"} ↗
                </a>
              ) : (
                <Link href={current.linkUrl} className="text-sm font-semibold text-brand underline-offset-2 hover:underline">
                  {current.linkLabel ?? "Learn more"} →
                </Link>
              )
            ) : (
              <span />
            )}
            {count > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => go(-1)} className="rounded-md p-1 text-foreground/60 hover:bg-foreground/10" aria-label="Previous announcement">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {visible.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show announcement ${i + 1}`}
                    aria-current={a.id === current.id}
                    className={`h-1.5 rounded-full transition-all ${a.id === current.id ? "w-5 bg-brand" : "w-1.5 bg-foreground/25 hover:bg-foreground/40"}`}
                  />
                ))}
                <button type="button" onClick={() => go(1)} className="rounded-md p-1 text-foreground/60 hover:bg-foreground/10" aria-label="Next announcement">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

/** The announcement's pictures and videos: a large one, with small ones below to switch between. */
function MediaGallery({ media }: { media: AnnouncementMedia[] }) {
  const [shown, setShown] = useState(0);
  const item = media[Math.min(shown, media.length - 1)];
  return (
    <div className="w-full shrink-0 md:w-[46%]">
      <div className="overflow-hidden rounded-lg bg-foreground/5">
        {item.type === "image" ? (
          // Uploaded by an admin to storage; a plain img keeps it off the image optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <video key={item.url} src={item.url} className="aspect-video w-full bg-black object-contain" controls playsInline muted autoPlay loop preload="metadata" />
        )}
      </div>
      {media.length > 1 && (
        <ul className="mt-2 flex gap-2" aria-label="More pictures and videos">
          {media.map((m, i) => (
            <li key={m.path}>
              <button
                type="button"
                onClick={() => setShown(i)}
                aria-label={`Show ${m.type} ${i + 1}`}
                aria-current={i === shown}
                className={`block h-10 w-16 overflow-hidden rounded-md border-2 ${i === shown ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={m.url} className="h-full w-full bg-black object-cover" muted playsInline preload="metadata" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
