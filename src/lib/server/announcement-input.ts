import { ANNOUNCEMENT_MEDIA_TYPES, announcementKinds, MAX_ANNOUNCEMENT_MEDIA, type AnnouncementMedia } from "@/lib/app-config";
import type { AnnouncementInput } from "./app-settings";

function parseDate(value: unknown): { ok: true; value?: string } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true };
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return { ok: false };
  return { ok: true, value: new Date(value).toISOString() };
}

/** A link to https or to a page on this site ("/projects/new"); never javascript: or other schemes. */
const isSafeLink = (url: string) => url.length <= 500 && (/^https:\/\/[^\s]+$/.test(url) || /^\/(?!\/)[^\s]*$/.test(url));

const mediaExts = new Set(Object.values(ANNOUNCEMENT_MEDIA_TYPES).map((t) => t.ext));

/** Files uploaded through /api/admin/announcements/media: a generated name with a known extension. */
function parseMedia(value: unknown): Omit<AnnouncementMedia, "url">[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ANNOUNCEMENT_MEDIA) return null;
  const out: Omit<AnnouncementMedia, "url">[] = [];
  for (const item of value) {
    const path = typeof item?.path === "string" ? item.path : "";
    const match = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.([a-z0-9]+)$/.exec(path);
    if (!match || !mediaExts.has(match[1]) || out.some((m) => m.path === path)) return null;
    const type = Object.values(ANNOUNCEMENT_MEDIA_TYPES).find((t) => t.ext === match[1])!.type;
    out.push({ type, path });
  }
  return out;
}

/** Checks an announcement sent from the admin panel. */
export function parseAnnouncement(body: unknown): { ok: true; input: AnnouncementInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;
  const kind = announcementKinds.find((k) => k.value === b.kind)?.value;
  if (!kind) return { ok: false, error: "Choose a type." };
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title || title.length > 120) return { ok: false, error: "Title is required (up to 120 characters)." };
  const text = typeof b.body === "string" ? b.body.trim() : "";
  if (text.length > 1000) return { ok: false, error: "Message must be 1000 characters or fewer." };
  const linkUrl = typeof b.linkUrl === "string" ? b.linkUrl.trim() : "";
  if (linkUrl && !isSafeLink(linkUrl)) return { ok: false, error: "Link must start with https:// or be a page on this site, like /projects/new." };
  const linkLabel = typeof b.linkLabel === "string" ? b.linkLabel.trim() : "";
  if (linkLabel.length > 40) return { ok: false, error: "Button text must be 40 characters or fewer." };
  const startsAt = parseDate(b.startsAt);
  const endsAt = parseDate(b.endsAt);
  if (!startsAt.ok || !endsAt.ok) return { ok: false, error: "Enter valid dates." };
  if (startsAt.value && endsAt.value && endsAt.value <= startsAt.value) return { ok: false, error: "End date must be after the start date." };
  const media = parseMedia(b.media);
  if (!media) return { ok: false, error: `Add up to ${MAX_ANNOUNCEMENT_MEDIA} images or videos, uploaded with “Add image or video”.` };
  return {
    ok: true,
    input: {
      kind,
      title,
      body: text,
      ...(linkUrl && { linkUrl, linkLabel: linkLabel || "Learn more" }),
      ...(startsAt.value && { startsAt: startsAt.value }),
      ...(endsAt.value && { endsAt: endsAt.value }),
      published: b.published !== false,
      media,
    },
  };
}
