import { announcementKinds } from "@/lib/app-config";
import type { AnnouncementInput } from "./app-settings";

function parseDate(value: unknown): { ok: true; value?: string } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true };
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return { ok: false };
  return { ok: true, value: new Date(value).toISOString() };
}

/** A link to https or to a page on this site ("/projects/new"); never javascript: or other schemes. */
const isSafeLink = (url: string) => url.length <= 500 && (/^https:\/\/[^\s]+$/.test(url) || /^\/(?!\/)[^\s]*$/.test(url));

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
    },
  };
}
